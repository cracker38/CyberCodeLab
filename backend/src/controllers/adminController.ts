import type { Request, Response } from "express";
import { db, nowIso } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { id } from "../utils/ids.js";
import { num } from "../utils/sql.js";

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.email_verified, u.created_at, r.name as role,
        (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as enrollments
       FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.created_at DESC`,
    )
    .all();
  res.json({ users });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const roleName = String(req.body.role ?? "");
  if (!["USER", "INSTRUCTOR", "ADMIN"].includes(roleName)) {
    res.status(400).json({ error: "Invalid role." });
    return;
  }
  const target = db
    .prepare("SELECT u.id, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?")
    .get(req.params.id) as { id: string; role: string } | undefined;
  if (!target) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  if (target.id === req.user!.id && roleName !== "ADMIN") {
    res.status(409).json({ error: "You cannot remove your own administrator access." });
    return;
  }
  if (target.role === "ADMIN" && roleName !== "ADMIN") {
    const admins = num((db.prepare("SELECT COUNT(*) as c FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'ADMIN'").get() as { c: unknown }).c);
    if (admins <= 1) {
      res.status(409).json({ error: "The platform must keep at least one administrator." });
      return;
    }
  }
  const role = db.prepare("SELECT id FROM roles WHERE name = ?").get(roleName) as { id: number } | undefined;
  if (!role) {
    res.status(400).json({ error: "Invalid role." });
    return;
  }
  db.prepare("UPDATE users SET role_id = ?, updated_at = ? WHERE id = ?").run(role.id, nowIso(), req.params.id);
  res.json({ ok: true });
});

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    slug: string;
    title: string;
    subtitle?: string;
    description: string;
    level: string;
    category: string;
    estimatedHours?: number;
    prerequisites?: string[];
    nextCourseSlug?: string | null;
    learningObjectives?: string[];
    modules: {
      title: string;
      description?: string;
      lessons: {
        slug: string;
        title: string;
        content: string;
        codeExample?: string;
        exercise?: string;
        durationMinutes: number;
      }[];
    }[];
    published?: boolean;
  };
  const courseId = id();
  let lessonCount = 0;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      `INSERT INTO courses (id, slug, title, subtitle, description, level, category, estimated_hours, prerequisites, next_course_slug, learning_objectives, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      courseId,
      body.slug,
      body.title,
      body.subtitle ?? "",
      body.description,
      body.level,
      body.category,
      body.estimatedHours ?? 8,
      JSON.stringify(body.prerequisites ?? []),
      body.nextCourseSlug ?? null,
      JSON.stringify(body.learningObjectives ?? []),
      body.published === false ? 0 : 1,
      nowIso(),
      nowIso(),
    );

    const addModule = db.prepare("INSERT INTO modules (id, course_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)");
    const addLesson = db.prepare(
      `INSERT INTO lessons (id, module_id, slug, title, content, code_example, exercise, sort_order, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    body.modules.forEach((module, moduleIndex) => {
      const moduleId = id();
      addModule.run(moduleId, courseId, module.title, module.description ?? "", moduleIndex);
      module.lessons.forEach((lesson, lessonIndex) => {
        addLesson.run(
          id(),
          moduleId,
          lesson.slug,
          lesson.title,
          lesson.content,
          lesson.codeExample ?? null,
          lesson.exercise ?? null,
          lessonIndex,
          lesson.durationMinutes,
        );
        lessonCount += 1;
      });
    });
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  res.status(201).json({ id: courseId, modulesCreated: body.modules.length, lessonsCreated: lessonCount });
});

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    courseId: string;
    title: string;
    passingScore: number;
    questions: {
      prompt: string;
      type: "single" | "multiple";
      explanation?: string;
      answers: { label: string; correct: boolean }[];
    }[];
  };
  const course = db.prepare("SELECT id FROM courses WHERE id = ?").get(body.courseId) as { id: string } | undefined;
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  const existing = db.prepare("SELECT id FROM quizzes WHERE course_id = ? AND lesson_id IS NULL").get(course.id);
  if (existing) {
    res.status(409).json({ error: "This course already has a final assessment." });
    return;
  }

  const quizId = id();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO quizzes (id, title, course_id, passing_score) VALUES (?, ?, ?, ?)").run(
      quizId,
      body.title,
      course.id,
      body.passingScore,
    );
    const addQuestion = db.prepare(
      "INSERT INTO questions (id, quiz_id, prompt, type, explanation, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const addAnswer = db.prepare(
      "INSERT INTO answers (id, question_id, label, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)",
    );
    body.questions.forEach((question, questionIndex) => {
      const questionId = id();
      addQuestion.run(questionId, quizId, question.prompt, question.type, question.explanation ?? null, questionIndex);
      question.answers.forEach((answer, answerIndex) => {
        addAnswer.run(id(), questionId, answer.label, answer.correct ? 1 : 0, answerIndex);
      });
    });
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  res.status(201).json({ id: quizId, questionsCreated: body.questions.length });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { title, body, published } = req.body as { title: string; body: string; published?: boolean };
  const annId = id();
  db.prepare(
    "INSERT INTO announcements (id, title, body, published, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(annId, title, body, published === false ? 0 : 1, nowIso(), req.user!.id);
  res.status(201).json({ id: annId });
});

export const createLab = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    slug: string;
    title: string;
    category: string;
    difficulty: string;
    description: string;
    objectives?: string[];
    instructions: string;
    relatedCourseId?: string | null;
    published?: boolean;
  };
  const labId = id();
  db.prepare(
    `INSERT INTO labs (id, slug, title, category, difficulty, description, objectives, instructions, related_course_id, published, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    labId,
    body.slug,
    body.title,
    body.category,
    body.difficulty,
    body.description,
    JSON.stringify(body.objectives ?? []),
    body.instructions,
    body.relatedCourseId ?? null,
    body.published === false ? 0 : 1,
    nowIso(),
  );
  res.status(201).json({ id: labId });
});

export const createResource = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    slug: string;
    title: string;
    type: string;
    category: string;
    summary: string;
    body: string;
    downloadUrl?: string | null;
    published?: boolean;
  };
  const resourceId = id();
  db.prepare(
    `INSERT INTO resources (id, slug, title, type, category, summary, body, download_url, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    resourceId,
    body.slug,
    body.title,
    body.type,
    body.category,
    body.summary,
    body.body,
    body.downloadUrl ?? null,
    body.published === false ? 0 : 1,
  );
  res.status(201).json({ id: resourceId });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    slug: string;
    title: string;
    description: string;
    technologies?: string[];
    difficulty: string;
    skills?: string[];
    githubUrl?: string | null;
    demoUrl?: string | null;
    relatedCourseId?: string | null;
    readme?: string;
    published?: boolean;
  };
  const projectId = id();
  db.prepare(
    `INSERT INTO projects (id, slug, title, description, technologies, difficulty, skills, github_url, demo_url, related_course_id, readme, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    projectId,
    body.slug,
    body.title,
    body.description,
    JSON.stringify(body.technologies ?? []),
    body.difficulty,
    JSON.stringify(body.skills ?? []),
    body.githubUrl ?? null,
    body.demoUrl ?? null,
    body.relatedCourseId ?? null,
    body.readme ?? "",
    body.published === false ? 0 : 1,
  );
  res.status(201).json({ id: projectId });
});

export const adminStats = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    users: num((db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: unknown }).c),
    courses: num((db.prepare("SELECT COUNT(*) as c FROM courses").get() as { c: unknown }).c),
    labs: num((db.prepare("SELECT COUNT(*) as c FROM labs").get() as { c: unknown }).c),
    certificates: num((db.prepare("SELECT COUNT(*) as c FROM certificates").get() as { c: unknown }).c),
  });
});

export const listCertificates = asyncHandler(async (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT cert.id, u.full_name, u.email, c.title as course_title, cert.issued_at
       FROM certificates cert
       JOIN users u ON u.id = cert.user_id
       JOIN courses c ON c.id = cert.course_id
       ORDER BY cert.issued_at DESC`,
    )
    .all();
  res.json({ certificates: rows });
});
