import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { sendSuccess } from './utils/api-response';

import { authRoutes } from './routes/auth.routes';
import { orderRoutes } from './routes/order.routes';
import { importRoutes } from './routes/import.routes';
import { adminRoutes } from './routes/admin.routes';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:3000', 'https://marketing-saas-frontend-alpha.vercel.app'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error Handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
