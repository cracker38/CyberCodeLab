# CyberCode Lab

**Learn. Code. Practice. Secure.**

A professional cybersecurity education platform: structured courses, authorized labs, projects, quizzes, progress tracking, and administration.

The catalog includes 15 learning paths across fundamentals, networking, Linux, Python, web security, AI, authorized penetration testing, secure software development, blue-team operations, cloud security, digital forensics, DevSecOps, and security governance. Paths are organized across Basic (Beginner), Intermediate, and Advanced levels, with structured modules, focused lessons, practical exercises, and course knowledge checks. The ethical penetration-testing path includes 3 beginner modules and 4 modules at both intermediate and advanced levels. Existing databases receive curriculum updates automatically when the API starts; learner accounts and lesson progress are preserved.

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

For production, set a unique `JWT_SECRET` with at least 32 random characters, list only HTTPS frontend origins in
`FRONTEND_ORIGIN`, and set `TRUST_PROXY_HOPS` to match the number of trusted reverse proxies in front of the API.

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
