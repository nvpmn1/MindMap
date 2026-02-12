import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOW_PROFILE_AUTH: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  DEFAULT_WORKSPACE_ID: z.string().uuid().default('11111111-1111-1111-1111-111111111111'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Claude
  CLAUDE_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  CLAUDE_MODEL: z.string().default('claude-haiku-4-5'),
  CLAUDE_MAX_TOKENS: z.string().default('4096').transform(Number),
  CLAUDE_TEMPERATURE: z.string().default('0.7').transform(Number),
  CLAUDE_MODEL_STRATEGY: z
    .enum(['cheap', 'balanced', 'quality', 'haiku-only'])
    .default('haiku-only'),

  // CORS
  FRONTEND_URL: z.string().url(),
  CORS_ORIGINS: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  AI_RATE_LIMIT_MAX: z.string().default('10').transform(Number),

  // Observability
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().default('0.1').transform(Number),
  LOGTAIL_SOURCE_TOKEN: z.string().min(1).optional(),
  OBSERVABILITY_SERVICE_NAME: z.string().default('mindmap-hub-api'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const claudeApiKey = parsed.data.CLAUDE_API_KEY || parsed.data.ANTHROPIC_API_KEY;

if (!claudeApiKey) {
  console.error('❌ Missing CLAUDE_API_KEY (or legacy ANTHROPIC_API_KEY).');
  process.exit(1);
}

// Allow profile-based auth only when explicitly enabled
const allowProfileAuth = parsed.data.ALLOW_PROFILE_AUTH;

if (parsed.data.NODE_ENV === 'production' && allowProfileAuth) {
  console.warn('⚠️ ALLOW_PROFILE_AUTH is enabled in production. Ensure you trust all clients.');
}

export const env = {
  ...parsed.data,
  CLAUDE_API_KEY: claudeApiKey,
  ALLOW_PROFILE_AUTH: allowProfileAuth,
};
