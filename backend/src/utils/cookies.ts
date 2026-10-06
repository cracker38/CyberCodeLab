import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: env.isProd ? "none" : "lax",
    secure: env.isProd,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function setSession(res: Response, token: string): void {
  res.cookie(env.cookieName, token, sessionCookieOptions());
}

export function clearSession(res: Response): void {
  res.clearCookie(env.cookieName, { ...sessionCookieOptions(), maxAge: 0 });
}
