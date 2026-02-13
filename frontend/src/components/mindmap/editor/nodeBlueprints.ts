import {
  Bot,
  BarChart3,
  Briefcase,
  CheckSquare,
  ClipboardList,
  FileArchive,
  FileText,
  FlaskConical,
  GitBranch,
  HelpCircle,
  Lightbulb,
  LucideIcon,
  Radar,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react';
import type {
  DocumentVaultItem,
  NeuralNodeData,
  NeuralNodeType,
  NodeArchetype,
  NodeSurface,
} from './types';

export type NodeBlueprintCategory =
  | 'ideation'
  | 'execution'
  | 'research'
  | 'data'
  | 'documents'
  | 'ai';

export interface NodeBlueprint {
  id: string;
  title: string;
  subtitle: string;
  category: NodeBlueprintCategory;
  type: NeuralNodeType;
  icon: LucideIcon;
  accentColor: string;
  archetype: NodeArchetype;
  surface: NodeSurface;
  description: string;
  aiObjective: string;
  todoSeed: string[];
  tags: string[];
  defaultStatus?: NeuralNodeData['status'];
  defaultPriority?: NeuralNodeData['priority'];
  defaultProgress?: number;
  checklistSeed?: string[];
  documentSeed?: Array<Pick<DocumentVaultItem, 'title' | 'type' | 'summary' | 'tags'>>;
}

const BLUEPRINTS: NodeBlueprint[] = [
  {
    id: 'concept-spark',
    title: 'Concept Spark',
    subtitle: 'Seed for strategic ideas',
    category: 'ideation',
    type: 'idea',
    icon: Lightbulb,
    accentColor: '#f59e0b',
    archetype: 'spark',
    surface: 'capsule',
    description: 'Kickoff concept with context, problem and first expansion paths.',
    aiObjective: 'Expand into related domains and generate high-value branches.',
    todoSeed: [
      'Frame the core problem',
      'List the top 3 assumptions',
      'Generate 6 branching ideas',
      'Rank by impact and feasibility',
    ],
    tags: ['concept', 'strategy', 'kickoff'],
    defaultPriority: 'high',
    defaultStatus: 'active',
  },
  {
    id: 'problem-frame',
    title: 'Problem Frame',
    subtitle: 'Question and constraints lens',
    category: 'ideation',
    type: 'question',
    icon: HelpCircle,
    accentColor: '#f97316',
    archetype: 'questioning',
    surface: 'signal',
    description: 'Model constraints, open questions and what success looks like.',
    aiObjective: 'Structure unknowns and propose hypothesis-driven experiments.',
    todoSeed: [
      'Define who is affected',
      'Define measurable success signal',
      'List known constraints',
      'Create decision checkpoints',
    ],
    tags: ['problem', 'constraints', 'hypothesis'],
    defaultPriority: 'medium',
    defaultStatus: 'draft',
  },
  {
    id: 'value-map',
    title: 'Value Map',
    subtitle: 'Customer value articulation',
    category: 'ideation',
    type: 'idea',
    icon: Target,
    accentColor: '#eab308',
    archetype: 'decision',
    surface: 'soft-card',
    description: 'Translate concept into concrete value for users and business.',
    aiObjective: 'Create positioning options and prioritize winning narrative.',
    todoSeed: [
      'List user pains addressed',
      'Define unique promise',
      'Map business outcomes',
      'Draft proof points',
    ],
    tags: ['value', 'positioning', 'narrative'],
    defaultPriority: 'high',
    defaultStatus: 'active',
  },
  {
    id: 'delivery-flow',
    title: 'Delivery Flow',
    subtitle: 'Execution backbone',
    category: 'execution',
    type: 'task',
    icon: Workflow,
    accentColor: '#22c55e',
    archetype: 'task_flow',
    surface: 'module',
    description: 'Operational workflow with dependencies and ownership.',
    aiObjective: 'Break into executable tasks, dependencies and timelines.',
    todoSeed: [
      'Split into implementation stages',
      'Assign owner and due date',
      'Attach risks per stage',
      'Set progress review cadence',
    ],
    checklistSeed: ['Define scope', 'Estimate effort', 'Assign owner', 'Schedule review'],
    tags: ['execution', 'workflow', 'ops'],
    defaultPriority: 'high',
    defaultStatus: 'in_progress',
    defaultProgress: 20,
  },
  {
    id: 'sprint-hub',
    title: 'Sprint Hub',
    subtitle: 'Weekly task orchestrator',
    category: 'execution',
    type: 'task',
    icon: CheckSquare,
    accentColor: '#10b981',
    archetype: 'milestone',
    surface: 'soft-card',
    description: 'Sprint node with deliverables, blockers and completion criteria.',
    aiObjective: 'Turn plan into sprint-ready backlog and track completion.',
    todoSeed: [
      'Select sprint objective',
      'Plan capacity and load',
      'Mark blockers and owners',
      'Prepare review checklist',
    ],
    checklistSeed: ['Sprint goal', 'Backlog ordered', 'Dependencies validated', 'Retro planned'],
    tags: ['sprint', 'delivery', 'tracking'],
    defaultPriority: 'high',
    defaultStatus: 'in_progress',
    defaultProgress: 35,
  },
  {
    id: 'risk-watch',
    title: 'Risk Watch',
    subtitle: 'Operational risk radar',
    category: 'execution',
    type: 'question',
    icon: ShieldAlert,
    accentColor: '#ef4444',
    archetype: 'risk',
    surface: 'signal',
    description: 'Track probability, impact and mitigation actions for key risks.',
    aiObjective: 'Prioritize risks and propose mitigation strategies.',
    todoSeed: [
      'List top 5 risks',
      'Estimate severity score',
      'Assign mitigation owner',
      'Define trigger conditions',
    ],
    tags: ['risk', 'mitigation', 'governance'],
    defaultPriority: 'urgent',
    defaultStatus: 'review',
  },
  {
    id: 'research-core',
    title: 'Research Core',
    subtitle: 'Central investigation node',
    category: 'research',
    type: 'research',
    icon: Search,
    accentColor: '#0ea5e9',
    archetype: 'knowledge',
    surface: 'notebook',
    description: 'Research scaffold with angle, evidence and open issues.',
    aiObjective: 'Collect evidence, synthesize findings and identify gaps.',
    todoSeed: [
      'Define research question',
      'Collect 5 credible sources',
      'Summarize key findings',
      'Create unresolved issues list',
    ],
    tags: ['research', 'evidence', 'insight'],
    defaultPriority: 'medium',
    defaultStatus: 'active',
  },
  {
    id: 'source-grid',
    title: 'Source Grid',
    subtitle: 'Citation and references board',
    category: 'research',
    type: 'reference',
    icon: FlaskConical,
    accentColor: '#0284c7',
    archetype: 'evidence',
    surface: 'module',
    description: 'Map source quality, relevance and confidence for each reference.',
    aiObjective: 'Score source credibility and map contradictory evidence.',
    todoSeed: [
      'Attach source links',
      'Grade reliability',
      'Extract key data points',
      'Mark conflicting evidence',
    ],
    tags: ['sources', 'citations', 'validation'],
    defaultPriority: 'medium',
    defaultStatus: 'review',
  },
  {
    id: 'insight-board',
    title: 'Insight Board',
    subtitle: 'Patterns and signal extraction',
    category: 'research',
    type: 'note',
    icon: Radar,
    accentColor: '#06b6d4',
    archetype: 'knowledge',
    surface: 'soft-card',
    description: 'Consolidate observations, patterns and strategic implications.',
    aiObjective: 'Connect findings into strategic insights and next experiments.',
    todoSeed: [
      'Group repeated signals',
      'Map causes and effects',
      'Create recommendation options',
      'Define confidence level',
    ],
    tags: ['insight', 'patterns', 'analysis'],
    defaultPriority: 'medium',
    defaultStatus: 'active',
  },
  {
    id: 'metric-panel',
    title: 'Metric Panel',
    subtitle: 'KPI and performance snapshot',
    category: 'data',
    type: 'data',
    icon: BarChart3,
    accentColor: '#14b8a6',
    archetype: 'evidence',
    surface: 'module',
    description: 'Visualize key indicators and trend movements.',
    aiObjective: 'Generate metrics narrative and recommendations.',
    todoSeed: [
      'Define core KPIs',
      'Attach baseline data',
      'Highlight anomalies',
      'Add action recommendations',
    ],
    tags: ['kpi', 'metrics', 'performance'],
    defaultPriority: 'high',
    defaultStatus: 'active',
  },
  {
    id: 'trend-monitor',
    title: 'Trend Monitor',
    subtitle: 'Signal and momentum tracking',
    category: 'data',
    type: 'data',
    icon: GitBranch,
    accentColor: '#0891b2',
    archetype: 'knowledge',
    surface: 'signal',
    description: 'Track shifts, momentum and early warnings.',
    aiObjective: 'Forecast trend direction and suggest interventions.',
    todoSeed: [
      'Load historical data',
      'Define thresholds',
      'Identify inflection points',
      'Alert on downward trend',
    ],
    tags: ['trends', 'monitoring', 'forecast'],
    defaultPriority: 'high',
    defaultStatus: 'review',
  },
  {
    id: 'decision-matrix',
    title: 'Decision Matrix',
    subtitle: 'Option scoring with evidence',
    category: 'data',
    type: 'data',
    icon: Briefcase,
    accentColor: '#059669',
    archetype: 'decision',
    surface: 'notebook',
    description: 'Compare options by weighted criteria and evidence.',
    aiObjective: 'Score alternatives and recommend the strongest option.',
    todoSeed: [
      'List alternatives',
      'Define scoring criteria',
      'Attach supporting evidence',
      'Recommend next decision',
    ],
    tags: ['decision', 'prioritization', 'tradeoff'],
    defaultPriority: 'high',
    defaultStatus: 'in_progress',
  },
  {
    id: 'meeting-brief',
    title: 'Meeting Brief',
    subtitle: 'Structured notes and decisions',
    category: 'documents',
    type: 'note',
    icon: ClipboardList,
    accentColor: '#6366f1',
    archetype: 'document',
    surface: 'notebook',
    description: 'Capture meeting context, decisions, owners and due dates.',
    aiObjective: 'Summarize decisions and convert actions into task nodes.',
    todoSeed: [
      'Capture decisions',
      'Assign owners',
      'Define due dates',
      'Publish post-meeting summary',
    ],
    tags: ['meeting', 'notes', 'handoff'],
    defaultPriority: 'medium',
    defaultStatus: 'active',
  },
  {
    id: 'document-vault',
    title: 'Document Vault',
    subtitle: 'Archive and retrieval node',
    category: 'documents',
    type: 'reference',
    icon: FileArchive,
    accentColor: '#8b5cf6',
    archetype: 'archive',
    surface: 'module',
    description: 'Curated document repository with summaries and tags.',
    aiObjective: 'Organize documents and surface relevant context for tasks.',
    todoSeed: [
      'Attach essential files',
      'Write summaries for each file',
      'Tag by project area',
      'Archive outdated references',
    ],
    tags: ['documents', 'archive', 'knowledge-base'],
    defaultPriority: 'medium',
    defaultStatus: 'active',
    documentSeed: [
      {
        title: 'Project brief',
        type: 'note',
        summary: 'High-level scope and expected outcomes.',
        tags: ['brief', 'scope'],
      },
      {
        title: 'Requirements pack',
        type: 'file',
        summary: 'Functional and technical requirements.',
        tags: ['requirements', 'tech'],
      },
      {
        title: 'Reference links',
        type: 'link',
        summary: 'Curated links and supporting materials.',
        tags: ['references', 'external'],
      },
    ],
  },
  {
    id: 'evidence-log',
    title: 'Evidence Log',
    subtitle: 'Proof-driven documentation',
    category: 'documents',
    type: 'reference',
    icon: FileText,
    accentColor: '#64748b',
    archetype: 'evidence',
    surface: 'soft-card',
    description: 'Maintain traceable evidence and source-level confidence.',
    aiObjective: 'Cross-reference evidence with assumptions and decision quality.',
    todoSeed: [
      'Log source and context',
      'Add confidence score',
      'Link to related decision',
      'Review stale evidence',
    ],
    tags: ['evidence', 'traceability', 'compliance'],
    defaultPriority: 'medium',
    defaultStatus: 'review',
  },
  {
    id: 'ai-brief',
    title: 'AI Brief',
    subtitle: 'Prompt-ready context node',
    category: 'ai',
    type: 'note',
    icon: Bot,
    accentColor: '#22d3ee',
    archetype: 'ai_brief',
    surface: 'signal',
    description: 'Structured context so AI can generate better nodes and plans.',
    aiObjective: 'Provide constraints, expected format and objective to the model.',
    todoSeed: [
      'Define objective clearly',
      'List constraints and assumptions',
      'Specify desired output format',
      'Set quality acceptance criteria',
    ],
    tags: ['ai', 'brief', 'prompting'],
    defaultPriority: 'high',
    defaultStatus: 'active',
  },
  {
    id: 'prompt-lab',
    title: 'Prompt Lab',
    subtitle: 'Experiment and iterate prompts',
    category: 'ai',
    type: 'research',
    icon: Sparkles,
    accentColor: '#06b6d4',
    archetype: 'ai_brief',
    surface: 'capsule',
    description: 'Test prompt variants and compare output quality.',
    aiObjective: 'Iterate prompt design and capture reproducible patterns.',
    todoSeed: [
      'Create baseline prompt',
      'Generate 3 prompt variants',
      'Compare quality and speed',
      'Store best-performing prompt',
    ],
    tags: ['ai', 'prompt', 'experiments'],
    defaultPriority: 'high',
    defaultStatus: 'in_progress',
  },
];

export const NODE_BLUEPRINTS = BLUEPRINTS;

export const NODE_BLUEPRINT_CATEGORY_LABELS: Record<NodeBlueprintCategory, string> = {
  ideation: 'Ideation',
  execution: 'Execution',
  research: 'Research',
  data: 'Data',
  documents: 'Documents',
  ai: 'AI Ready',
};

export const NODE_BLUEPRINTS_BY_CATEGORY: Record<NodeBlueprintCategory, NodeBlueprint[]> = {
  ideation: BLUEPRINTS.filter((blueprint) => blueprint.category === 'ideation'),
  execution: BLUEPRINTS.filter((blueprint) => blueprint.category === 'execution'),
  research: BLUEPRINTS.filter((blueprint) => blueprint.category === 'research'),
  data: BLUEPRINTS.filter((blueprint) => blueprint.category === 'data'),
  documents: BLUEPRINTS.filter((blueprint) => blueprint.category === 'documents'),
  ai: BLUEPRINTS.filter((blueprint) => blueprint.category === 'ai'),
};

const BLUEPRINT_BY_ID = new Map(BLUEPRINTS.map((blueprint) => [blueprint.id, blueprint]));

const DEFAULT_BLUEPRINT_BY_TYPE: Record<NeuralNodeType, string> = {
  idea: 'concept-spark',
  task: 'delivery-flow',
  note: 'meeting-brief',
  reference: 'document-vault',
  research: 'research-core',
  data: 'metric-panel',
  group: 'delivery-flow',
  question: 'problem-frame',
  image: 'source-grid',
};

const createChecklist = (seed: string[] | undefined): NonNullable<NeuralNodeData['checklist']> => {
  if (!seed || seed.length === 0) return [];
  return seed.map((text, index) => ({
    id: `check_${Date.now()}_${index}`,
    text,
    completed: false,
  }));
};

const createDocumentVault = (
  seed: NodeBlueprint['documentSeed']
): NonNullable<NeuralNodeData['documentVault']> => {
  if (!seed || seed.length === 0) return [];
  return seed.map((item, index) => ({
    id: `doc_${Date.now()}_${index}`,
    title: item.title,
    type: item.type,
    summary: item.summary,
    tags: item.tags || [],
    archived: false,
  }));
};

export function getNodeBlueprintById(id?: string | null): NodeBlueprint | undefined {
  if (!id) return undefined;
  return BLUEPRINT_BY_ID.get(id);
}

export function getDefaultBlueprintForType(type: NeuralNodeType): NodeBlueprint | undefined {
  return getNodeBlueprintById(DEFAULT_BLUEPRINT_BY_TYPE[type]);
}

export function createBlueprintNodeData(blueprint: NodeBlueprint): Partial<NeuralNodeData> {
  return {
    type: blueprint.type,
    archetype: blueprint.archetype,
    surface: blueprint.surface,
    readingMode: 'comfortable',
    blueprintId: blueprint.id,
    aiPromptHint: blueprint.aiObjective,
    aiContextPack: {
      blueprintId: blueprint.id,
      intent: blueprint.aiObjective,
      preferredOutput: blueprint.category === 'execution' ? 'tasks' : 'map',
      todoSeed: blueprint.todoSeed,
      promptHints: [
        `Blueprint: ${blueprint.title}`,
        `Focus: ${blueprint.subtitle}`,
        `Category: ${blueprint.category}`,
      ],
    },
    todoSeed: [...blueprint.todoSeed],
    tags: [...blueprint.tags],
    status: blueprint.defaultStatus || 'active',
    priority: blueprint.defaultPriority || 'medium',
    progress: blueprint.defaultProgress ?? 0,
    checklist: createChecklist(blueprint.checklistSeed),
    documentVault: createDocumentVault(blueprint.documentSeed),
  };
}

