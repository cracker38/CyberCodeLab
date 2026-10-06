import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: { sub: string; role: string }): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn, issuer: "cybercode-lab" });
}

export function verifyToken(token: string): { sub: string; role: string } {
  const decoded = jwt.verify(token, env.jwtSecret) as { sub: string; role: string };
  return { sub: decoded.sub, role: decoded.role };
}

export function randomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
