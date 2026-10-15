import { prisma } from '../config/prisma';

async function main() {
  const email = process.argv[2];
  const role = (process.argv[3] || 'ADMIN').toUpperCase();

  if (!email) {
    console.log('Usage: npx tsx src/scripts/set-role.ts <email> [ADMIN|USER]');
    process.exit(1);
  }

  if (role !== 'ADMIN' && role !== 'USER') {
    console.log('Role must be either ADMIN or USER');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.log(`❌ User with email "${email}" not found.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { role: role as any },
  });

  console.log(`✅ Successfully updated ${updated.email} role to: ${updated.role}`);
}

main()
  .catch((e) => {
    console.error('Error updating role:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

