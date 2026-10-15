import { prisma } from './src/config/prisma';

async function main() {
  const dates = await prisma.$queryRaw<Array<{ d: string, cnt: bigint }>>`
    SELECT TO_CHAR("orderPlaceDate", 'YYYY-MM-DD') as d, COUNT(*)::bigint as cnt
    FROM "Order"
    WHERE "userId" = 'e9915d4c-0bc4-4d9d-84f2-1f12417036c9'
    GROUP BY TO_CHAR("orderPlaceDate", 'YYYY-MM-DD')
    ORDER BY d DESC
    LIMIT 20
  `;
  console.log('Toplot orders by orderPlaceDate:', dates);
}

main().catch(console.error).finally(() => prisma.$disconnect());

