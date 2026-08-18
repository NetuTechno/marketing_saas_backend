import { prisma } from '../config/prisma';
import { GetOrdersQuery } from '../validators/order.validator';
import { Prisma } from '@prisma/client';

export const getOrders = async (query: GetOrdersQuery) => {
  const {
    page,
    limit,
    search,
    warehouseCode,
    shipToState,
    sku,
    shipToName,
    phoneNumber,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  } = query;

  const where: Prisma.OrderWhereInput = {};

  if (warehouseCode) where.warehouseCode = warehouseCode;
  if (shipToState) where.shipToState = shipToState;
  if (sku) where.sku = sku;
  if (shipToName) where.shipToName = { contains: shipToName, mode: 'insensitive' };
  if (phoneNumber) where.phoneNumber = { contains: phoneNumber, mode: 'insensitive' };

  if (fromDate || toDate) {
    where.orderPlaceDate = {};
    if (fromDate) where.orderPlaceDate.gte = new Date(fromDate);
    if (toDate) where.orderPlaceDate.lte = new Date(toDate);
  }

  if (search) {
    where.OR = [
      { orderId: { contains: search, mode: 'insensitive' } },
      { warehouseCode: { contains: search, mode: 'insensitive' } },
      { shipToName: { contains: search, mode: 'insensitive' } },
      { shipToState: { contains: search, mode: 'insensitive' } },
      { phoneNumber: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrderFilters = async () => {
  const [warehouses, states, skus] = await Promise.all([
    prisma.order.findMany({
      select: { warehouseCode: true },
      distinct: ['warehouseCode'],
      where: { warehouseCode: { not: '' } },
    }),
    prisma.order.findMany({
      select: { shipToState: true },
      distinct: ['shipToState'],
      where: { shipToState: { not: '' } },
    }),
    prisma.order.findMany({
      select: { sku: true },
      distinct: ['sku'],
      where: { sku: { not: '' } },
    }),
  ]);

  return {
    warehouses: warehouses.map((w) => w.warehouseCode),
    states: states.map((s) => s.shipToState),
    skus: skus.map((s) => s.sku),
  };
};

export const getOrderById = async (id: string) => {
  return prisma.order.findUnique({
    where: { id },
  });
};

export const deleteOrder = async (id: string) => {
  return prisma.order.delete({
    where: { id },
  });
};
