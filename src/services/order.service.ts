import { prisma } from '../config/prisma';
import { GetOrdersQuery, GetAnalyticsQuery } from '../validators/order.validator';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '../types/auth.types';

export const getOrders = async (query: GetOrdersQuery, user: JwtPayload) => {
  const {
    page,
    limit,
    search,
    warehouseCode,
    shipToState,
    sku,
    userId,
    shipToName,
    phoneNumber,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  } = query;

  const where: Prisma.OrderWhereInput = {};

  // Role-based visibility:
  // USER sees only their own orders
  // ADMIN sees all orders unless specific uploader (userId) is filtered
  if (user.role === 'USER') {
    where.userId = user.userId;
  } else if (userId) {
    if (userId === 'unassigned') {
      where.userId = null;
    } else {
      where.userId = userId;
    }
  }

  if (warehouseCode) where.warehouseCode = warehouseCode;
  if (shipToState) where.shipToState = shipToState;
  if (sku) where.sku = sku;
  if (shipToName) where.shipToName = { contains: shipToName, mode: 'insensitive' };
  if (phoneNumber) where.phoneNumber = { contains: phoneNumber, mode: 'insensitive' };

  if (fromDate || toDate) {
    where.orderPlaceDate = {};
    if (fromDate) where.orderPlaceDate.gte = new Date(fromDate);
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.orderPlaceDate.lte = endOfDay;
    }
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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

export const getOrderFilters = async (user: JwtPayload) => {
  const where: Prisma.OrderWhereInput = {};
  if (user.role === 'USER') {
    where.userId = user.userId;
  }

  const [warehouses, states, skus, allUsers, unassignedCount] = await Promise.all([
    prisma.order.findMany({
      select: { warehouseCode: true },
      distinct: ['warehouseCode'],
      where: { ...where, warehouseCode: { not: '' } },
    }),
    prisma.order.findMany({
      select: { shipToState: true },
      distinct: ['shipToState'],
      where: { ...where, shipToState: { not: '' } },
    }),
    prisma.order.findMany({
      select: { sku: true },
      distinct: ['sku'],
      where: { ...where, sku: { not: '' } },
    }),
    user.role === 'ADMIN'
      ? prisma.user.findMany({
          select: { id: true, name: true, email: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
    user.role === 'ADMIN'
      ? prisma.order.count({ where: { userId: null } })
      : Promise.resolve(0),
  ]);

  let uploadersList: Array<{ id: string; name: string; email: string }> = [];
  if (user.role === 'ADMIN') {
    uploadersList = allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    }));
    if (unassignedCount > 0) {
      uploadersList.push({
        id: 'unassigned',
        name: 'System / Legacy Data',
        email: 'unassigned',
      });
    }
  }

  return {
    warehouses: warehouses.map((w) => w.warehouseCode),
    states: states.map((s) => s.shipToState),
    skus: skus.map((s) => s.sku),
    uploaders: uploadersList,
  };
};

export const getOrderById = async (id: string, user: JwtPayload) => {
  const where: Prisma.OrderWhereInput = { id };
  if (user.role === 'USER') {
    where.userId = user.userId;
  }

  return prisma.order.findFirst({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const deleteOrder = async (id: string, user: JwtPayload) => {
  const where: Prisma.OrderWhereInput = { id };
  if (user.role === 'USER') {
    where.userId = user.userId;
  }

  const order = await prisma.order.findFirst({ where });
  if (!order) {
    const error: any = new Error('Order not found or permission denied');
    error.status = 404;
    throw error;
  }

  return prisma.order.delete({
    where: { id },
  });
};

export const getOrderAnalytics = async (query: GetAnalyticsQuery, user: JwtPayload) => {
  const { fromDate, toDate, userId } = query;
  const where: Prisma.OrderWhereInput = {};
  if (user.role === 'USER') {
    where.userId = user.userId;
  } else if (userId && userId !== 'all') {
    if (userId === 'unassigned') {
      where.userId = null;
    } else {
      where.userId = userId;
    }
  }

  if (fromDate || toDate) {
    where.orderPlaceDate = {};
    if (fromDate) where.orderPlaceDate.gte = new Date(fromDate);
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.orderPlaceDate.lte = endOfDay;
    }
  }

  // 1. Top 10 SKUs
  const topSkus = await prisma.order.groupBy({
    by: ['sku'],
    _count: { sku: true },
    where: { ...where, sku: { not: '' } },
    orderBy: {
      _count: {
        sku: 'desc',
      },
    },
    take: 10,
  });

  // 2. Top 10 States
  const topStates = await prisma.order.groupBy({
    by: ['shipToState'],
    _count: { shipToState: true },
    where: { ...where, shipToState: { not: '' } },
    orderBy: {
      _count: {
        shipToState: 'desc',
      },
    },
    take: 10,
  });

  // 3. Warehouses breakdown
  const warehouses = await prisma.order.groupBy({
    by: ['warehouseCode'],
    _count: { warehouseCode: true },
    where: { ...where, warehouseCode: { not: '' } },
    orderBy: {
      _count: {
        warehouseCode: 'desc',
      },
    },
  });

  // Check if daily or monthly grouping is best
  let isDaily = false;
  if (fromDate && toDate) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 45) {
      isDaily = true;
    }
  }

  // Dynamic conditions for SQL query
  const conditions = [Prisma.sql`"orderPlaceDate" IS NOT NULL`];
  if (user.role === 'USER') {
    conditions.push(Prisma.sql`"userId" = ${user.userId}`);
  } else if (userId && userId !== 'all') {
    if (userId === 'unassigned') {
      conditions.push(Prisma.sql`"userId" IS NULL`);
    } else {
      conditions.push(Prisma.sql`"userId" = ${userId}`);
    }
  }
  if (fromDate) {
    conditions.push(Prisma.sql`"orderPlaceDate" >= ${new Date(fromDate)}`);
  }
  if (toDate) {
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    conditions.push(Prisma.sql`"orderPlaceDate" <= ${endOfDay}`);
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  let timelineData: Array<{ month: string; raw_date: Date; count: bigint }> = [];
  if (isDaily) {
    timelineData = await prisma.$queryRaw<Array<{ month: string; raw_date: Date; count: bigint }>>`
      SELECT TO_CHAR(DATE_TRUNC('day', "orderPlaceDate"), 'DD Mon') as month,
             DATE_TRUNC('day', "orderPlaceDate") as raw_date,
             COUNT(*)::bigint as count
      FROM "Order"
      ${whereSql}
      GROUP BY DATE_TRUNC('day', "orderPlaceDate")
      ORDER BY raw_date ASC
    `;
  } else {
    timelineData = await prisma.$queryRaw<Array<{ month: string; raw_date: Date; count: bigint }>>`
      SELECT TO_CHAR(DATE_TRUNC('month', "orderPlaceDate"), 'Mon YYYY') as month,
             DATE_TRUNC('month', "orderPlaceDate") as raw_date,
             COUNT(*)::bigint as count
      FROM "Order"
      ${whereSql}
      GROUP BY DATE_TRUNC('month', "orderPlaceDate")
      ORDER BY raw_date ASC
    `;
  }

  const totalOrders = await prisma.order.count({ where });

  return {
    totalOrders,
    isDaily,
    topSkus: topSkus.map((s) => ({ sku: s.sku, count: s._count.sku })),
    topStates: topStates.map((s) => ({ state: s.shipToState.toUpperCase(), count: s._count.shipToState })),
    warehouses: warehouses.map((w) => ({ warehouse: w.warehouseCode, count: w._count.warehouseCode })),
    monthly: timelineData.map((m) => ({ month: m.month, count: Number(m.count) })),
  };
};


