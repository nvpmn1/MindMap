/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Advanced Model Selection Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Multi-factor model selection based on:
 * - Task complexity analysis (keyword, context, agent type)
 * - Cost optimization (cheapest model that can handle the task)
 * - Context window requirements
 * - Feature requirements (vision, tools, thinking)
 * - Historical performance data
 */

import { logger } from '../../utils/logger';
import { env } from '../../utils/env';
import {
  MODEL_REGISTRY,
  DEFAULT_MODEL_BY_TIER,
  COMPLEXITY_KEYWORDS,
  AGENT_COMPLEXITY_BASE,
  TOKEN_ESTIMATION,
} from './constants';
import type {
  ModelConfig,
  ModelId,
  ModelTier,
  ModelSelection,
  ComplexityAnalysis,
  ComplexityFactor,
  ComplexityLevel,
  AgentType,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// COMPLEXITY ANALYZER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Multi-factor complexity analysis engine.
 * Analyzes task complexity from 0-100 across multiple dimensions.
 */
export function analyzeComplexity(
  agentType: AgentType,
  input: Record<string, any>,
  contextLength: number = 0,
): ComplexityAnalysis {
  const factors: ComplexityFactor[] = [];
  let totalScore = 0;

  // Factor 1: Agent type base complexity (weight: 30%)
  const agentBase = AGENT_COMPLEXITY_BASE[agentType] || 30;
  factors.push({
    name: 'agent_type',
    weight: 0.30,
    value: agentBase,
    description: `Agent "${agentType}" base complexity`,
  });
  totalScore += agentBase * 0.30;

  // Factor 2: Context length complexity (weight: 20%)
  let contextScore = 0;
  if (contextLength > 50000) contextScore = 90;
  else if (contextLength > 20000) contextScore = 70;
  else if (contextLength > 10000) contextScore = 50;
  else if (contextLength > 5000) contextScore = 35;
  else if (contextLength > 1000) contextScore = 20;
  else contextScore = 10;

  factors.push({
    name: 'context_length',
    weight: 0.20,
    value: contextScore,
    description: `Context of ${contextLength} chars`,
  });
  totalScore += contextScore * 0.20;

  // Factor 3: Keyword complexity analysis (weight: 25%)
  const inputStr = JSON.stringify(input).toLowerCase();
  let keywordScore = 30; // baseline

  for (const [level, config] of Object.entries(COMPLEXITY_KEYWORDS)) {
    for (const word of config.words) {
      if (inputStr.includes(word)) {
        keywordScore = Math.max(0, Math.min(100, keywordScore + config.weight));
      }
    }
  }

  factors.push({
    name: 'keyword_analysis',
    weight: 0.25,
    value: keywordScore,
    description: `Content keyword analysis`,
  });
  totalScore += keywordScore * 0.25;

  // Factor 4: Structural complexity (weight: 15%)
  let structuralScore = 20;
  const nodeCount = input.nodes?.length || input.existing_nodes?.length || 0;
  if (nodeCount > 30) structuralScore = 80;
  else if (nodeCount > 15) structuralScore = 60;
  else if (nodeCount > 5) structuralScore = 40;

  // Multiple tool requirements increase complexity
  const toolReqs = input.tools?.length || 0;
  if (toolReqs > 3) structuralScore += 15;

  factors.push({
    name: 'structural',
    weight: 0.15,
    value: Math.min(100, structuralScore),
    description: `${nodeCount} nodes, ${toolReqs} tools`,
  });
  totalScore += Math.min(100, structuralScore) * 0.15;

  // Factor 5: Output requirements (weight: 10%)
  let outputScore = 30;
  const depth = input.depth || input.options?.depth || 1;
  const count = input.count || input.options?.count || 5;
  if (depth > 2) outputScore += 20;
  if (count > 10) outputScore += 20;
  if (input.include_subtasks || input.estimate_priority) outputScore += 10;

  factors.push({
    name: 'output_requirements',
    weight: 0.10,
    value: Math.min(100, outputScore),
    description: `Depth: ${depth}, Count: ${count}`,
  });
  totalScore += Math.min(100, outputScore) * 0.10;

  // Determine level from total score
  const score = Math.round(Math.min(100, Math.max(0, totalScore)));
  let level: ComplexityLevel;
  let reasoning: string;

  if (score <= 15) {
    level = 'trivial';
    reasoning = 'Tarefa trivial — resposta direta e imediata';
  } else if (score <= 30) {
    level = 'simple';
    reasoning = 'Tarefa simples — processamento básico sem raciocínio profundo';
  } else if (score <= 50) {
    level = 'moderate';
    reasoning = 'Tarefa moderada — requer análise e criatividade balanceadas';
  } else if (score <= 75) {
    level = 'complex';
    reasoning = 'Tarefa complexa — análise profunda com múltiplas dimensões';
  } else {
    level = 'expert';
    reasoning = 'Tarefa expert — raciocínio avançado, múltiplos fatores, alta criticidade';
  }

  return { level, score, factors, reasoning };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL SELECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Intelligent model selection considering complexity, cost, and requirements.
 * Selects the cheapest model capable of handling the task.
 */
export function selectModel(
  agentType: AgentType,
  input: Record<string, any>,
  options: {
    contextLength?: number;
    preferredTier?: ModelTier;
    requireVision?: boolean;
    requireWebSearch?: boolean;
    requireExtendedThinking?: boolean;
    maxBudget?: number;
  } = {},
): ModelSelection {
  const complexity = analyzeComplexity(agentType, input, options.contextLength || 0);

  // If user explicitly chose a tier, respect it
  if (options.preferredTier && options.preferredTier !== 'balanced') {
    const model = Object.values(MODEL_REGISTRY).find(m => m.tier === options.preferredTier)!;
    return {
      modelId: model.id,
      modelName: model.name,
      tier: model.tier,
      reason: `Modelo ${model.name} selecionado por preferência do usuário`,
      complexityScore: complexity.score,
      complexityLevel: complexity.level,
      estimatedCost: 0,
    };
  }

  // Filter models by requirements
  let candidates = Object.values(MODEL_REGISTRY).filter(model => {
    if (options.requireVision && !model.supportsVision) return false;
    if (options.requireWebSearch && !model.supportsWebSearch) return false;
    if (options.requireExtendedThinking && !model.supportsExtendedThinking) return false;
    return true;
  });

  // Select based on strategy and complexity level
  let selectedModel: ModelConfig;
  const strategy = env.CLAUDE_MODEL_STRATEGY || 'haiku-only';

  if (strategy === 'haiku-only') {
    // FIXED: Always use Haiku regardless of complexity
    selectedModel = candidates.find(m => m.tier === 'lightweight') || candidates[0];
  } else if (strategy === 'cheap') {
    // Aggressively prefer the cheapest model unless complexity is high
    if (complexity.level === 'expert') {
      selectedModel = candidates.find(m => m.tier === 'advanced')
        || candidates.find(m => m.tier === 'balanced')
        || candidates[0];
    } else if (complexity.level === 'complex') {
      selectedModel = candidates.find(m => m.tier === 'balanced') || candidates[0];
    } else {
      selectedModel = candidates.find(m => m.tier === 'lightweight') || candidates[0];
    }
  } else {
    switch (complexity.level) {
      case 'trivial':
      case 'simple':
        selectedModel = candidates.find(m => m.tier === 'lightweight') || candidates[0];
        break;
      case 'moderate':
        selectedModel = candidates.find(m => m.tier === 'balanced') || candidates[0];
        break;
      case 'complex':
      case 'expert':
        selectedModel = candidates.find(m => m.tier === 'advanced') 
          || candidates.find(m => m.tier === 'balanced') 
          || candidates[0];
        break;
      default:
        selectedModel = candidates.find(m => m.tier === 'balanced') || candidates[0];
    }
  }

  // Estimate cost for a typical request
  const estimatedInputTokens = Math.ceil((options.contextLength || 1000) / TOKEN_ESTIMATION.avgCharsPerTokenPT);
  const estimatedOutputTokens = 1000;
  const estimatedCost = 
    estimatedInputTokens * selectedModel.costPerInputToken +
    estimatedOutputTokens * selectedModel.costPerOutputToken;

  // Build reason string
  const costRatio = (MODEL_REGISTRY.sonnet.costPerInputToken / selectedModel.costPerInputToken).toFixed(1);
  let reason: string;
  
  if (selectedModel.tier === 'lightweight') {
    reason = `${selectedModel.name} — tarefa ${complexity.level}, economia de ${costRatio}x vs Sonnet`;
  } else if (selectedModel.tier === 'advanced') {
    reason = `${selectedModel.name} — tarefa ${complexity.level} requer raciocínio avançado`;
  } else {
    reason = `${selectedModel.name} — equilíbrio ideal para tarefa ${complexity.level}`;
  }

  logger.debug({
    agentType,
    complexity: complexity.level,
    complexityScore: complexity.score,
    selectedModel: selectedModel.id,
    selectedTier: selectedModel.tier,
    estimatedCost: estimatedCost.toFixed(6),
    factors: complexity.factors.map(f => ({ name: f.name, value: f.value })),
  }, 'ModelSelector: Model selected');

  return {
    modelId: selectedModel.id,
    modelName: selectedModel.name,
    tier: selectedModel.tier,
    reason,
    complexityScore: complexity.score,
    complexityLevel: complexity.level,
    estimatedCost,
  };
}

/**
 * Get model config by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return Object.values(MODEL_REGISTRY).find(m => m.id === modelId);
}

/**
 * Get model by tier
 */
export function getModelByTier(tier: ModelTier): ModelConfig {
  return Object.values(MODEL_REGISTRY).find(m => m.tier === tier) || MODEL_REGISTRY.sonnet;
}

/**
 * Estimate token count from text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / TOKEN_ESTIMATION.avgCharsPerTokenPT);
}
