import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "./env.js";

const dir = path.dirname(env.databasePath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

export const db = new Database(env.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initSchema(): void {
  const schemaPath = path.resolve(path.dirname(env.databasePath), "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  db.exec(sql);
}

export function nowIso(): string {
  return new Date().toISOString();
}
