import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { sendSuccess } from './utils/api-response';

import { orderRoutes } from './routes/order.routes';
import { importRoutes } from './routes/import.routes';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json(sendSuccess('Marketing SaaS API is running'));
});

// Routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/import', importRoutes);

// Error Handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
