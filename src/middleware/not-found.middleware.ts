import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response';

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json(sendError(`Route ${req.originalUrl} not found`));
};
