import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Claude
  CLAUDE_API_KEY: z.string().min(1),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-20250514'),
  CLAUDE_MAX_TOKENS: z.string().default('4096').transform(Number),
  CLAUDE_TEMPERATURE: z.string().default('0.7').transform(Number),
  
  // CORS
  FRONTEND_URL: z.string().url(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  AI_RATE_LIMIT_MAX: z.string().default('10').transform(Number),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
