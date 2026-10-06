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
  enrolled?: boolean;
  completed?: boolean;
  progressPercent?: number;
  lessonCount?: number;
};

export type LabCard = {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  completed?: boolean;
};

export type ProjectCard = {
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  difficulty: string;
  skills: string[];
};

export type ResourceCard = {
  slug: string;
  title: string;
  type: string;
  category: string;
  summary: string;
};

export type VideoCard = {
  youtubeId: string;
  title: string;
  description: string;
  embeddable: boolean;
  watchUrl: string;
  thumbnailUrl: string | null;
  relatedCourseSlug?: string | null;
  relatedLabSlug?: string | null;
};

export type Facets = Record<string, string[]>;
