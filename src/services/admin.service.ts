import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

export const getAdminDashboardStats = async () => {
  const [totalUsers, totalOrders, users] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  // Count unassigned orders (system seed orders)
  const unassignedOrdersCount = await prisma.order.count({
    where: { userId: null },
  });

  // Calculate user distribution
  const userStats = users.map((u) => {
    const orderCount = u._count.orders;
    const sharePercentage = totalOrders > 0 ? ((orderCount / totalOrders) * 100).toFixed(1) : '0';
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      ordersCount: orderCount,
      sharePercentage: Number(sharePercentage),
    };
  });

  // Find top contributing client
  const sortedByOrders = [...userStats].sort((a, b) => b.ordersCount - a.ordersCount);
  const topClient = sortedByOrders[0] || null;

  // Active clients with > 0 orders
  const activeClientsCount = userStats.filter((u) => u.ordersCount > 0).length;

  return {
    summary: {
      totalUsers,
      totalOrders,
      activeClientsCount,
      unassignedOrdersCount,
      topClient: topClient && topClient.ordersCount > 0 ? topClient : null,
    },
    users: userStats,
  };
};

export const changeUserRole = async (targetUserId: string, newRole: Role, adminUserId: string) => {
  // Prevent admin from revoking their own admin role
  if (targetUserId === adminUserId && newRole !== 'ADMIN') {
    const error: any = new Error('You cannot remove your own admin privileges.');
    error.status = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    const error: any = new Error('User not found');
    error.status = 404;
    throw error;
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};

