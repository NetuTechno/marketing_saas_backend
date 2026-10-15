import { Request, Response, NextFunction } from 'express';
import {
  getOrders,
  getOrderFilters,
  getOrderById,
  deleteOrder,
  getOrderAnalytics,
} from '../services/order.service';
import { getOrdersQuerySchema, getAnalyticsQuerySchema } from '../validators/order.validator';
import { sendSuccess } from '../utils/api-response';
import { Prisma } from '@prisma/client';

export const listOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = getOrdersQuerySchema.parse(req.query);
    const result = await getOrders(query, req.user!);
    res.status(200).json(sendSuccess('Orders fetched successfully', result));
  } catch (error) {
    next(error);
  }
};

export const listOrderFilters = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = await getOrderFilters(req.user!);
    res.status(200).json(sendSuccess('Filters fetched successfully', filters));
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const order = await getOrderById(id, req.user!);

    if (!order) {
      const error: any = new Error('Order not found');
      error.status = 404;
      throw error;
    }

    res.status(200).json(sendSuccess('Order fetched successfully', order));
  } catch (error) {
    next(error);
  }
};

export const removeOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    await deleteOrder(id, req.user!);
    res.status(200).json(sendSuccess('Order deleted successfully'));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      const notFoundError: any = new Error('Order not found');
      notFoundError.status = 404;
      return next(notFoundError);
    }
    next(error);
  }
};

export const listOrderAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = getAnalyticsQuerySchema.parse(req.query);
    const analytics = await getOrderAnalytics(query, req.user!);
    res.status(200).json(sendSuccess('Analytics fetched successfully', analytics));
  } catch (error) {
    next(error);
  }
};


