export type Role = "USER" | "INSTRUCTOR" | "ADMIN";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  emailVerified: boolean;
  bio?: string;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  level: string;
  category: string;
  estimatedHours: number;
  prerequisites: string[];
  nextCourseSlug?: string | null;
  learningObjectives: string[];
};
