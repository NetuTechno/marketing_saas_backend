import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/api-response';
import { Prisma } from '@prisma/client';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err.message);

  if (err instanceof ZodError) {
    return res.status(400).json(sendError('Validation error', err.format()));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json(sendError('Duplicate resource', err.meta));
    }
    return res.status(400).json(sendError('Database error', err.message));
  }

  const status = (err as any).status || 500;
  const message = err.message || 'Something went wrong';

  // Do not send stack traces in production
  const errorDetails = process.env.NODE_ENV === 'development' ? err : undefined;

  res.status(status).json(sendError(message, errorDetails));
};
