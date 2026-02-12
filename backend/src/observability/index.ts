import * as Sentry from '@sentry/node';
import { Logtail } from '@logtail/node';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

let sentryInitialized = false;
let logtailClient: Logtail | null = null;

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error while flushing observability providers';
}

export function initializeObservability(): void {
  if (env.SENTRY_DSN && !sentryInitialized) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
      tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
      enabled: env.NODE_ENV !== 'test',
    });
    sentryInitialized = true;
    logger.info({ environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV }, 'Sentry initialized');
  }

  if (env.LOGTAIL_SOURCE_TOKEN && !logtailClient) {
    logtailClient = new Logtail(env.LOGTAIL_SOURCE_TOKEN);
    logger.info('Logtail initialized');
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (sentryInitialized) {
    Sentry.withScope((scope) => {
      scope.setTag('service', env.OBSERVABILITY_SERVICE_NAME);
      if (context) {
        scope.setContext('context', context);
      }
      Sentry.captureException(error);
    });
  }

  if (logtailClient) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logtailClient.error(`${env.OBSERVABILITY_SERVICE_NAME}: unhandled exception`, {
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack,
      ...context,
    });
  }
}

export function captureMessage(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
): void {
  if (sentryInitialized && level !== 'info') {
    Sentry.withScope((scope) => {
      scope.setTag('service', env.OBSERVABILITY_SERVICE_NAME);
      if (context) {
        scope.setContext('context', context);
      }
      Sentry.captureMessage(message, level === 'warn' ? 'warning' : 'error');
    });
  }

  if (logtailClient) {
    const payload = {
      service: env.OBSERVABILITY_SERVICE_NAME,
      ...context,
    };

    if (level === 'error') {
      void logtailClient.error(message, payload);
    } else if (level === 'warn') {
      void logtailClient.warn(message, payload);
    } else {
      void logtailClient.info(message, payload);
    }
  }
}

export async function flushObservability(timeoutMs: number = 2000): Promise<void> {
  try {
    if (sentryInitialized) {
      await Sentry.flush(timeoutMs);
    }

    if (logtailClient) {
      await logtailClient.flush();
    }
  } catch (error) {
    if (isObjectLike(error)) {
      logger.warn({ error }, 'Failed to flush observability providers');
    } else {
      logger.warn({ error: errorToMessage(error) }, 'Failed to flush observability providers');
    }
  }
}
