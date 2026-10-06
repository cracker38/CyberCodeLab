import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.resolve(here, "../..");
dotenv.config({ path: path.resolve(backendRoot, "../.env") });
dotenv.config({ path: path.resolve(backendRoot, ".env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function parseOrigins(): string[] {
  const raw = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  const origins = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return origins.length > 0 ? origins : ["http://localhost:5173"];
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendOrigins: parseOrigins(),
  get frontendOrigin() {
    return this.frontendOrigins[0];
  },
  databasePath: path.resolve(backendRoot, process.env.DATABASE_PATH ?? "../database/cybercode.db"),
  jwtSecret: required("JWT_SECRET", "dev-only-change-me-please-use-a-long-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "ccl_session",
  youtubeChannelUrl: process.env.YOUTUBE_CHANNEL_URL ?? "https://www.youtube.com/@CyberCodeLab",
  youtubeChannelName: process.env.YOUTUBE_CHANNEL_NAME ?? "CyberCode Lab",
  isProd: (process.env.NODE_ENV ?? "development") === "production",
};
