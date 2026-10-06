import { z } from "zod";

const password = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const registerSchema = z.object({
  email: z.string().email().max(180).transform((v) => v.toLowerCase().trim()),
  password,
  fullName: z.string().min(2).max(80).trim(),
});

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
});

export const forgotSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
});

export const resetSchema = z.object({
  token: z.string().min(20),
  password,
});

export const profileSchema = z.object({
  fullName: z.string().min(2).max(80).trim(),
  bio: z.string().max(500).optional().nullable(),
});

export const quizSubmitSchema = z.object({
  answers: z.record(z.union([z.string(), z.array(z.string())])),
});

export const courseCreateSchema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(160),
  subtitle: z.string().max(240).optional(),
  description: z.string().min(20),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  category: z.string().min(2).max(80),
  estimatedHours: z.number().int().min(1).max(200).optional(),
  prerequisites: z.array(z.string()).optional(),
  nextCourseSlug: z.string().optional().nullable(),
  learningObjectives: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(160),
  body: z.string().min(8).max(4000),
  published: z.boolean().optional(),
});

export const labCreateSchema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(160),
  category: z.string().min(2).max(80),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  description: z.string().min(20),
  objectives: z.array(z.string()).optional(),
  instructions: z.string().min(20),
  relatedCourseId: z.string().uuid().optional().nullable(),
  published: z.boolean().optional(),
});

export const resourceCreateSchema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(160),
  type: z.string().min(2).max(40),
  category: z.string().min(2).max(80),
  summary: z.string().min(8).max(400),
  body: z.string().min(20),
  downloadUrl: z.string().url().optional().nullable(),
  published: z.boolean().optional(),
});

export const projectCreateSchema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(160),
  description: z.string().min(20),
  technologies: z.array(z.string()).optional(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  skills: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional().nullable(),
  demoUrl: z.string().url().optional().nullable(),
  relatedCourseId: z.string().uuid().optional().nullable(),
  readme: z.string().optional(),
  published: z.boolean().optional(),
});
