import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
      'authorization',
      '*.authorization',
      '*.access_token',
      '*.refresh_token',
      '*.apiKey',
      '*.api_key',
      '*.service_role_key',
      '*.SUPABASE_SERVICE_ROLE_KEY',
      '*.CLAUDE_API_KEY',
      '*.ANTHROPIC_API_KEY',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
