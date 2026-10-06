# CyberCode Lab

**Learn. Code. Practice. Secure.**

A professional cybersecurity education platform: structured courses, authorized labs, projects, quizzes, progress tracking, and administration.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite (file-based, suitable for local and small deployments)

All labs and exercises are for **educational / authorized environments only**.

## Quick start

### Prerequisites

- Node.js 20+
- npm

### 1. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

API: `http://localhost:4000`

### 2. Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@cybercodelab.local` | `AdminLab!2026` |
| Learner | `learner@cybercodelab.local` | `LearnLab!2026` |

Change these passwords before any shared or production use.

## Architecture

- Course, lab, quiz, and resource **content lives in SQLite**, not in React components.
- Auth uses **httpOnly cookies**, **bcrypt** password hashes, and **role-based** access (`USER`, `INSTRUCTOR`, `ADMIN`).
- Public certificate verification: `/verify/:certificateId`

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| backend | `npm run dev` | API with watch |
| backend | `npm run seed` | Create schema + sample content |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production build |
