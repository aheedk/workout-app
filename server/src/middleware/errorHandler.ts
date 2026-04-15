import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      statusCode: err.statusCode,
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    message: 'Internal server error',
    statusCode: 500,
  });
}
