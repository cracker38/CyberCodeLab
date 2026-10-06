import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const first = result.error.issues[0];
      res.status(400).json({ error: first?.message ?? "Invalid request." });
      return;
    }
    req[source] = result.data as never;
    next();
  };
}
