PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  email_verified INTEGER NOT NULL DEFAULT 0,
  email_verify_token TEXT,
  password_reset_token TEXT,
  password_reset_expires INTEGER,
  bio TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_hours INTEGER NOT NULL DEFAULT 8,
  prerequisites TEXT NOT NULL DEFAULT '[]',
  next_course_slug TEXT,
  learning_objectives TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  code_example TEXT,
  exercise TEXT,
  video_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 12,
  UNIQUE(module_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);

CREATE TABLE IF NOT EXISTS labs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT NOT NULL DEFAULT '[]',
  instructions TEXT NOT NULL,
  environment_note TEXT NOT NULL DEFAULT 'Educational / Authorized Environment Only',
  related_course_id TEXT REFERENCES courses(id),
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_labs_category ON labs(category);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL,
  skills TEXT NOT NULL DEFAULT '[]',
  github_url TEXT,
  demo_url TEXT,
  related_course_id TEXT REFERENCES courses(id),
  readme TEXT,
  published INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  download_url TEXT,
  published INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  passing_score INTEGER NOT NULL DEFAULT 70
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS lab_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  notes TEXT,
  UNIQUE(user_id, lab_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, quiz_id);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TEXT NOT NULL,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  created_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  ip TEXT,
  meta TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS youtube_videos (
  id TEXT PRIMARY KEY,
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  published_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
