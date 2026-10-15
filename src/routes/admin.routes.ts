import { Router } from 'express';
import { getAdminDashboard, updateUserRole } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Strictly protect all admin routes: must be authenticated and have ADMIN role
router.use(authenticate, requireRole(['ADMIN']));

router.get('/dashboard', getAdminDashboard);
router.patch('/users/:id/role', updateUserRole);

export const adminRoutes = router;

