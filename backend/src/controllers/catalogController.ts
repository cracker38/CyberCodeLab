import type { Request, Response } from "express";
import { db, nowIso } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { id, parseJson } from "../utils/ids.js";

export const listLabs = asyncHandler(async (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM labs WHERE published = 1 ORDER BY category, title").all() as Record<
    string,
    unknown
  >[];
  res.json({
    labs: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      difficulty: r.difficulty,
      description: r.description,
      environmentNote: r.environment_note,
    })),
  });
});

export const getLab = asyncHandler(async (req: Request, res: Response) => {
  const lab = db.prepare("SELECT * FROM labs WHERE slug = ? AND published = 1").get(req.params.slug) as
    | Record<string, unknown>
    | undefined;
  if (!lab) {
    res.status(404).json({ error: "Lab not found." });
    return;
  }
  let completed = false;
  if (req.user) {
    completed = Boolean(
      db
        .prepare("SELECT id FROM lab_progress WHERE user_id = ? AND lab_id = ? AND completed = 1")
        .get(req.user.id, lab.id),
    );
  }
  const course = lab.related_course_id
    ? (db.prepare("SELECT slug, title FROM courses WHERE id = ?").get(lab.related_course_id) as
        | { slug: string; title: string }
        | undefined)
    : null;
  res.json({
    lab: {
      id: lab.id,
      slug: lab.slug,
      title: lab.title,
      category: lab.category,
      difficulty: lab.difficulty,
      description: lab.description,
      objectives: parseJson<string[]>(String(lab.objectives), []),
      instructions: lab.instructions,
      environmentNote: lab.environment_note,
      relatedCourse: course,
      completed,
    },
  });
});

export const completeLab = asyncHandler(async (req: Request, res: Response) => {
  const lab = db.prepare("SELECT id FROM labs WHERE slug = ?").get(req.params.slug) as { id: string } | undefined;
  if (!lab) {
    res.status(404).json({ error: "Lab not found." });
    return;
  }
  db.prepare(
    `INSERT INTO lab_progress (id, user_id, lab_id, completed, completed_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(user_id, lab_id) DO UPDATE SET completed = 1, completed_at = excluded.completed_at`,
  ).run(id(), req.user!.id, lab.id, nowIso());
  res.json({ ok: true });
});

export const listProjects = asyncHandler(async (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM projects WHERE published = 1 ORDER BY title").all() as Record<
    string,
    unknown
  >[];
  res.json({
    projects: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      technologies: parseJson<string[]>(String(r.technologies), []),
      difficulty: r.difficulty,
      skills: parseJson<string[]>(String(r.skills), []),
      githubUrl: r.github_url,
      demoUrl: r.demo_url,
    })),
  });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = db.prepare("SELECT * FROM projects WHERE slug = ? AND published = 1").get(req.params.slug) as
    | Record<string, unknown>
    | undefined;
  if (!project) {
    res.status(404).json({ error: "Project not found." });
    return;
  }
  const course = project.related_course_id
    ? (db.prepare("SELECT slug, title FROM courses WHERE id = ?").get(project.related_course_id) as
        | { slug: string; title: string }
        | undefined)
    : null;
  res.json({
    project: {
      id: project.id,
      slug: project.slug,
      title: project.title,
      description: project.description,
      technologies: parseJson<string[]>(String(project.technologies), []),
      difficulty: project.difficulty,
      skills: parseJson<string[]>(String(project.skills), []),
      githubUrl: project.github_url,
      demoUrl: project.demo_url,
      readme: project.readme,
      relatedCourse: course,
    },
  });
});

export const listResources = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const type = String(req.query.type ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  let sql = "SELECT * FROM resources WHERE published = 1";
  const params: string[] = [];
  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (q) {
    sql += " AND (lower(title) LIKE ? OR lower(summary) LIKE ? OR lower(body) LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY title";
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  res.json({
    resources: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      type: r.type,
      category: r.category,
      summary: r.summary,
    })),
  });
});

export const getResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = db.prepare("SELECT * FROM resources WHERE slug = ? AND published = 1").get(req.params.slug) as
    | Record<string, unknown>
    | undefined;
  if (!resource) {
    res.status(404).json({ error: "Resource not found." });
    return;
  }
  res.json({
    resource: {
      id: resource.id,
      slug: resource.slug,
      title: resource.title,
      type: resource.type,
      category: resource.category,
      summary: resource.summary,
      body: resource.body,
      downloadUrl: resource.download_url,
    },
  });
});

export const youtube = asyncHandler(async (_req: Request, res: Response) => {
  const videos = db.prepare("SELECT * FROM youtube_videos ORDER BY sort_order").all();
  res.json({
    channelUrl: process.env.YOUTUBE_CHANNEL_URL ?? "https://www.youtube.com/@CyberCodeLab",
    channelName: process.env.YOUTUBE_CHANNEL_NAME ?? "CyberCode Lab",
    videos,
  });
});

export const announcements = asyncHandler(async (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT id, title, body, created_at FROM announcements WHERE published = 1 ORDER BY created_at DESC LIMIT 8")
    .all();
  res.json({ announcements: rows });
});
