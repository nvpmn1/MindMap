import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { captureMessage } from '../observability';

/**
 * Request logging middleware using Pino
 * Logs incoming requests and outgoing responses with timing
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  const requestPath = req.originalUrl || req.path;
  const startTime = process.hrtime.bigint();

  logger.info(
    {
      type: 'request',
      requestId,
      method: req.method,
      path: requestPath,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress,
      userId: req.user?.id,
    },
    `-> ${req.method} ${requestPath}`
  );

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    res.locals.responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    const logData = {
      type: 'response',
      requestId,
      method: req.method,
      path: requestPath,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?.id,
      contentLength: res.get('content-length'),
    };

    if (res.statusCode >= 500) {
      logger.error(logData, `<- ${req.method} ${requestPath} ${res.statusCode}`);
      captureMessage('error', 'HTTP 5xx response', {
        requestId,
        method: req.method,
        path: requestPath,
        statusCode: res.statusCode,
        durationMs: logData.durationMs,
        userId: req.user?.id,
      });
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `<- ${req.method} ${requestPath} ${res.statusCode}`);
    } else {
      logger.info(logData, `<- ${req.method} ${requestPath} ${res.statusCode}`);
    }
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      logger.warn(
        {
          type: 'response_aborted',
          requestId,
          method: req.method,
          path: requestPath,
          durationMs: Math.round(durationMs * 100) / 100,
          userId: req.user?.id,
        },
        `x ${req.method} ${requestPath} aborted`
      );
    }
  });

  next();
};

/**
 * Middleware to skip logging for certain paths
 */
export const skipPaths = (paths: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (paths.some((p) => req.path.startsWith(p))) {
      return next();
    }
    requestLogger(req, res, next);
  };
};
