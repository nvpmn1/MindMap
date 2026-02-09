import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import { env } from './utils/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import mapsRoutes from './routes/maps';
import nodesRoutes from './routes/nodes';
import tasksRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import resetRoutes from './routes/reset';
import setupRoutes from './routes/setup';
import adminRoutes from './routes/admin';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS - Must be FIRST!
const parseCorsOrigins = (value?: string): string[] =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    ...parseCorsOrigins(env.CORS_ORIGINS),
    ...parseCorsOrigins(env.CORS_ORIGIN),
  ])
);

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // In production, allow configured origins + all Vercel preview URLs
    if (env.NODE_ENV === 'production') {
      const isVercelPreview = origin?.includes('.vercel.app');
      const isAllowed = !origin || isVercelPreview || allowedOrigins.includes(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn({ origin }, '[CORS] Blocked request from disallowed origin');
        callback(new Error('Not allowed by CORS policy'));
      }
    } else {
      // In development, also allow localhost and Vercel
      const isVercelPreview = origin?.includes('.vercel.app');
      const isAllowed =
        !origin ||
        isVercelPreview ||
        allowedOrigins.includes(origin) ||
        origin?.includes('localhost') ||
        origin?.includes('127.0.0.1');

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn({ origin }, '[CORS] Request from disallowed origin');
        callback(new Error('Not allowed by CORS policy'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Accept-Language',
    'Accept-Encoding',
    // Custom profile headers for client-side auth fallback
    'x-profile-id',
    'x-profile-email',
    'x-profile-name',
    'x-profile-color',
  ],
  exposedHeaders: ['Content-Length', 'Content-Range', 'X-Total-Count'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Body parsing BEFORE routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting (after logging, before routes)
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limit for health checks
    return req.path === '/health' || req.path.startsWith('/health/');
  },
});
app.use(limiter);

// Routes
app.use('/health', healthRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    name: 'MindMap Hub API',
    version: '1.0.0',
    status: 'ok',
    environment: env.NODE_ENV,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// Error handler
app.use(errorHandler);

export default app;
