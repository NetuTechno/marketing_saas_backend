import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types/auth.types';
import { Role } from '@prisma/client';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: any = new Error('Authentication required. Please log in.');
      error.status = 401;
      return next(error);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      const error: any = new Error('Authentication token missing');
      error.status = 401;
      return next(error);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    const authError: any = new Error('Invalid or expired authentication token');
    authError.status = 401;
    next(authError);
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const error: any = new Error('Authentication required');
      error.status = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error: any = new Error(
        `Access denied. Role ${req.user.role} does not have permission for this action.`
      );
      error.status = 403;
      return next(error);
    }

    next();
  };
};

