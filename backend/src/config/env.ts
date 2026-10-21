import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.resolve(here, "../..");
dotenv.config({ path: path.resolve(backendRoot, "../.env") });
dotenv.config({ path: path.resolve(backendRoot, ".env") });

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProd = nodeEnv === "production";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function parseOrigins(): string[] {
  const raw = process.env.FRONTEND_ORIGIN ?? (isProd ? "" : "http://localhost:5173");
  const origins = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (origins.length === 0) {
    if (isProd) throw new Error("Set FRONTEND_ORIGIN to the production frontend origin(s).");
    return ["http://localhost:5173"];
  }
  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`Invalid frontend origin: ${origin}`);
    }
    if (parsed.origin !== origin || (isProd && parsed.protocol !== "https:")) {
      throw new Error(`FRONTEND_ORIGIN must contain only valid${isProd ? " HTTPS" : ""} origins.`);
    }
  }
  return [...new Set(origins)];
}

const jwtSecret = required("JWT_SECRET", isProd ? undefined : "dev-only-change-me-please-use-a-long-secret");
if (isProd && (jwtSecret.length < 32 || jwtSecret.startsWith("dev-only"))) {
  throw new Error("Production JWT_SECRET must be a unique random value of at least 32 characters.");
}

const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
if (isProd && (!Number.isInteger(trustProxyHops) || trustProxyHops < 0)) {
  throw new Error("TRUST_PROXY_HOPS must be a whole number greater than or equal to zero.");
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv,
  frontendOrigins: parseOrigins(),
  get frontendOrigin() {
    return this.frontendOrigins[0];
  },
  databasePath: path.resolve(backendRoot, process.env.DATABASE_PATH ?? "../database/cybercode.db"),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "ccl_session",
  youtubeChannelUrl: process.env.YOUTUBE_CHANNEL_URL ?? "https://www.youtube.com/@CyberCodeLab",
  youtubeChannelName: process.env.YOUTUBE_CHANNEL_NAME ?? "CyberCode Lab",
  youtubePreviewSeconds: Math.max(15, Number(process.env.YOUTUBE_PREVIEW_SECONDS ?? 45) || 45),
  trustProxy: isProd ? trustProxyHops : false,
  isProd,
};
