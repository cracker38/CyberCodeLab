import { db, nowIso } from "../config/db.js";
import { id } from "../utils/ids.js";

export function audit(userId: string | undefined, action: string, ip: string | undefined, meta?: unknown): void {
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, ip, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id(), userId ?? null, action, ip ?? null, meta ? JSON.stringify(meta) : null, nowIso());
}
