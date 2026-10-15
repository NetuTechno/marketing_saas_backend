import { z } from 'zod';

export const getOrdersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  warehouseCode: z.string().optional(),
  shipToState: z.string().optional(),
  sku: z.string().optional(),
  userId: z.string().optional(),
  shipToName: z.string().optional(),
  phoneNumber: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['orderId', 'warehouseCode', 'shipToName', 'shipToState', 'sku', 'orderPlaceDate', 'createdAt']).default('orderPlaceDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;

export const getAnalyticsQuerySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  userId: z.string().optional(),
});

export type GetAnalyticsQuery = z.infer<typeof getAnalyticsQuerySchema>;


