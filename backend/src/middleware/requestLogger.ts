import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

/**
 * Request logging middleware using Pino
 * Logs incoming requests and outgoing responses with timing
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  // Record start time
  const startTime = process.hrtime.bigint();

  // Log incoming request
  logger.info({
    type: 'request',
    requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.socket.remoteAddress,
    userId: req.user?.id,
  }, `→ ${req.method} ${req.path}`);

  // Override res.json to capture response body size
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    res.locals.responseBody = body;
    return originalJson(body);
  };

  // Log response when finished
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    const logData = {
      type: 'response',
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?.id,
      contentLength: res.get('content-length'),
    };

    // Choose log level based on status code
    if (res.statusCode >= 500) {
      logger.error(logData, `← ${req.method} ${req.path} ${res.statusCode}`);
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `← ${req.method} ${req.path} ${res.statusCode}`);
    } else {
      logger.info(logData, `← ${req.method} ${req.path} ${res.statusCode}`);
    }
  });

  // Log if response is aborted
  res.on('close', () => {
    if (!res.writableEnded) {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      logger.warn({
        type: 'response_aborted',
        requestId,
        method: req.method,
        path: req.path,
        durationMs: Math.round(durationMs * 100) / 100,
        userId: req.user?.id,
      }, `✕ ${req.method} ${req.path} aborted`);
    }
  });

  next();
};

/**
 * Middleware to skip logging for certain paths
 */
export const skipPaths = (paths: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (paths.some(p => req.path.startsWith(p))) {
      return next();
    }
    requestLogger(req, res, next);
  };
};
