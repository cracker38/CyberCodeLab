import type { Request, Response } from "express";
import { db, nowIso } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { id, parseJson } from "../utils/ids.js";
import { isYouTubeId, likeContains } from "../utils/sql.js";

const VIDEO_LINKS: Record<string, { courseSlug?: string; labSlug?: string }> = {
  "Welcome to CyberCode Lab": { courseSlug: "cybersecurity-fundamentals" },
  "TCP/IP without the intimidation": { courseSlug: "networking-essentials", labSlug: "dns-analysis-lab" },
  "Your first defensive Python script": { courseSlug: "python-for-cybersecurity", labSlug: "hashing-demo-lab" },
  "Linux permissions in 12 minutes": { courseSlug: "linux-for-security", labSlug: "file-integrity-lab" },
};

function mapVideo(row: Record<string, unknown>) {
  const youtubeId = String(row.youtube_id);
  const title = String(row.title);
  const embeddable = isYouTubeId(youtubeId);
  const links = VIDEO_LINKS[title] ?? {};
  return {
    id: row.id,
    youtubeId,
    title,
    description: row.description,
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
    embeddable,
    watchUrl: embeddable
      ? `https://www.youtube.com/watch?v=${youtubeId}`
      : process.env.YOUTUBE_CHANNEL_URL ?? "https://www.youtube.com/@CyberCodeLab",
    thumbnailUrl: embeddable ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null,
    relatedCourseSlug: links.courseSlug ?? null,
    relatedLabSlug: links.labSlug ?? null,
  };
}

export const listLabs = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const category = String(req.query.category ?? "").trim();
  const difficulty = String(req.query.difficulty ?? "").trim();
  let sql = "SELECT * FROM labs WHERE published = 1";
  const params: string[] = [];
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (difficulty) {
    sql += " AND difficulty = ?";
    params.push(difficulty);
  }
  if (q) {
    sql += " AND (lower(title) LIKE ? OR lower(description) LIKE ? OR lower(category) LIKE ?)";
    const like = likeContains(q);
    params.push(like, like, like);
  }
  sql += " ORDER BY category, title";
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  const facets = db
    .prepare("SELECT category, difficulty FROM labs WHERE published = 1")
    .all() as { category: string; difficulty: string }[];
  const completedIds = new Set<string>();
  if (req.user) {
    const done = db
      .prepare("SELECT lab_id FROM lab_progress WHERE user_id = ? AND completed = 1")
      .all(req.user.id) as { lab_id: string }[];
    done.forEach((r) => completedIds.add(r.lab_id));
  }
  res.json({
    labs: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      difficulty: r.difficulty,
      description: r.description,
      environmentNote: r.environment_note,
      completed: completedIds.has(String(r.id)),
    })),
    facets: {
      categories: [...new Set(facets.map((f) => f.category))],
      difficulties: [...new Set(facets.map((f) => f.difficulty))],
    },
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
  const labId = String(lab.id);
  const relatedCourseId = lab.related_course_id ? String(lab.related_course_id) : "";
  let completed = false;
  if (req.user) {
    completed = Boolean(
      db
        .prepare("SELECT id FROM lab_progress WHERE user_id = ? AND lab_id = ? AND completed = 1")
        .get(req.user.id, labId),
    );
  }
  const course = relatedCourseId
    ? (db.prepare("SELECT slug, title FROM courses WHERE id = ?").get(relatedCourseId) as
        | { slug: string; title: string }
        | undefined)
    : null;
  const project = relatedCourseId
    ? (db
        .prepare(
          "SELECT slug, title FROM projects WHERE related_course_id = ? AND published = 1 ORDER BY title LIMIT 1",
        )
        .get(relatedCourseId) as { slug: string; title: string } | undefined)
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
      relatedProject: project ?? null,
      completed,
    },
  });
});

export const completeLab = asyncHandler(async (req: Request, res: Response) => {
  const lab = db.prepare("SELECT id FROM labs WHERE slug = ? AND published = 1").get(req.params.slug) as
    | { id: string }
    | undefined;
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

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const difficulty = String(req.query.difficulty ?? "").trim();
  let sql = "SELECT * FROM projects WHERE published = 1";
  const params: string[] = [];
  if (difficulty) {
    sql += " AND difficulty = ?";
    params.push(difficulty);
  }
  if (q) {
    sql += " AND (lower(title) LIKE ? OR lower(description) LIKE ? OR lower(technologies) LIKE ? OR lower(skills) LIKE ?)";
    const like = likeContains(q);
    params.push(like, like, like, like);
  }
  sql += " ORDER BY title";
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  const facets = db.prepare("SELECT difficulty FROM projects WHERE published = 1").all() as { difficulty: string }[];
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
    facets: { difficulties: [...new Set(facets.map((f) => f.difficulty))] },
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
  const relatedCourseId = project.related_course_id ? String(project.related_course_id) : "";
  const course = relatedCourseId
    ? (db.prepare("SELECT slug, title FROM courses WHERE id = ?").get(relatedCourseId) as
        | { slug: string; title: string }
        | undefined)
    : null;
  const labs = relatedCourseId
    ? (db
        .prepare(
          "SELECT slug, title, difficulty FROM labs WHERE related_course_id = ? AND published = 1 ORDER BY title LIMIT 4",
        )
        .all(relatedCourseId) as { slug: string; title: string; difficulty: string }[])
    : [];
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
      relatedLabs: labs,
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
    const like = likeContains(q);
    params.push(like, like, like);
  }
  sql += " ORDER BY title";
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  const facets = db
    .prepare("SELECT type, category FROM resources WHERE published = 1")
    .all() as { type: string; category: string }[];
  res.json({
    resources: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      type: r.type,
      category: r.category,
      summary: r.summary,
    })),
    facets: {
      types: [...new Set(facets.map((f) => f.type))],
      categories: [...new Set(facets.map((f) => f.category))],
    },
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
  const related = db
    .prepare(
      "SELECT slug, title, type FROM resources WHERE published = 1 AND category = ? AND slug != ? ORDER BY title LIMIT 3",
    )
    .all(String(resource.category), String(resource.slug)) as { slug: string; title: string; type: string }[];
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
      related,
    },
  });
});

export const youtube = asyncHandler(async (_req: Request, res: Response) => {
  const videos = db.prepare("SELECT * FROM youtube_videos ORDER BY sort_order").all() as Record<string, unknown>[];
  res.json({
    channelUrl: process.env.YOUTUBE_CHANNEL_URL ?? "https://www.youtube.com/@CyberCodeLab",
    channelName: process.env.YOUTUBE_CHANNEL_NAME ?? "CyberCode Lab",
    videos: videos.map(mapVideo),
  });
});

export const announcements = asyncHandler(async (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT id, title, body, created_at FROM announcements WHERE published = 1 ORDER BY created_at DESC LIMIT 8")
    .all();
  res.json({ announcements: rows });
});

export const catalogHome = asyncHandler(async (_req: Request, res: Response) => {
  const courses = db
    .prepare(
      "SELECT slug, title, subtitle, level, category, estimated_hours FROM courses WHERE published = 1 ORDER BY title LIMIT 6",
    )
    .all();
  const labs = db
    .prepare("SELECT slug, title, category, difficulty, description FROM labs WHERE published = 1 ORDER BY title LIMIT 4")
    .all();
  const projects = db
    .prepare("SELECT slug, title, description, difficulty FROM projects WHERE published = 1 ORDER BY title LIMIT 3")
    .all();
  const videos = (db.prepare("SELECT * FROM youtube_videos ORDER BY sort_order LIMIT 3").all() as Record<string, unknown>[]).map(
    mapVideo,
  );
  const announcements = db
    .prepare("SELECT title, body, created_at FROM announcements WHERE published = 1 ORDER BY created_at DESC LIMIT 2")
    .all();
  const counts = {
    courses: Number((db.prepare("SELECT COUNT(*) as c FROM courses WHERE published = 1").get() as { c: number }).c),
    labs: Number((db.prepare("SELECT COUNT(*) as c FROM labs WHERE published = 1").get() as { c: number }).c),
    projects: Number((db.prepare("SELECT COUNT(*) as c FROM projects WHERE published = 1").get() as { c: number }).c),
    resources: Number((db.prepare("SELECT COUNT(*) as c FROM resources WHERE published = 1").get() as { c: number }).c),
    videos: Number((db.prepare("SELECT COUNT(*) as c FROM youtube_videos").get() as { c: number }).c),
  };
  res.json({ courses, labs, projects, videos, announcements, counts });
});
