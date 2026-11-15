import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import socialAuthRoutes from './routes/socialAuth';
import userRoutes from './routes/users';
import sessionRoutes from './routes/sessions';
import listenerRoutes from './routes/listeners';
import subscriptionRoutes from './routes/subscriptions';
import resourceRoutes from './routes/resources';
import wellnessRoutes from './routes/wellness';
import workshopRoutes from './routes/workshops';
import aiListenersRoutes from './routes/aiListeners';
import aiChatRoutes from './routes/aiChat';
import aiVoiceRoutes from './routes/aiVoice';
import therapistDirectoryRoutes from './routes/therapistDirectory';
import twilioVoiceRoutes from './routes/twilioVoice';
import listenerConsoleRoutes from './routes/listenerConsole';
import communityRoutes from './routes/community';
import ventLineRoutes from './routes/ventLine';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' })); // cap payloads to avoid memory-abuse
app.use(express.urlencoded({ extended: false, limit: '1mb' })); // Twilio webhooks post form-encoded bodies

// Global abuse guard. Kept generous because the app polls (chat/session
// transcripts every ~3s) and many users can share one NAT/office IP — too low a
// cap would 429 legitimate polling. Sensitive endpoints have their own tighter
// limiters (see auth routes). Health check is exempt so uptime probes never trip it.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});
app.use(limiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/auth', socialAuthRoutes); // /auth/google, /auth/facebook, /auth/otp/*
app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);
app.use('/listeners', listenerRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/resources', resourceRoutes);
app.use('/wellness', wellnessRoutes);
app.use('/workshops', workshopRoutes);
app.use('/ai-listeners', aiListenersRoutes);
app.use('/ai-chat', aiChatRoutes);
app.use('/ai-voice', aiVoiceRoutes);
app.use('/therapist-directory', therapistDirectoryRoutes);
app.use('/twilio', twilioVoiceRoutes);
app.use('/listener-console', listenerConsoleRoutes);
app.use('/community', communityRoutes);
app.use('/vent-line', ventLineRoutes);

// Unknown routes → JSON 404 (instead of Express's default HTML page).
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

app.use(errorHandler);

export default app;
