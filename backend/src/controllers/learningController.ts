import type { Request, Response } from "express";
import { db, nowIso } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { id } from "../utils/ids.js";
import { num } from "../utils/sql.js";

const PATH_ORDER = [
  "cybersecurity-fundamentals",
  "networking-essentials",
  "linux-for-security",
  "python-for-cybersecurity",
  "web-security",
  "ai-for-cybersecurity",
];

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
  if (questions.length === 0) {
    res.json({
      quiz: { id: quiz.id, title: quiz.title, passingScore: num(quiz.passing_score), questions: [] },
      attempts: [],
    });
    return;
  }
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
      passingScore: num(quiz.passing_score),
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
  if (questions.length === 0) {
    res.status(400).json({ error: "This quiz has no questions yet." });
    return;
  }
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
  const coursesActive = num(
    (db.prepare("SELECT COUNT(*) as c FROM enrollments WHERE user_id = ? AND completed_at IS NULL").get(userId) as { c: unknown }).c,
  );
  const lessonsCompleted = num(
    (db.prepare("SELECT COUNT(*) as c FROM lesson_progress WHERE user_id = ? AND completed = 1").get(userId) as { c: unknown }).c,
  );
  const labsCompleted = num(
    (db.prepare("SELECT COUNT(*) as c FROM lab_progress WHERE user_id = ? AND completed = 1").get(userId) as { c: unknown }).c,
  );
  const quizzesCompleted = num(
    (db.prepare("SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = ? AND passed = 1").get(userId) as { c: unknown }).c,
  );
  const totalLessons = num((db.prepare("SELECT COUNT(*) as c FROM lessons").get() as { c: unknown }).c);
  const overall = totalLessons === 0 ? 0 : Math.min(100, Math.round((lessonsCompleted / totalLessons) * 100));

  const recentCourses = (
    db
      .prepare(
        `SELECT c.slug, c.title, c.level,
        (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id) as total,
        (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
         WHERE m.course_id = c.id AND lp.user_id = e.user_id AND lp.completed = 1) as done
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = ? ORDER BY e.enrolled_at DESC LIMIT 6`,
      )
      .all(userId) as { slug: string; title: string; level: string; total: unknown; done: unknown }[]
  ).map((c) => ({
    slug: c.slug,
    title: c.title,
    level: c.level,
    total: num(c.total),
    done: num(c.done),
  }));

  const continueRow = db
    .prepare(
      `SELECT c.slug as course_slug, c.title as course_title, l.slug as lesson_slug, l.title as lesson_title
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN modules m ON m.course_id = c.id
       JOIN lessons l ON l.module_id = m.id
       WHERE e.user_id = ? AND e.completed_at IS NULL
         AND l.id NOT IN (SELECT lesson_id FROM lesson_progress WHERE user_id = ? AND completed = 1)
       ORDER BY e.enrolled_at DESC, m.sort_order, l.sort_order
       LIMIT 1`,
    )
    .get(userId, userId) as
    | { course_slug: string; course_title: string; lesson_slug: string; lesson_title: string }
    | undefined;

  const completedLabs = db
    .prepare(
      `SELECT l.slug, l.title, l.category FROM lab_progress p JOIN labs l ON l.id = p.lab_id
       WHERE p.user_id = ? AND p.completed = 1 ORDER BY p.completed_at DESC LIMIT 6`,
    )
    .all(userId);

  const completedSlugs = new Set(
    (
      db
        .prepare(
          `SELECT c.slug FROM enrollments e JOIN courses c ON c.id = e.course_id
           WHERE e.user_id = ? AND e.completed_at IS NOT NULL`,
        )
        .all(userId) as { slug: string }[]
    ).map((r) => r.slug),
  );
  const enrolledSlugs = new Set(
    (db.prepare(`SELECT c.slug FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ?`).all(userId) as { slug: string }[]).map(
      (r) => r.slug,
    ),
  );

  const completedTitles = PATH_ORDER.filter((s) => completedSlugs.has(s)).map((slug) => {
    const row = db.prepare("SELECT title FROM courses WHERE slug = ?").get(slug) as { title: string } | undefined;
    return row?.title ?? slug;
  });

  let nextSlug = PATH_ORDER.find((slug, i) => {
    if (completedSlugs.has(slug)) return false;
    const prev = PATH_ORDER[i - 1];
    return !prev || completedSlugs.has(prev) || enrolledSlugs.has(slug);
  });
  if (!nextSlug) {
    const extra = db
      .prepare(
        `SELECT slug FROM courses WHERE published = 1 AND slug NOT IN (${PATH_ORDER.map(() => "?").join(",")})
         AND id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ? AND completed_at IS NOT NULL)
         ORDER BY title LIMIT 1`,
      )
      .get(...PATH_ORDER, userId) as { slug: string } | undefined;
    nextSlug = extra?.slug;
  }

  const recommended = nextSlug
    ? db
        .prepare("SELECT slug, title, level, category FROM courses WHERE slug = ? AND published = 1")
        .all(nextSlug)
    : [];

  const more = db
    .prepare(
      `SELECT slug, title, level, category FROM courses WHERE published = 1
       AND id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
       ${nextSlug ? "AND slug != ?" : ""}
       ORDER BY title LIMIT 3`,
    )
    .all(...(nextSlug ? [userId, nextSlug] : [userId]));

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
    continueLearning: continueRow
      ? {
          courseSlug: continueRow.course_slug,
          courseTitle: continueRow.course_title,
          lessonSlug: continueRow.lesson_slug,
          lessonTitle: continueRow.lesson_title,
        }
      : null,
    recentCourses,
    completedLabs,
    completedPath: completedTitles,
    recommended: [...recommended, ...more],
    certificates,
    announcements,
    achievements: [
      lessonsCompleted >= 1 ? "First lesson completed" : null,
      labsCompleted >= 1 ? "First lab completed" : null,
      quizzesCompleted >= 1 ? "First quiz passed" : null,
      certificates.length >= 1 ? "Course certificate earned" : null,
      completedSlugs.size >= 1 ? "Finished a full course" : null,
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

export const learnPath = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const steps = PATH_ORDER.map((slug, index) => {
    const course = db.prepare("SELECT id, title, level FROM courses WHERE slug = ? AND published = 1").get(slug) as
      | { id: string; title: string; level: string }
      | undefined;
    if (!course) return null;
    const courseId = course.id;
    const total = num(
      (db.prepare("SELECT COUNT(*) as c FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?").get(courseId) as { c: unknown }).c,
    );
    let done = 0;
    let enrolled = false;
    let finished = false;
    if (userId) {
      enrolled = Boolean(db.prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?").get(userId, courseId));
      finished = Boolean(
        db.prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND completed_at IS NOT NULL").get(userId, courseId),
      );
      done = num(
        (
          db
            .prepare(
              `SELECT COUNT(*) as c FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
               WHERE m.course_id = ? AND lp.user_id = ? AND lp.completed = 1`,
            )
            .get(courseId, userId) as { c: unknown }
        ).c,
      );
    }
    const prevDone =
      index === 0
        ? true
        : Boolean(
            userId &&
              (
                db
                  .prepare(
                    `SELECT e.id FROM enrollments e JOIN courses c ON c.id = e.course_id
                     WHERE e.user_id = ? AND c.slug = ? AND e.completed_at IS NOT NULL`,
                  )
                  .get(userId, PATH_ORDER[index - 1]) as { id: string } | undefined
              ),
          );
    const status = finished ? "completed" : enrolled || done > 0 ? "in_progress" : prevDone ? "next" : "upcoming";
    return {
      slug,
      title: course.title,
      level: course.level,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
      status,
    };
  }).filter(Boolean) as {
    slug: string;
    title: string;
    level: string;
    percent: number;
    status: string;
  }[];

  const current = steps.find((s) => s.status === "in_progress") ?? steps.find((s) => s.status === "next") ?? steps[0];
  const labForCurrent = current
    ? (db
        .prepare(
          `SELECT l.slug, l.title FROM labs l
           JOIN courses c ON c.id = l.related_course_id
           WHERE c.slug = ? AND l.published = 1 ORDER BY l.title LIMIT 1`,
        )
        .get(current.slug) as { slug: string; title: string } | undefined)
    : undefined;
  const projectForCurrent = current
    ? (db
        .prepare(
          `SELECT p.slug, p.title FROM projects p
           JOIN courses c ON c.id = p.related_course_id
           WHERE c.slug = ? AND p.published = 1 ORDER BY p.title LIMIT 1`,
        )
        .get(current.slug) as { slug: string; title: string } | undefined)
    : undefined;

  res.json({
    signedIn: Boolean(userId),
    steps,
    nextAction: current
      ? {
          courseSlug: current.slug,
          courseTitle: current.title,
          status: current.status,
          percent: current.percent,
          lab: labForCurrent ?? null,
          project: projectForCurrent ?? null,
        }
      : null,
    tracks: [
      {
        to: "/courses",
        label: "Courses",
        blurb: "Structured lessons, quizzes, and a recommended order.",
        count: num((db.prepare("SELECT COUNT(*) as c FROM courses WHERE published = 1").get() as { c: unknown }).c),
      },
      {
        to: "/labs",
        label: "Labs",
        blurb: "Hands-on practice on systems you control.",
        count: num((db.prepare("SELECT COUNT(*) as c FROM labs WHERE published = 1").get() as { c: unknown }).c),
      },
      {
        to: "/projects",
        label: "Projects",
        blurb: "Build tools you can explain in an interview.",
        count: num((db.prepare("SELECT COUNT(*) as c FROM projects WHERE published = 1").get() as { c: unknown }).c),
      },
      {
        to: "/resources",
        label: "Resources",
        blurb: "Roadmaps, cheat sheets, glossaries, and notes.",
        count: num((db.prepare("SELECT COUNT(*) as c FROM resources WHERE published = 1").get() as { c: unknown }).c),
      },
      {
        to: "/youtube",
        label: "YouTube",
        blurb: "Watch, then come back and practice in a lab.",
        count: num((db.prepare("SELECT COUNT(*) as c FROM youtube_videos").get() as { c: unknown }).c),
      },
    ],
  });
});
