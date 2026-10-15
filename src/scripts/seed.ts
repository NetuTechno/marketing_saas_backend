import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

async function seed() {
  console.log('🌱 Starting seed...');

  // Create Admin
  const adminPassword = await bcrypt.hash('adminpassword123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created/verified:', admin.email);

  // Create Regular User
  const userPassword = await bcrypt.hash('userpassword123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Demo User',
      role: 'USER',
    },
  });
  console.log('✅ Regular user created/verified:', user.email);

  console.log('🎉 Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

