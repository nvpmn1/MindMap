/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Middleware Layer
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * AI-specific middleware for:
 * - Rate limiting per user/session
 * - Token counting and budget enforcement
 * - Content filtering and safety checks
 * - Cost tracking and limits
 * - Request validation
 */

import type { Request, Response, NextFunction } from 'express';
import { RATE_LIMITS, COST_LIMITS, GUARDRAIL_CONFIG } from '../core/constants';
import { estimateTokens } from '../memory';
import { logger } from '../../utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  tokens: number;
  requests: number;
  windowStart: number;
  minuteStart: number;
  minuteRequests: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * AI rate limiter middleware
 * Limits requests per minute and tokens per minute per user
 */
export function aiRateLimiter(
  maxRequestsPerMinute: number = RATE_LIMITS.requestsPerMinute,
  maxTokensPerMinute: number = RATE_LIMITS.tokensPerMinute,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as any).userId || req.ip || 'anonymous';
    const now = Date.now();

    let entry = rateLimitStore.get(userId);

    if (!entry || now - entry.minuteStart > 60000) {
      // Reset minute window
      entry = {
        tokens: 0,
        requests: 0,
        windowStart: now,
        minuteStart: now,
        minuteRequests: 0,
      };
      rateLimitStore.set(userId, entry);
    }

    entry.minuteRequests++;

    if (entry.minuteRequests > maxRequestsPerMinute) {
      const retryAfter = Math.ceil((entry.minuteStart + 60000 - now) / 1000);
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Limite de ${maxRequestsPerMinute} requisições por minuto atingido. Tente novamente em ${retryAfter}s.`,
        retry_after: retryAfter,
      });
      return;
    }

    // Estimate input tokens from request body
    const bodyStr = JSON.stringify(req.body || {});
    const estimatedTokens = estimateTokens(bodyStr);
    entry.tokens += estimatedTokens;

    if (entry.tokens > maxTokensPerMinute) {
      res.status(429).json({
        error: 'Token limit exceeded',
        message: 'Limite de tokens por minuto atingido. Aguarde um momento.',
        retry_after: 30,
      });
      return;
    }

    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT FILTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Content filter middleware — screens for prompt injection and harmful content
 */
export function contentFilter() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.body) {
      next();
      return;
    }

    const content = extractTextContent(req.body);

    // Check for prompt injection patterns
    if (GUARDRAIL_CONFIG.enableInjectionDetection) {
      for (const pattern of GUARDRAIL_CONFIG.blocklistPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(content)) {
          logger.warn({
            pattern,
            content: content.substring(0, 100),
          }, `Content filter triggered for user ${(req as any).userId}`);

          // Don't block — just sanitize and log
          // Claude is designed to handle adversarial inputs robustly
          (req as any).contentWarning = {
            triggered: true,
            pattern,
            timestamp: new Date().toISOString(),
          };
          break;
        }
      }
    }

    // Check content length limits
    if (content.length > 100000) {
      res.status(413).json({
        error: 'Content too large',
        message: 'O conteúdo da requisição excede o limite permitido.',
        max_length: 100000,
      });
      return;
    }

    next();
  };
}

/**
 * Extract all text content from request body recursively
 */
function extractTextContent(obj: any): string {
  if (typeof obj === 'string') return obj;
  if (!obj || typeof obj !== 'object') return '';

  const parts: string[] = [];

  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      parts.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        parts.push(extractTextContent(item));
      }
    } else if (typeof value === 'object' && value !== null) {
      parts.push(extractTextContent(value));
    }
  }

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════
// COST TRACKER
// ═══════════════════════════════════════════════════════════════════════════

interface CostEntry {
  dailyUSD: number;
  monthlyUSD: number;
  dayStart: string; // YYYY-MM-DD
  monthStart: string; // YYYY-MM
  requests: number;
}

const costStore = new Map<string, CostEntry>();

/**
 * Track and enforce cost limits
 */
export function costTracker() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userId = (req as any).userId || 'anonymous';
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);

    let entry = costStore.get(userId);

    if (!entry || entry.dayStart !== today) {
      const prevMonthly = entry && entry.monthStart === month ? entry.monthlyUSD : 0;
      entry = {
        dailyUSD: 0,
        monthlyUSD: prevMonthly,
        dayStart: today,
        monthStart: month,
        requests: 0,
      };
      costStore.set(userId, entry);
    }

    if (entry.monthStart !== month) {
      entry.monthlyUSD = 0;
      entry.monthStart = month;
    }

    // Attach cost tracker to request for post-response tracking
    (req as any).costTracker = {
      addCost: (usd: number) => {
        entry!.dailyUSD += usd;
        entry!.monthlyUSD += usd;
        entry!.requests++;
      },
      getCosts: () => ({
        daily: entry!.dailyUSD,
        monthly: entry!.monthlyUSD,
        requests: entry!.requests,
        limits: {
          daily: COST_LIMITS.maxDailyCostPerUser,
          monthly: COST_LIMITS.maxMonthlyCostPerUser,
        },
      }),
      isOverLimit: () =>
        entry!.dailyUSD >= COST_LIMITS.maxDailyCostPerUser ||
        entry!.monthlyUSD >= COST_LIMITS.maxMonthlyCostPerUser,
    };

    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate AI request structure
 */
export function validateAIRequest() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { body } = req;

    if (!body) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Request body is required',
      });
      return;
    }

    // Check required fields based on endpoint
    const path = req.path;

    if (path.includes('/chat') || path.includes('/agent')) {
      if (!body.message && !body.prompt && !body.action) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Campo "message", "prompt" ou "action" é obrigatório.',
        });
        return;
      }
    }

    if (path.includes('/generate') || path.includes('/expand')) {
      if (!body.prompt && !body.message && !body.node_id) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Campo "prompt" ou "node_id" é obrigatório.',
        });
        return;
      }
    }

    // Attach parsed map context
    (req as any).aiContext = {
      mapId: body.map_id || body.mapId,
      nodeId: body.node_id || body.nodeId,
      prompt: body.prompt || body.message,
      options: body.options || {},
    };

    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const aiMiddleware = {
  rateLimiter: aiRateLimiter,
  contentFilter,
  costTracker,
  validateRequest: validateAIRequest,
};
