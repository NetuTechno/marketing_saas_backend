import { Request, Response, NextFunction } from 'express';
import { getAdminDashboardStats, changeUserRole } from '../services/admin.service';
import { sendSuccess } from '../utils/api-response';
import { Role } from '@prisma/client';

export const getAdminDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getAdminDashboardStats();
    res.status(200).json(sendSuccess('Admin dashboard stats fetched successfully', data));
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(Role).includes(role)) {
      const error: any = new Error('Invalid role specified. Must be ADMIN or USER.');
      error.status = 400;
      throw error;
    }

    const updated = await changeUserRole(id as string, role as Role, req.user!.userId);
    res.status(200).json(sendSuccess(`User role updated to ${role} successfully`, updated));
  } catch (error) {
    next(error);
  }
};

