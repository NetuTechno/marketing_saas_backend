import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { importOrders } from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/orders', authenticate, upload.array('files'), importOrders);

export const importRoutes = router;
