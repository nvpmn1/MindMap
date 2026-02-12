import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { env } from '../utils/env';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  };

  res.json(healthcheck);
});

/**
 * GET /health/detailed
 * Detailed health check with service status
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Check Supabase connection
  const supabaseStart = Date.now();
  try {
    const { error } = await supabaseAdmin.from('workspaces').select('id').limit(1);
    if (error) {throw error;}
    checks.supabase = {
      status: 'healthy',
      latency: Date.now() - supabaseStart,
    };
  } catch (error) {
    const errorDetails =
      error && typeof error === 'object'
        ? JSON.stringify(
            {
              message: (error as { message?: string }).message,
              details: (error as { details?: string }).details,
              hint: (error as { hint?: string }).hint,
              code: (error as { code?: string }).code,
            },
            null,
            2
          )
        : undefined;

    checks.supabase = {
      status: 'unhealthy',
      latency: Date.now() - supabaseStart,
      error: error instanceof Error
        ? error.message
        : errorDetails && errorDetails !== '{}'
          ? errorDetails
          : 'Unknown error',
    };
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const memoryMB = {
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
  };

  // Overall status
  const isHealthy = Object.values(checks).every(c => c.status === 'healthy');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks,
    memory: memoryMB,
  });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Quick Supabase check
    const { error } = await supabaseAdmin.from('workspaces').select('id').limit(1);
    if (error) {throw error;}

    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

export default router;
