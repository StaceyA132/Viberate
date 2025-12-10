import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { HttpError } from "./errorHandler";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new HttpError(400, "Invalid request body", result.error.flatten()));
      return;
    }
    // replace body with parsed data for downstream use
    req.body = result.data;
    next();
  };
}
