# CyberCode Lab — architecture notes

## Why SQLite

The product spec listed PostgreSQL. Local XAMPP-style development and the explicit request for SQLite make a single-file database a better default. The schema stays relational and portable: swapping to PostgreSQL later is mostly dialect and connection-string work.

## Content vs UI

Courses, modules, lessons, labs, quizzes, projects, and resources are stored in SQLite. The React app renders whatever the API returns. Instructors and admins can add catalog items without shipping a frontend change.

## Auth

- bcrypt (12 rounds) for passwords
- JWT in an httpOnly, SameSite=Lax cookie
- Roles: USER, INSTRUCTOR, ADMIN
- Rate limits on auth routes
- Email verify and password reset tokens stored as SHA-256 hashes

Development responses may include verify/reset tokens because there is no SMTP in the local stack. Production should send email instead and never return tokens in JSON.

## Security posture (current)

Parameterized SQL, Zod validation, helmet headers, CORS locked to the frontend origin, generic API errors, audit log table for auth events, role checks on admin routes.

## Future-ready (not built)

Payments, community, live classes, in-browser terminals, CTF engines, and an AI tutor can attach as new tables and routes without rewriting the learner UI shell.
