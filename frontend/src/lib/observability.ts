import * as Sentry from '@sentry/react';
import { Logtail } from '@logtail/browser';

let initialized = false;
let logtail: Logtail | null = null;

function toNumber(value: string | undefined, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function initObservability(): void {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      tracesSampleRate: toNumber(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.1),
      enabled: import.meta.env.PROD,
    });
  }

  const logtailToken = import.meta.env.VITE_LOGTAIL_SOURCE_TOKEN;
  if (logtailToken) {
    logtail = new Logtail(logtailToken);
  }

  initialized = true;
}

export function captureFrontendException(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));

  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('context', context);
      }
      Sentry.captureException(err);
    });
  }

  if (logtail) {
    void logtail.error('frontend exception', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...context,
    });
  }
}

export function captureFrontendMessage(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
): void {
  if (import.meta.env.VITE_SENTRY_DSN && level !== 'info') {
    Sentry.captureMessage(message, level === 'warn' ? 'warning' : 'error');
  }

  if (!logtail) return;

  const payload = {
    ...context,
    level,
  };

  if (level === 'error') {
    void logtail.error(message, payload);
  } else if (level === 'warn') {
    void logtail.warn(message, payload);
  } else {
    void logtail.info(message, payload);
  }
}

export async function flushFrontendObservability(): Promise<void> {
  if (!logtail) return;
  await logtail.flush();
}
