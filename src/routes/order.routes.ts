import { Router } from 'express';
import {
  listOrders,
  listOrderFilters,
  getOrder,
  removeOrder,
} from '../controllers/order.controller';

const router = Router();

router.get('/filters', listOrderFilters); // MUST be before /:id
router.get('/', listOrders);
router.get('/:id', getOrder);
router.delete('/:id', removeOrder);

export const orderRoutes = router;
