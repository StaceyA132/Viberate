import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const status = err instanceof HttpError ? err.status : 500;
  const body = {
    error: err.message ?? "Internal Server Error",
    details: err instanceof HttpError ? err.details : undefined,
  };

  res.status(status).json(body);
}
