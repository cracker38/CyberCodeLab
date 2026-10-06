import type { Request, Response } from "express";
import { db, nowIso } from "../config/db.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../utils/audit.js";
import { clearSession, setSession } from "../utils/cookies.js";
import { hashPassword, randomToken, sha256, signToken, verifyPassword } from "../utils/crypto.js";
import { id } from "../utils/ids.js";

function publicUser(row: {
  id: string;
  email: string;
  full_name: string;
  email_verified: number;
  role: string;
  bio?: string | null;
}) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    emailVerified: Boolean(row.email_verified),
    bio: row.bio ?? "",
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body as {
    email: string;
    password: string;
    fullName: string;
  };
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }
  const userId = id();
  const verifyToken = randomToken();
  const role = db.prepare("SELECT id FROM roles WHERE name = 'USER'").get() as { id: number };
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role_id, email_verified, email_verify_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
  ).run(userId, email, await hashPassword(password), fullName, role.id, sha256(verifyToken), nowIso(), nowIso());
  audit(userId, "register", req.ip);
  const token = signToken({ sub: userId, role: "USER" });
  setSession(res, token);
  const payload: Record<string, unknown> = {
    user: publicUser({
      id: userId,
      email,
      full_name: fullName,
      email_verified: 0,
      role: "USER",
    }),
  };
  if (!env.isProd) payload.verifyToken = verifyToken;
  res.status(201).json(payload);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const row = db
    .prepare(
      `SELECT u.*, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`,
    )
    .get(email) as
    | {
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        email_verified: number;
        role: string;
        bio: string | null;
      }
    | undefined;
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(nowIso(), row.id);
  audit(row.id, "login", req.ip);
  setSession(res, signToken({ sub: row.id, role: row.role }));
  res.json({ user: publicUser(row) });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  audit(req.user?.id, "logout", req.ip);
  clearSession(res);
  res.json({ ok: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.json({ user: null });
    return;
  }
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.email_verified, u.bio, r.name as role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    )
    .get(req.user.id) as {
    id: string;
    email: string;
    full_name: string;
    email_verified: number;
    bio: string | null;
    role: string;
  };
  res.json({ user: publicUser(row) });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, bio } = req.body as { fullName: string; bio?: string | null };
  db.prepare("UPDATE users SET full_name = ?, bio = ?, updated_at = ? WHERE id = ?").run(
    fullName,
    bio ?? null,
    nowIso(),
    req.user!.id,
  );
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.email_verified, u.bio, r.name as role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    )
    .get(req.user!.id) as {
    id: string;
    email: string;
    full_name: string;
    email_verified: number;
    bio: string | null;
    role: string;
  };
  res.json({ user: publicUser(row) });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = String(req.query.token ?? "");
  if (!token) {
    res.status(400).json({ error: "Missing verification token." });
    return;
  }
  const hashed = sha256(token);
  const row = db.prepare("SELECT id FROM users WHERE email_verify_token = ?").get(hashed) as
    | { id: string }
    | undefined;
  if (!row) {
    res.status(400).json({ error: "Invalid or expired verification token." });
    return;
  }
  db.prepare(
    "UPDATE users SET email_verified = 1, email_verify_token = NULL, updated_at = ? WHERE id = ?",
  ).run(nowIso(), row.id);
  res.json({ ok: true });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const row = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
  const payload: Record<string, unknown> = {
    ok: true,
    message: "If that account exists, a reset link has been prepared.",
  };
  if (row) {
    const token = randomToken();
    db.prepare(
      "UPDATE users SET password_reset_token = ?, password_reset_expires = ?, updated_at = ? WHERE id = ?",
    ).run(sha256(token), Date.now() + 60 * 60 * 1000, nowIso(), row.id);
    if (!env.isProd) payload.resetToken = token;
  }
  res.json(payload);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  const hashed = sha256(token);
  const row = db
    .prepare("SELECT id, password_reset_expires FROM users WHERE password_reset_token = ?")
    .get(hashed) as { id: string; password_reset_expires: number } | undefined;
  if (!row || row.password_reset_expires < Date.now()) {
    res.status(400).json({ error: "Invalid or expired reset token." });
    return;
  }
  db.prepare(
    `UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = ?
     WHERE id = ?`,
  ).run(await hashPassword(password), nowIso(), row.id);
  audit(row.id, "password_reset", req.ip);
  res.json({ ok: true });
});
