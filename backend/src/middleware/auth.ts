import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { db } from "../config/db.js";
import { verifyToken } from "../utils/crypto.js";

export type RoleName = "USER" | "INSTRUCTOR" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  emailVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.cookieName] as string | undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const { sub } = verifyToken(token);
    const row = db
      .prepare(
        `SELECT u.id, u.email, u.full_name, u.email_verified, r.name as role
         FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
      )
      .get(sub) as
      | { id: string; email: string; full_name: string; email_verified: number; role: RoleName }
      | undefined;
    if (row) {
      req.user = {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role,
        emailVerified: Boolean(row.email_verified),
      };
    }
  } catch {
    /* invalid token treated as anonymous */
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({ error: "Please sign in to continue." });
      return;
    }
    next();
  });
}

export function requireRole(...roles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Please sign in to continue." });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
}
