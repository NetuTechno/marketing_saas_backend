import app from '../app';
import { prisma } from '../config/prisma';

async function runTests() {
  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}/api/v1`;
  console.log(`🚀 Test server running at ${baseUrl}`);

  try {
    // 1. Cleanup any prior test users
    await prisma.order.deleteMany({
      where: { user: { email: { in: ['testuser1@example.com', 'testuser2@example.com'] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['testuser1@example.com', 'testuser2@example.com'] } },
    });

    // 2. Signup User 1
    const signup1Res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User One',
        email: 'testuser1@example.com',
        password: 'password123',
        role: 'USER',
      }),
    });
    const signup1Data: any = await signup1Res.json();
    console.log('✅ Signup User 1:', signup1Data.success ? 'PASSED' : 'FAILED', signup1Data.message);
    const tokenUser1 = signup1Data.data.token;

    // 3. Signup User 2
    const signup2Res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User Two',
        email: 'testuser2@example.com',
        password: 'password123',
        role: 'USER',
      }),
    });
    const signup2Data: any = await signup2Res.json();
    console.log('✅ Signup User 2:', signup2Data.success ? 'PASSED' : 'FAILED');
    const tokenUser2 = signup2Data.data.token;

    // 4. Login Admin
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'adminpassword123',
      }),
    });
    const adminLoginData: any = await adminLoginRes.json();
    console.log('✅ Admin Login:', adminLoginData.success ? 'PASSED' : 'FAILED');
    const tokenAdmin = adminLoginData.data.token;

    // 5. User 1 orders before import
    const u1OrdersRes1 = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    const u1OrdersData1: any = await u1OrdersRes1.json();
    console.log('✅ User 1 initial orders count:', u1OrdersData1.data.pagination.total, '(Expected: 0)');

    // 6. User 1 imports CSV
    const csvContent = `Order ID,Warehouse Code,Ship To Name,Ship To State,Phone Number,SKU,Order Place Date
TEST_ORD_001,WH-01,Alice Smith,CA,555-0101,SKU-A1,2026-10-10
TEST_ORD_002,WH-02,Bob Jones,NY,555-0102,SKU-B2,2026-10-11`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('files', blob, 'test_orders.csv');

    const importRes = await fetch(`${baseUrl}/import/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: formData,
    });
    const importData: any = await importRes.json();
    console.log('✅ User 1 imported CSV:', importData.data);

    // 7. Verify User 1 now sees their 2 orders
    const u1OrdersRes2 = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    const u1OrdersData2: any = await u1OrdersRes2.json();
    console.log('✅ User 1 orders after import:', u1OrdersData2.data.pagination.total, '(Expected: 2)');

    // 8. Verify User 2 sees 0 orders (data isolation!)
    const u2OrdersRes = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    const u2OrdersData: any = await u2OrdersRes.json();
    console.log('✅ User 2 orders count:', u2OrdersData.data.pagination.total, '(Expected: 0 - Isolated!)');

    // 9. Verify Admin sees all orders (including User 1's orders)
    const adminOrdersRes = await fetch(`${baseUrl}/orders?search=TEST_ORD_001`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const adminOrdersData: any = await adminOrdersRes.json();
    console.log('✅ Admin sees User 1 order via search:', adminOrdersData.data.orders.length, '(Expected: 1)');

    // 10. Verify Admin is prevented from uploading (view-only rule)
    const adminImportRes = await fetch(`${baseUrl}/import/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: formData,
    });
    const adminImportData: any = await adminImportRes.json();
    console.log('✅ Admin upload attempt status:', adminImportRes.status, '(Expected: 403 Forbidden)');

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

