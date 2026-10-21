import type { Request, Response } from "express";
import { db, nowIso } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { id, parseJson } from "../utils/ids.js";
import { bool, likeContains, num } from "../utils/sql.js";
import { getEthicalCourseAccess } from "../services/ethicalPenetrationPath.js";

function mapCourse(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    level: row.level,
    category: row.category,
    estimatedHours: num(row.estimated_hours),
    prerequisites: parseJson<string[]>(String(row.prerequisites ?? "[]"), []),
    nextCourseSlug: row.next_course_slug,
    learningObjectives: parseJson<string[]>(String(row.learning_objectives ?? "[]"), []),
    published: bool(row.published),
  };
}

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const includeDrafts = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const level = String(req.query.level ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  let sql = `SELECT * FROM courses ${includeDrafts ? "WHERE 1=1" : "WHERE published = 1"}`;
  const params: string[] = [];
  if (level) {
    sql += " AND level = ?";
    params.push(level);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (q) {
    sql += " AND (lower(title) LIKE ? OR lower(subtitle) LIKE ? OR lower(description) LIKE ? OR lower(category) LIKE ?)";
    const like = likeContains(q);
    params.push(like, like, like, like);
  }
  sql += " ORDER BY category, title";
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  const assessedCourseIds = new Set(
    (db.prepare("SELECT DISTINCT course_id FROM quizzes WHERE course_id IS NOT NULL AND lesson_id IS NULL").all() as { course_id: string }[]).map((row) => row.course_id),
  );
  const facetRows = db
    .prepare(`SELECT level, category FROM courses ${includeDrafts ? "" : "WHERE published = 1"}`)
    .all() as { level: string; category: string }[];

  const userId = req.user?.id;
  const enrolledMap = new Map<string, { completed: boolean }>();
  const progressMap = new Map<string, { done: number; started: number; total: number }>();
  if (userId) {
    const enrolls = db
      .prepare("SELECT course_id, completed_at FROM enrollments WHERE user_id = ?")
      .all(userId) as { course_id: string; completed_at: string | null }[];
    enrolls.forEach((e) => enrolledMap.set(e.course_id, { completed: Boolean(e.completed_at) }));
    const progress = db
      .prepare(
        `SELECT m.course_id as course_id,
           COUNT(l.id) as total,
           SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END) as done,
           SUM(CASE WHEN lp.completed = 0 THEN 1 ELSE 0 END) as started
         FROM lessons l
         JOIN modules m ON m.id = l.module_id
         LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
         GROUP BY m.course_id`,
      )
      .all(userId) as { course_id: string; total: unknown; done: unknown; started: unknown }[];
    progress.forEach((p) => progressMap.set(p.course_id, { total: num(p.total), done: num(p.done), started: num(p.started) }));
  }

  res.json({
    courses: rows.map((row) => {
      const mapped = mapCourse(row);
      const enroll = enrolledMap.get(String(row.id));
      const prog = progressMap.get(String(row.id));
      const total = prog?.total ?? 0;
      const done = prog?.done ?? 0;
      return {
        ...mapped,
        enrolled: Boolean(enroll),
        completed: Boolean(enroll?.completed),
        progressPercent: total === 0 ? 0 : Math.round((done / total) * 100),
        lessonCount: total,
        lessonsCompleted: done,
        lessonsStarted: prog?.started ?? 0,
        hasAssessment: assessedCourseIds.has(String(row.id)),
      };
    }),
    facets: {
      levels: [...new Set(facetRows.map((f) => f.level))],
      categories: [...new Set(facetRows.map((f) => f.category))],
    },
  });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const course = db.prepare("SELECT * FROM courses WHERE slug = ?").get(slug) as Record<string, unknown> | undefined;
  const staff = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";
  if (!course || (!bool(course.published) && !staff)) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  const courseId = String(course.id);
  const modules = db
    .prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order")
    .all(courseId) as Record<string, unknown>[];
  const lessons = db
    .prepare(
      `SELECT l.* FROM lessons l
       JOIN modules m ON m.id = l.module_id
       WHERE m.course_id = ?
       ORDER BY m.sort_order, l.sort_order`,
    )
    .all(courseId) as Record<string, unknown>[];

  let completedLessonIds: string[] = [];
  let startedLessonIds: string[] = [];
  let enrolled = false;
  if (req.user) {
    enrolled = Boolean(
      db
        .prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?")
        .get(req.user.id, courseId),
    );
    const lessonProgress = (
      db
        .prepare(
          `SELECT lp.lesson_id, lp.completed FROM lesson_progress lp
           JOIN lessons l ON l.id = lp.lesson_id
           JOIN modules m ON m.id = l.module_id
           WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = 1`,
        )
        .all(req.user.id, courseId) as { lesson_id: string }[]
    );
    completedLessonIds = lessonProgress.map((r) => r.lesson_id);
    startedLessonIds = (
      db
        .prepare(
          `SELECT lp.lesson_id FROM lesson_progress lp
           JOIN lessons l ON l.id = lp.lesson_id
           JOIN modules m ON m.id = l.module_id
           WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = 0`,
        )
        .all(req.user.id, courseId) as { lesson_id: string }[]
    ).map((r) => r.lesson_id);
  }

  const totalLessons = lessons.length;
  const completed = completedLessonIds.length;
  const started = startedLessonIds.length;
  const progress = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
  const continueLesson = lessons.find((l) => !completedLessonIds.includes(String(l.id)));
  const courseLessonOrder = new Map(lessons.map((lesson, index) => [String(lesson.id), index + 1]));

  const quiz = db.prepare("SELECT id, title, passing_score FROM quizzes WHERE course_id = ? AND lesson_id IS NULL AND title NOT LIKE 'Level Exam:%' ORDER BY id LIMIT 1").get(courseId) as
    | { id: string; title: string; passing_score: number }
    | undefined;
  const levelExam = db
    .prepare("SELECT id, title, passing_score FROM quizzes WHERE course_id = ? AND title LIKE 'Level Exam:%' ORDER BY id LIMIT 1")
    .get(courseId) as { id: string; title: string; passing_score: number } | undefined;
  const entryExam = db
    .prepare("SELECT id, title, passing_score FROM quizzes WHERE course_id = ? AND title LIKE 'Entry Exam:%' ORDER BY id LIMIT 1")
    .get(courseId) as { id: string; title: string; passing_score: number } | undefined;
  const levelExamAttempts = req.user && levelExam
    ? db
        .prepare(
          `SELECT COUNT(*) AS total, MAX(passed) AS passed,
             (SELECT score FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY created_at DESC LIMIT 1) AS latest_score
           FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?`,
        )
        .get(req.user.id, levelExam.id, req.user.id, levelExam.id) as { total: unknown; passed: unknown; latest_score: unknown }
    : undefined;
  const entryExamAttempts = req.user && entryExam
    ? db
        .prepare(
          `SELECT COUNT(*) AS total, MAX(passed) AS passed,
             (SELECT score FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY created_at DESC LIMIT 1) AS latest_score
           FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?`,
        )
        .get(req.user.id, entryExam.id, req.user.id, entryExam.id) as { total: unknown; passed: unknown; latest_score: unknown }
    : undefined;
  const access = getEthicalCourseAccess(req.user?.id, slug);
  const nextCourseAccess = course.next_course_slug
    ? getEthicalCourseAccess(req.user?.id, String(course.next_course_slug))
    : null;

  const mappedModules = modules.map((m) => {
    const moduleLessons = lessons.filter((l) => l.module_id === m.id);
    const moduleCompleted = moduleLessons.filter((l) => completedLessonIds.includes(String(l.id))).length;
    const moduleStarted = moduleLessons.filter((l) => startedLessonIds.includes(String(l.id))).length;
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      progress: {
        completed: moduleCompleted,
        started: moduleStarted,
        total: moduleLessons.length,
        percent: moduleLessons.length === 0 ? 0 : Math.round((moduleCompleted / moduleLessons.length) * 100),
      },
      lessons: moduleLessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        durationMinutes: num(l.duration_minutes),
        completed: completedLessonIds.includes(String(l.id)),
        started: startedLessonIds.includes(String(l.id)),
        position: courseLessonOrder.get(String(l.id)) ?? 0,
      })),
    };
  });

  res.json({
    course: mapCourse(course),
    access,
    nextCourseAccess,
    modules: mappedModules,
    enrolled,
    progress: { completed, started, total: totalLessons, percent: progress },
    continueLesson: continueLesson
      ? { slug: continueLesson.slug, title: continueLesson.title }
      : mappedModules.flatMap((m) => m.lessons)[0]
        ? {
            slug: mappedModules.flatMap((m) => m.lessons)[0].slug,
            title: mappedModules.flatMap((m) => m.lessons)[0].title,
          }
        : null,
    quiz: quiz ? { id: quiz.id, title: quiz.title, passingScore: num(quiz.passing_score) } : null,
    levelExam: levelExam
      ? {
          id: levelExam.id,
          title: levelExam.title,
          passingScore: num(levelExam.passing_score),
          attempts: num(levelExamAttempts?.total),
          passed: Boolean(levelExamAttempts?.passed),
          latestScore: levelExamAttempts?.latest_score == null ? null : num(levelExamAttempts.latest_score),
        }
      : null,
    entryExam: entryExam
      ? {
          id: entryExam.id,
          title: entryExam.title,
          passingScore: num(entryExam.passing_score),
          attempts: num(entryExamAttempts?.total),
          passed: Boolean(entryExamAttempts?.passed),
          latestScore: entryExamAttempts?.latest_score == null ? null : num(entryExamAttempts.latest_score),
        }
      : null,
    relatedLabs: db
      .prepare(
        "SELECT slug, title, difficulty FROM labs WHERE related_course_id = ? AND published = 1 ORDER BY title LIMIT 4",
      )
      .all(courseId),
    relatedProjects: db
      .prepare(
        "SELECT slug, title, difficulty FROM projects WHERE related_course_id = ? AND published = 1 ORDER BY title LIMIT 3",
      )
      .all(courseId),
  });
});

export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  const { slug, lessonSlug } = req.params;
  const course = db.prepare("SELECT * FROM courses WHERE slug = ?").get(slug) as Record<string, unknown> | undefined;
  const staff = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";
  if (!course || (!bool(course.published) && !staff)) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  const access = getEthicalCourseAccess(req.user?.id, String(course.slug));
  if (!access.available && !staff) {
    res.status(403).json({ error: access.reason ?? "This level is locked.", access });
    return;
  }
  const courseId = String(course.id);
  const lesson = db
    .prepare(
      `SELECT l.*, m.title as module_title, m.id as module_id FROM lessons l
       JOIN modules m ON m.id = l.module_id
       WHERE m.course_id = ? AND l.slug = ?`,
    )
    .get(courseId, String(lessonSlug)) as Record<string, unknown> | undefined;
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  const lessonId = String(lesson.id);

  const siblings = db
    .prepare(
      `SELECT l.id, l.slug, l.title, m.sort_order as module_order, l.sort_order
       FROM lessons l JOIN modules m ON m.id = l.module_id
       WHERE m.course_id = ? ORDER BY m.sort_order, l.sort_order`,
    )
    .all(courseId) as { id: string; slug: string; title: string }[];
  const index = siblings.findIndex((s) => s.slug === lesson.slug);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index < siblings.length - 1 ? siblings[index + 1] : null;

  const quiz = db
    .prepare("SELECT id, title, passing_score FROM quizzes WHERE lesson_id = ? AND title NOT LIKE 'Level Exam:%' AND title NOT LIKE 'Entry Exam:%'")
    .get(lessonId) as { id: string; title: string; passing_score: number } | undefined;

  let completed = false;
  let started = false;
  let completedInCourse = 0;
  let startedInCourse = 0;
  if (req.user) {
    const progress = db
      .prepare("SELECT completed FROM lesson_progress WHERE user_id = ? AND lesson_id = ?")
      .get(req.user.id, lessonId) as { completed: number } | undefined;
    completed = Boolean(progress?.completed);
    started = Boolean(progress);
    const courseCounts = db
      .prepare(
        `SELECT
           COUNT(CASE WHEN lp.completed = 1 THEN 1 END) as completed,
           COUNT(CASE WHEN lp.completed = 0 THEN 1 END) as started
         FROM lessons l
         JOIN modules m ON m.id = l.module_id
         LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
         WHERE m.course_id = ?`,
      )
      .get(req.user.id, courseId) as { completed: unknown; started: unknown };
    completedInCourse = num(courseCounts.completed);
    startedInCourse = num(courseCounts.started);
  }

  res.json({
    course: { slug: course.slug, title: course.title },
    lesson: {
      id: lessonId,
      slug: lesson.slug,
      title: lesson.title,
      content: lesson.content,
      codeExample: lesson.code_example,
      exercise: lesson.exercise,
      videoUrl: lesson.video_url,
      durationMinutes: num(lesson.duration_minutes),
      moduleTitle: lesson.module_title,
      completed,
      started,
    },
    courseProgress: {
      completed: completedInCourse,
      started: startedInCourse,
      total: siblings.length,
      percent: siblings.length === 0 ? 0 : Math.round((completedInCourse / siblings.length) * 100),
      position: index + 1,
    },
    prev,
    next,
    quiz: quiz ? { id: quiz.id, title: quiz.title, passingScore: num(quiz.passing_score) } : null,
  });
});

export const enroll = asyncHandler(async (req: Request, res: Response) => {
  const course = db.prepare("SELECT id, slug FROM courses WHERE slug = ? AND published = 1").get(req.params.slug) as
    | { id: string; slug: string }
    | undefined;
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  const staff = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";
  const access = getEthicalCourseAccess(req.user?.id, course.slug);
  if (!access.available && !staff) {
    res.status(403).json({ error: access.reason ?? "This level is locked.", access });
    return;
  }
  db.prepare(
    `INSERT OR IGNORE INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?, ?, ?, ?)`,
  ).run(id(), req.user!.id, course.id, nowIso());
  res.json({ ok: true });
});

export const startLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = db
    .prepare(
      `SELECT l.id, c.id as course_id, c.slug as course_slug, c.published
       FROM lessons l
       JOIN modules m ON m.id = l.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE l.id = ?`,
    )
    .get(req.params.lessonId) as { id: string; course_id: string; course_slug: string; published: number } | undefined;
  const staff = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";
  if (!lesson || (!bool(lesson.published) && !staff)) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  const access = getEthicalCourseAccess(req.user?.id, lesson.course_slug);
  if (!access.available && !staff) {
    res.status(403).json({ error: access.reason ?? "This level is locked.", access });
    return;
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      "INSERT OR IGNORE INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?, ?, ?, ?)",
    ).run(id(), req.user!.id, lesson.course_id, nowIso());
    db.prepare(
      "INSERT OR IGNORE INTO lesson_progress (id, user_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, 0, NULL)",
    ).run(id(), req.user!.id, lesson.id);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  res.json({ ok: true, started: true });
});

export const completeLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = db
    .prepare(
      `SELECT l.id, l.module_id, c.slug as course_slug, c.published FROM lessons l
       JOIN modules m ON m.id = l.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE l.id = ?`,
    )
    .get(req.params.lessonId) as
    | { id: string; module_id: string; course_slug: string; published: number }
    | undefined;
  const staff = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";
  if (!lesson || (!bool(lesson.published) && !staff)) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  const access = getEthicalCourseAccess(req.user?.id, lesson.course_slug);
  if (!access.available && !staff) {
    res.status(403).json({ error: access.reason ?? "This level is locked.", access });
    return;
  }
  const course = db
    .prepare(
      `SELECT c.id FROM courses c JOIN modules m ON m.course_id = c.id WHERE m.id = ?`,
    )
    .get(lesson.module_id) as { id: string };
  let total = 0;
  let done = 0;
  let nextRow: { slug: string; title: string } | undefined;
  let certificateId: string | null = null;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      `INSERT OR IGNORE INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?, ?, ?, ?)`,
    ).run(id(), req.user!.id, course.id, nowIso());
    db.prepare(
      `INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed = 1, completed_at = excluded.completed_at`,
    ).run(id(), req.user!.id, lesson.id, nowIso());

    const totals = db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?) as total,
          (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
           WHERE m.course_id = ? AND lp.user_id = ? AND lp.completed = 1) as done`,
      )
      .get(course.id, course.id, req.user!.id) as { total: unknown; done: unknown };

    total = num(totals.total);
    done = num(totals.done);
    nextRow = db
      .prepare(
        `SELECT l.slug, l.title FROM lessons l
         JOIN modules m ON m.id = l.module_id
         WHERE m.course_id = ?
         AND l.id NOT IN (
           SELECT lesson_id FROM lesson_progress WHERE user_id = ? AND completed = 1
         )
         ORDER BY m.sort_order, l.sort_order LIMIT 1`,
      )
      .get(course.id, req.user!.id) as { slug: string; title: string } | undefined;

    if (total > 0 && done >= total) {
      db.prepare("UPDATE enrollments SET completed_at = ? WHERE user_id = ? AND course_id = ? AND completed_at IS NULL").run(
        nowIso(),
        req.user!.id,
        course.id,
      );
      const existing = db
        .prepare("SELECT id FROM certificates WHERE user_id = ? AND course_id = ?")
        .get(req.user!.id, course.id) as { id: string } | undefined;
      if (existing) certificateId = existing.id;
      else {
        certificateId = id();
        db.prepare("INSERT INTO certificates (id, user_id, course_id, issued_at) VALUES (?, ?, ?, ?)").run(
          certificateId,
          req.user!.id,
          course.id,
          nowIso(),
        );
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  res.json({
    ok: true,
    certificateId,
    nextLesson: nextRow ?? null,
    progress: { completed: done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) },
  });
});
