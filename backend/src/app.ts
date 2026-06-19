import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import sessionRoutes from './routes/sessions';
import listenerRoutes from './routes/listeners';
import subscriptionRoutes from './routes/subscriptions';
import resourceRoutes from './routes/resources';
import wellnessRoutes from './routes/wellness';
import workshopRoutes from './routes/workshops';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);
app.use('/listeners', listenerRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/resources', resourceRoutes);
app.use('/wellness', wellnessRoutes);
app.use('/workshops', workshopRoutes);

app.use(errorHandler);

export default app;
