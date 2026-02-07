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

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS
const parseCorsOrigins = (value?: string): string[] =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    env.FRONTEND_URL,
    ...parseCorsOrigins(env.CORS_ORIGINS),
    ...parseCorsOrigins(env.CORS_ORIGIN),
  ])
);

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Include localhost origins even if origin is undefined (local development)
    if (!origin || allowedOrigins.includes(origin) || origin?.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
});

// Error handler
app.use(errorHandler);

export default app;
