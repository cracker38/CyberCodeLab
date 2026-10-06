import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const message = err instanceof Error ? err.message : "Unexpected error";
  if (env.nodeEnv !== "production") {
    console.error(err);
  } else {
    console.error("Request failed");
  }
  if (message.includes("UNIQUE constraint")) {
    res.status(409).json({ error: "That record already exists." });
    return;
  }
  res.status(500).json({ error: "Something went wrong. Please try again." });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Resource not found." });
}
