import { Router } from 'express';
import {
  listOrders,
  listOrderFilters,
  listOrderAnalytics,
  getOrder,
  removeOrder,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All order endpoints require authentication
router.use(authenticate);

router.get('/filters', listOrderFilters); // MUST be before /:id
router.get('/analytics', listOrderAnalytics); // MUST be before /:id
router.get('/', listOrders);
router.get('/:id', getOrder);
router.delete('/:id', removeOrder);

export const orderRoutes = router;
