import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { importOrders } from '../controllers/import.controller';

const router = Router();

router.post('/orders', upload.array('files'), importOrders);

export const importRoutes = router;
