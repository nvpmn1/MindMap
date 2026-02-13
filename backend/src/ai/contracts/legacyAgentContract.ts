import { z } from 'zod';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function coerceString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (isPlainObject(item)) {
          const text = coerceString(item.text);
          if (text.length > 0) {
            return text;
          }

          const content = coerceString(item.content);
          if (content.length > 0) {
            return content;
          }
        }

        return safeStringify(item);
      })
      .filter((item) => item.length > 0)
      .join(' ')
      .trim();
  }

  if (isPlainObject(value)) {
    const text = coerceString(value.text);
    if (text.length > 0) {
      return text;
    }

    const content = coerceString(value.content);
    if (content.length > 0) {
      return content;
    }
  }

  return safeStringify(value);
}

function normalizeContentBlock(block: unknown): Record<string, unknown> | null {
  if (typeof block === 'string') {
    const text = block.trim();
    return text.length > 0 ? { type: 'text', text } : null;
  }

  if (!isPlainObject(block)) {
    const serialized = coerceString(block);
    return serialized.length > 0 ? { type: 'text', text: serialized } : null;
  }

  const normalized: Record<string, unknown> = { ...block };

  if (typeof normalized.type !== 'string') {
    normalized.type = typeof normalized.tool_use_id === 'string' ? 'tool_result' : 'text';
  }

  if (normalized.type === 'text') {
    const text = coerceString(normalized.text ?? normalized.content);
    if (text.length === 0) {
      return null;
    }

    normalized.text = text;
    delete normalized.content;
  }

  if (normalized.type === 'tool_result') {
    const resultContent = coerceString(normalized.content ?? normalized.text);
    normalized.content =
      resultContent.length > 0 ? resultContent : '{"success":false,"error":"empty_tool_result"}';
    delete normalized.text;
  }

  if (normalized.type === 'tool_use') {
    if (typeof normalized.name !== 'string') {
      normalized.name = coerceString(normalized.name);
    }

    if (typeof normalized.id !== 'string') {
      normalized.id = coerceString(normalized.id);
    }

    if (!isPlainObject(normalized.input)) {
      normalized.input = {};
    }
  }

  return normalized;
}

function normalizeMessageContent(value: unknown): string | Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    const blocks = value
      .map((block) => normalizeContentBlock(block))
      .filter((block): block is Record<string, unknown> => block !== null);

    if (blocks.length > 0) {
      return blocks;
    }
  }

  if (isPlainObject(value)) {
    const normalized = normalizeContentBlock(value);
    if (normalized) {
      return [normalized];
    }
  }

  return coerceString(value);
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return undefined;
}

const legacyAgentContentSchema = z.preprocess(
  (value) => normalizeMessageContent(value),
  z.union([
    z.string().min(1, 'Message content cannot be empty'),
    z.array(z.record(z.unknown())).min(1, 'Message content cannot be empty'),
  ])
);

export const legacyAgentMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: legacyAgentContentSchema,
});

export const legacyAgentToolSchema = z.object({
  name: z.preprocess((value) => coerceString(value), z.string().min(1, 'Tool name required')),
  description: z.preprocess(
    (value) => coerceString(value),
    z.string().min(1, 'Tool description required')
  ),
  input_schema: z.preprocess((value) => (isPlainObject(value) ? value : {}), z.record(z.unknown())),
});

export const legacyAgentSchema = z.object({
  map_id: z.preprocess((value) => coerceString(value), z.string().uuid('Invalid map ID')),
  agent_type: z
    .preprocess((value) => {
      const normalized = coerceString(value);
      return normalized.length > 0 ? normalized : undefined;
    }, z.string())
    .optional(),
  model: z
    .preprocess((value) => {
      const normalized = coerceString(value);
      return normalized.length > 0 ? normalized : undefined;
    }, z.string())
    .optional(),
  mode: z
    .preprocess((value) => {
      const normalized = coerceString(value);
      return normalized.length > 0 ? normalized : 'agent';
    }, z.string())
    .optional()
    .default('agent'),
  systemPrompt: z.preprocess(
    (value) => coerceString(value),
    z.string().min(1, 'systemPrompt is required')
  ),
  messages: z.preprocess(
    (value): unknown[] => (Array.isArray(value) ? value : []),
    z.array(legacyAgentMessageSchema).min(1, 'At least one message is required')
  ),
  tools: z.preprocess(
    (value): unknown[] => (Array.isArray(value) ? value : []),
    z.array(legacyAgentToolSchema).default([])
  ),
  maxTokens: z
    .preprocess((value) => coerceNumber(value), z.number().int().min(256).max(8192))
    .optional()
    .default(4096),
  temperature: z
    .preprocess((value) => coerceNumber(value), z.number().min(0).max(1))
    .optional()
    .default(0.7),
  force_tool_use: z
    .preprocess((value) => coerceBoolean(value), z.boolean())
    .optional()
    .default(false),
  require_action: z
    .preprocess((value) => coerceBoolean(value), z.boolean())
    .optional()
    .default(false),
  require_mutating_action: z
    .preprocess((value) => coerceBoolean(value), z.boolean())
    .optional()
    .default(false),
  disable_parallel_tool_use: z
    .preprocess((value) => coerceBoolean(value), z.boolean())
    .optional()
    .default(true),
});

export type LegacyAgentMessagePayload = z.infer<typeof legacyAgentMessageSchema>;
export type LegacyAgentToolPayload = z.infer<typeof legacyAgentToolSchema>;
export type LegacyAgentRequestPayload = z.infer<typeof legacyAgentSchema>;

export function extractTextFromLegacyMessageContent(
  content: LegacyAgentMessagePayload['content'] | undefined
): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  const textParts: string[] = [];

  for (const block of content) {
    if (!isPlainObject(block)) {
      continue;
    }

    const text = coerceString(block.text);
    if (text.length > 0) {
      textParts.push(text);
      continue;
    }

    const blockContent = coerceString(block.content);
    if (blockContent.length > 0) {
      textParts.push(blockContent);
    }
  }

  return textParts.join(' ').trim();
}
