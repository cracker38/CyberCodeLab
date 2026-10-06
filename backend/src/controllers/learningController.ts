import type { Request, Response } from "express";
import { db, nowIso } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { id } from "../utils/ids.js";

export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.quizId) as
    | { id: string; title: string; passing_score: number }
    | undefined;
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found." });
    return;
  }
  const questions = db
    .prepare("SELECT id, prompt, type, sort_order FROM questions WHERE quiz_id = ? ORDER BY sort_order")
    .all(quiz.id) as { id: string; prompt: string; type: string }[];
  const qids = questions.map((q) => q.id);
  const answers =
    qids.length === 0
      ? []
      : (db
          .prepare(
            `SELECT id, question_id, label, sort_order FROM answers WHERE question_id IN (${qids.map(() => "?").join(",")}) ORDER BY sort_order`,
          )
          .all(...qids) as { id: string; question_id: string; label: string }[]);
  const attempts = req.user
    ? db
        .prepare(
          "SELECT id, score, passed, created_at FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY created_at DESC LIMIT 8",
        )
        .all(req.user.id, quiz.id)
    : [];
  res.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      passingScore: quiz.passing_score,
      questions: questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        type: q.type,
        answers: answers.filter((a) => a.question_id === q.id).map((a) => ({ id: a.id, label: a.label })),
      })),
    },
    attempts,
  });
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.quizId) as
    | { id: string; passing_score: number }
    | undefined;
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found." });
    return;
  }
  const submitted = req.body.answers as Record<string, string | string[]>;
  const questions = db
    .prepare("SELECT id, type, explanation FROM questions WHERE quiz_id = ?")
    .all(quiz.id) as { id: string; type: string; explanation: string | null }[];
  const answers = db
    .prepare(
      `SELECT id, question_id, is_correct FROM answers WHERE question_id IN (${questions.map(() => "?").join(",")})`,
    )
    .all(...questions.map((q) => q.id)) as { id: string; question_id: string; is_correct: number }[];

  let correctCount = 0;
  const review = questions.map((q) => {
    const correctIds = answers.filter((a) => a.question_id === q.id && a.is_correct).map((a) => a.id);
    const given = submitted[q.id];
    const givenIds = Array.isArray(given) ? given : given ? [given] : [];
    const ok =
      correctIds.length === givenIds.length && correctIds.every((cid) => givenIds.includes(cid));
    if (ok) correctCount += 1;
    return {
      questionId: q.id,
      correct: ok,
      correctAnswerIds: correctIds,
      explanation: q.explanation,
    };
  });
  const score = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);
  const passed = score >= quiz.passing_score;
  const attemptId = id();
  db.prepare(
    `INSERT INTO quiz_attempts (id, user_id, quiz_id, score, passed, answers_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(attemptId, req.user!.id, quiz.id, score, passed ? 1 : 0, JSON.stringify(submitted), nowIso());
  res.json({ attemptId, score, passed, review });
});

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const coursesActive = (
    db.prepare("SELECT COUNT(*) as c FROM enrollments WHERE user_id = ? AND completed_at IS NULL").get(userId) as {
      c: number;
    }
  ).c;
  const lessonsCompleted = (
    db.prepare("SELECT COUNT(*) as c FROM lesson_progress WHERE user_id = ? AND completed = 1").get(userId) as {
      c: number;
    }
  ).c;
  const labsCompleted = (
    db.prepare("SELECT COUNT(*) as c FROM lab_progress WHERE user_id = ? AND completed = 1").get(userId) as {
      c: number;
    }
  ).c;
  const quizzesCompleted = (
    db.prepare("SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = ? AND passed = 1").get(userId) as {
      c: number;
    }
  ).c;
  const totalLessons = (db.prepare("SELECT COUNT(*) as c FROM lessons").get() as { c: number }).c;
  const overall = totalLessons === 0 ? 0 : Math.min(100, Math.round((lessonsCompleted / totalLessons) * 100));

  const recentCourses = db
    .prepare(
      `SELECT c.slug, c.title, c.level,
        (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id) as total,
        (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
         WHERE m.course_id = c.id AND lp.user_id = e.user_id AND lp.completed = 1) as done
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = ? ORDER BY e.enrolled_at DESC LIMIT 6`,
    )
    .all(userId);

  const completedLabs = db
    .prepare(
      `SELECT l.slug, l.title, l.category FROM lab_progress p JOIN labs l ON l.id = p.lab_id
       WHERE p.user_id = ? AND p.completed = 1 ORDER BY p.completed_at DESC LIMIT 6`,
    )
    .all(userId);

  const recommended = db
    .prepare(
      `SELECT slug, title, level, category FROM courses WHERE published = 1
       AND id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
       ORDER BY title LIMIT 4`,
    )
    .all(userId);

  const certificates = db
    .prepare(
      `SELECT cert.id, c.title as course_title, cert.issued_at
       FROM certificates cert JOIN courses c ON c.id = cert.course_id
       WHERE cert.user_id = ? ORDER BY cert.issued_at DESC`,
    )
    .all(userId);

  const announcements = db
    .prepare("SELECT title, body, created_at FROM announcements WHERE published = 1 ORDER BY created_at DESC LIMIT 3")
    .all();

  res.json({
    stats: {
      coursesActive,
      lessonsCompleted,
      labsCompleted,
      quizzesCompleted,
      overallProgress: overall,
    },
    recentCourses,
    completedLabs,
    recommended,
    certificates,
    announcements,
    achievements: [
      lessonsCompleted >= 1 ? "First lesson completed" : null,
      labsCompleted >= 1 ? "First lab completed" : null,
      quizzesCompleted >= 1 ? "First quiz passed" : null,
      certificates.length >= 1 ? "Course certificate earned" : null,
    ].filter(Boolean),
  });
});

export const getCertificate = asyncHandler(async (req: Request, res: Response) => {
  const cert = db
    .prepare(
      `SELECT cert.id, cert.issued_at, u.full_name, c.title as course_title, c.slug as course_slug
       FROM certificates cert
       JOIN users u ON u.id = cert.user_id
       JOIN courses c ON c.id = cert.course_id
       WHERE cert.id = ?`,
    )
    .get(req.params.id) as
    | { id: string; issued_at: string; full_name: string; course_title: string; course_slug: string }
    | undefined;
  if (!cert) {
    res.status(404).json({ error: "Certificate not found." });
    return;
  }
  res.json({
    certificate: {
      id: cert.id,
      studentName: cert.full_name,
      courseName: cert.course_title,
      courseSlug: cert.course_slug,
      issuedAt: cert.issued_at,
      verificationUrl: `/verify/${cert.id}`,
    },
  });
});
