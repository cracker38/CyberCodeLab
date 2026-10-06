import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { backendRoot, env } from "./env.js";

const dir = path.dirname(env.databasePath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

export const db = new DatabaseSync(env.databasePath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

export function initSchema(): void {
  const schemaPath = path.resolve(backendRoot, "../database/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  db.exec(sql);
}

export function nowIso(): string {
  return new Date().toISOString();
}
