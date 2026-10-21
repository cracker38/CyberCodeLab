import { db } from "../config/db.js";
import { num } from "../utils/sql.js";

const LEVELS = [
  "ethical-penetration-testing-basic",
  "ethical-penetration-testing-intermediate",
  "ethical-penetration-testing-advanced",
] as const;

export type LevelRequirement = {
  courseSlug: string;
  courseTitle: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  examQuizId: string | null;
  examTitle: string | null;
  passingScore: number | null;
  examAttempts: number;
  examPassed: boolean;
  latestExamScore: number | null;
};

export type CourseAccess = {
  available: boolean;
  reason: string | null;
  requirement: LevelRequirement | null;
};

type CourseRow = { id: string; slug: string; title: string };
type ExamRow = { id: string; title: string; passing_score: number };

function getExam(courseId: string): ExamRow | undefined {
  return db
    .prepare(
      "SELECT id, title, passing_score FROM quizzes WHERE course_id = ? AND title LIKE 'Level Exam:%' ORDER BY id LIMIT 1",
    )
    .get(courseId) as ExamRow | undefined;
}

function getEntryExam(courseId: string): ExamRow | undefined {
  return db
    .prepare("SELECT id, title, passing_score FROM quizzes WHERE course_id = ? AND title LIKE 'Entry Exam:%' ORDER BY id LIMIT 1")
    .get(courseId) as ExamRow | undefined;
}

function getAttemptSummary(userId: string | undefined, examId: string | undefined) {
  if (!userId || !examId) return undefined;
  return db
    .prepare(
      `SELECT COUNT(*) AS total, MAX(passed) AS passed,
         (SELECT score FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY created_at DESC LIMIT 1) AS latest_score
       FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?`,
    )
    .get(userId, examId, userId, examId) as { total: unknown; passed: unknown; latest_score: unknown };
}

function getRequirement(userId: string | undefined, course: CourseRow): LevelRequirement {
  const exam = getExam(course.id);
  const counts = db
    .prepare(
      `SELECT COUNT(l.id) AS total,
         SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END) AS completed
       FROM lessons l
       JOIN modules m ON m.id = l.module_id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
       WHERE m.course_id = ?`,
    )
    .get(userId ?? "", course.id) as { total: unknown; completed: unknown };
  const attempts = userId && exam
    ? db
        .prepare(
          `SELECT COUNT(*) AS total,
             MAX(passed) AS passed,
             (SELECT score FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY created_at DESC LIMIT 1) AS latest_score
           FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?`,
        )
        .get(userId, exam.id, userId, exam.id) as { total: unknown; passed: unknown; latest_score: unknown }
    : undefined;

  return {
    courseSlug: course.slug,
    courseTitle: course.title,
    lessonsCompleted: num(counts.completed),
    lessonsTotal: num(counts.total),
    examQuizId: exam?.id ?? null,
    examTitle: exam?.title ?? null,
    passingScore: exam ? num(exam.passing_score) : null,
    examAttempts: num(attempts?.total),
    examPassed: Boolean(attempts?.passed),
    latestExamScore: attempts?.latest_score == null ? null : num(attempts.latest_score),
  };
}

function hasStarted(userId: string, courseId: string): boolean {
  return Boolean(
    db
      .prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1")
      .get(userId, courseId),
  ) || num(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS total FROM lesson_progress lp
           JOIN lessons l ON l.id = lp.lesson_id
           JOIN modules m ON m.id = l.module_id
           WHERE lp.user_id = ? AND m.course_id = ?`,
        )
        .get(userId, courseId) as { total: unknown }
    ).total,
  ) > 0;
}

export function getEthicalCourseAccess(userId: string | undefined, slug: string): CourseAccess {
  const levelIndex = LEVELS.indexOf(slug as (typeof LEVELS)[number]);
  if (levelIndex < 0) return { available: true, reason: null, requirement: null };

  if (levelIndex === 0) {
    const course = db.prepare("SELECT id, slug, title FROM courses WHERE slug = ?").get(slug) as CourseRow | undefined;
    if (!course) return { available: false, reason: "This level is not available yet.", requirement: null };
    const progression = getRequirement(userId, course);
    const entryExam = getEntryExam(course.id);
    const attempts = getAttemptSummary(userId, entryExam?.id);
    const requirement: LevelRequirement = {
      ...progression,
      examQuizId: entryExam?.id ?? null,
      examTitle: entryExam?.title ?? null,
      passingScore: entryExam ? num(entryExam.passing_score) : null,
      examAttempts: num(attempts?.total),
      examPassed: Boolean(attempts?.passed),
      latestExamScore: attempts?.latest_score == null ? null : num(attempts.latest_score),
    };
    const existingLearner = userId ? hasStarted(userId, course.id) : false;
    const available = requirement.examAttempts > 0 || existingLearner;
    if (!requirement.examQuizId) {
      return { available: false, reason: "The Basic entry exam is being prepared.", requirement };
    }
    return {
      available,
      reason: available
        ? null
        : "Complete the Basic entry exam before opening the first lesson. If you do not pass, the Basic lessons will still open so you can study and retake it.",
      requirement,
    };
  }

  const previousSlug = LEVELS[levelIndex - 1];
  const previousCourse = db
    .prepare("SELECT id, slug, title FROM courses WHERE slug = ?")
    .get(previousSlug) as CourseRow | undefined;
  if (!previousCourse) return { available: false, reason: "The previous level is not available yet.", requirement: null };

  const requirement = getRequirement(userId, previousCourse);
  const lessonsComplete = requirement.lessonsTotal > 0 && requirement.lessonsCompleted >= requirement.lessonsTotal;
  const available = lessonsComplete && requirement.examPassed;
  let reason: string | null = null;
  if (!lessonsComplete) {
    reason = "Complete all " + requirement.courseTitle + " lessons to unlock this level.";
  } else if (!requirement.examPassed && requirement.examAttempts > 0) {
    reason = "Score at least " + String(requirement.passingScore ?? 80) + "% on the " + requirement.courseTitle + " level exam to unlock this level. Keep studying and retake it when ready.";
  } else if (!requirement.examPassed) {
    reason = "Pass the " + requirement.courseTitle + " level exam with at least " + String(requirement.passingScore ?? 80) + "% to unlock this level.";
  }
  if (!requirement.examQuizId && lessonsComplete) {
    reason = "The " + requirement.courseTitle + " level exam is being prepared.";
  }
  return { available, reason, requirement };
}

export function getEthicalQuizAccess(userId: string, quizId: string): CourseAccess | null {
  const quiz = db
    .prepare(
      `SELECT q.title, c.slug AS course_slug
       FROM quizzes q
       LEFT JOIN modules m ON m.id = (
         SELECT l.module_id FROM lessons l WHERE l.id = q.lesson_id
       )
       LEFT JOIN courses c ON c.id = COALESCE(q.course_id, m.course_id)
       WHERE q.id = ?`,
    )
    .get(quizId) as { title: string; course_slug: string | null } | undefined;
  if (!quiz?.course_slug || !LEVELS.includes(quiz.course_slug as (typeof LEVELS)[number])) return null;

  if (quiz.title.startsWith("Entry Exam:") && quiz.course_slug === LEVELS[0]) {
    return { available: true, reason: null, requirement: null };
  }
  const courseAccess = getEthicalCourseAccess(userId, quiz.course_slug);
  if (!quiz.title.startsWith("Level Exam:") || !courseAccess.available) return courseAccess;

  const course = db
    .prepare("SELECT id, slug, title FROM courses WHERE slug = ?")
    .get(quiz.course_slug) as CourseRow | undefined;
  if (!course) return { available: false, reason: "This level is not available yet.", requirement: null };
  const requirement = getRequirement(userId, course);
  const lessonsComplete = requirement.lessonsTotal > 0 && requirement.lessonsCompleted >= requirement.lessonsTotal;
  return {
    available: lessonsComplete,
    reason: lessonsComplete ? null : "Complete all " + course.title + " lessons before taking its progression exam.",
    requirement,
  };
}
