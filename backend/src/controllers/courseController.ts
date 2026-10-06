import type { Request, Response } from "express";
import { db, nowIso } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { id, parseJson } from "../utils/ids.js";
import { bool, num } from "../utils/sql.js";

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
  const rows = db
    .prepare(
      `SELECT * FROM courses ${includeDrafts ? "" : "WHERE published = 1"} ORDER BY category, title`,
    )
    .all() as Record<string, unknown>[];
  res.json({ courses: rows.map(mapCourse) });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const course = db.prepare("SELECT * FROM courses WHERE slug = ?").get(slug) as Record<string, unknown> | undefined;
  const staff = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";
  if (!course || (!bool(course.published) && !staff)) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  const modules = db
    .prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order")
    .all(course.id) as Record<string, unknown>[];
  const moduleIds = modules.map((m) => m.id);
  const lessons =
    moduleIds.length === 0
      ? []
      : (db
          .prepare(
            `SELECT * FROM lessons WHERE module_id IN (${moduleIds.map(() => "?").join(",")}) ORDER BY sort_order`,
          )
          .all(...moduleIds) as Record<string, unknown>[]);

  let completedLessonIds: string[] = [];
  let enrolled = false;
  if (req.user) {
    enrolled = Boolean(
      db
        .prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?")
        .get(req.user.id, course.id),
    );
    completedLessonIds = (
      db
        .prepare(
          `SELECT lp.lesson_id FROM lesson_progress lp
           JOIN lessons l ON l.id = lp.lesson_id
           JOIN modules m ON m.id = l.module_id
           WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = 1`,
        )
        .all(req.user.id, course.id) as { lesson_id: string }[]
    ).map((r) => r.lesson_id);
  }

  const totalLessons = lessons.length;
  const completed = completedLessonIds.length;
  const progress = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
  const continueLesson = lessons.find((l) => !completedLessonIds.includes(String(l.id)));

  const quiz = db.prepare("SELECT id, title, passing_score FROM quizzes WHERE course_id = ?").get(course.id) as
    | { id: string; title: string; passing_score: number }
    | undefined;

  const mappedModules = modules.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    lessons: lessons
      .filter((l) => l.module_id === m.id)
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        durationMinutes: num(l.duration_minutes),
        completed: completedLessonIds.includes(String(l.id)),
      })),
  }));

  res.json({
    course: mapCourse(course),
    modules: mappedModules,
    enrolled,
    progress: { completed, total: totalLessons, percent: progress },
    continueLesson: continueLesson
      ? { slug: continueLesson.slug, title: continueLesson.title }
      : mappedModules.flatMap((m) => m.lessons)[0]
        ? {
            slug: mappedModules.flatMap((m) => m.lessons)[0].slug,
            title: mappedModules.flatMap((m) => m.lessons)[0].title,
          }
        : null,
    quiz: quiz ? { id: quiz.id, title: quiz.title, passingScore: num(quiz.passing_score) } : null,
  });
});

export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  const { slug, lessonSlug } = req.params;
  const course = db.prepare("SELECT * FROM courses WHERE slug = ?").get(slug) as Record<string, unknown> | undefined;
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  const lesson = db
    .prepare(
      `SELECT l.*, m.title as module_title, m.id as module_id FROM lessons l
       JOIN modules m ON m.id = l.module_id
       WHERE m.course_id = ? AND l.slug = ?`,
    )
    .get(course.id, lessonSlug) as Record<string, unknown> | undefined;
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }

  const siblings = db
    .prepare(
      `SELECT l.slug, l.title, m.sort_order as module_order, l.sort_order
       FROM lessons l JOIN modules m ON m.id = l.module_id
       WHERE m.course_id = ? ORDER BY m.sort_order, l.sort_order`,
    )
    .all(course.id) as { slug: string; title: string }[];
  const index = siblings.findIndex((s) => s.slug === lesson.slug);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index < siblings.length - 1 ? siblings[index + 1] : null;

  const quiz = db
    .prepare("SELECT id, title, passing_score FROM quizzes WHERE lesson_id = ?")
    .get(lesson.id) as { id: string; title: string; passing_score: number } | undefined;

  let completed = false;
  if (req.user) {
    completed = Boolean(
      db
        .prepare("SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ? AND completed = 1")
        .get(req.user.id, lesson.id),
    );
  }

  res.json({
    course: { slug: course.slug, title: course.title },
    lesson: {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      content: lesson.content,
      codeExample: lesson.code_example,
      exercise: lesson.exercise,
      videoUrl: lesson.video_url,
      durationMinutes: num(lesson.duration_minutes),
      moduleTitle: lesson.module_title,
      completed,
    },
    prev,
    next,
    quiz: quiz ? { id: quiz.id, title: quiz.title, passingScore: num(quiz.passing_score) } : null,
  });
});

export const enroll = asyncHandler(async (req: Request, res: Response) => {
  const course = db.prepare("SELECT id FROM courses WHERE slug = ? AND published = 1").get(req.params.slug) as
    | { id: string }
    | undefined;
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  db.prepare(
    `INSERT OR IGNORE INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?, ?, ?, ?)`,
  ).run(id(), req.user!.id, course.id, nowIso());
  res.json({ ok: true });
});

export const completeLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = db.prepare("SELECT id, module_id FROM lessons WHERE id = ?").get(req.params.lessonId) as
    | { id: string; module_id: string }
    | undefined;
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  const course = db
    .prepare(
      `SELECT c.id FROM courses c JOIN modules m ON m.course_id = c.id WHERE m.id = ?`,
    )
    .get(lesson.module_id) as { id: string };
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

  const total = num(totals.total);
  const done = num(totals.done);

  const nextRow = db
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

  let certificateId: string | null = null;
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
  res.json({
    ok: true,
    certificateId,
    nextLesson: nextRow ?? null,
    progress: { completed: done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) },
  });
});
