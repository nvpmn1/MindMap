import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../utils/env';
import { captureException } from '../observability';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    stack?: string;
  };
}

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 internal server error
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let isOperational = false;

  // Handle our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Handle Supabase errors
  if ('code' in err && typeof (err as any).code === 'string') {
    const supabaseCode = (err as any).code;

    switch (supabaseCode) {
      case 'PGRST116': // Not found
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'Resource not found';
        isOperational = true;
        break;
      case '23505': // Unique violation
        statusCode = 409;
        code = 'CONFLICT';
        message = 'Resource already exists';
        isOperational = true;
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Referenced resource does not exist';
        isOperational = true;
        break;
      case '42501': // Insufficient privilege (RLS)
        statusCode = 403;
        code = 'FORBIDDEN';
        message = 'Access denied';
        isOperational = true;
        break;
    }
  }

  // Handle validation errors from Zod
  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
    isOperational = true;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'PARSE_ERROR';
    message = 'Invalid JSON in request body';
    isOperational = true;
  }

  // Log error
  const logData = {
    statusCode,
    code,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    isOperational,
  };

  if (isOperational) {
    logger.warn(logData, 'Operational error');
  } else {
    logger.error(logData, 'Unexpected error');
  }

  if (!isOperational || statusCode >= 500) {
    captureException(err, {
      statusCode,
      code,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      requestId: req.headers['x-request-id'],
    });
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode,
    },
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  };

  res.status(404).json(response);
};

/**
 * Async handler wrapper to catch errors in async routes
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
