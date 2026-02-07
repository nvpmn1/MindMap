# 🤖 Sistema de IA e Agentes - MindMap Hub

## 1. Visão Geral

O sistema de IA segue o princípio **"Agent-First"**: usuários interagem via **botões/ações** e a IA executa operações complexas automaticamente.

```
┌─────────────────────────────────────────────────────────────┐
│                    Arquitetura de Agentes                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐    ┌──────────────┐    ┌─────────────────┐   │
│   │ Usuario │───▶│ Agent Console│───▶│   Orchestrator  │   │
│   └─────────┘    └──────────────┘    └────────┬────────┘   │
│                                               │             │
│                  ┌────────────────────────────┼─────────┐   │
│                  │                            │         │   │
│                  ▼                            ▼         ▼   │
│           ┌──────────┐              ┌──────────┐  ┌──────┐ │
│           │ Planner  │              │Researcher│  │Critic│ │
│           └──────────┘              └──────────┘  └──────┘ │
│                  │                            │         │   │
│                  └────────────────────────────┼─────────┘   │
│                                               │             │
│                                               ▼             │
│                                        ┌──────────┐        │
│                                        │ Claude   │        │
│                                        │ Opus 4.5 │        │
│                                        └──────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Modelo de IA

### 2.1 Configuração

```typescript
// Configuração via env vars
const AI_CONFIG = {
  model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
  maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096'),
  temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
};
```

### 2.2 Modelos Disponíveis

| Modelo | Uso Recomendado | Tokens/min |
|--------|-----------------|------------|
| `claude-haiku-4-5-20251001` | Tarefas gerais, rápido e econômico | Alto |
| `claude-sonnet-4-20250514` | Tarefas complexas, análise profunda | Médio |

### 2.3 Endpoint de Modelos

```typescript
// GET /api/ai/models
// Retorna modelos disponíveis para debug/seleção

import Anthropic from '@anthropic-ai/sdk';

async function listModels() {
  const anthropic = new Anthropic();
  const models = await anthropic.models.list();
  return models.data;
}
```

---

## 3. Ações de IA (Agent Console)

### 3.1 Lista de Ações

| Ação | Descrição | Input | Output |
|------|-----------|-------|--------|
| **Gerar Mapa** | Cria mapa completo a partir de tema | tema, template | nós + edges |
| **Expandir Nó** | Adiciona sub-nós a um nó | node_id | novos nós |
| **Resumir** | Resume subárvore em texto | node_id | texto |
| **→ Tarefas** | Converte nós em tasks | node_ids | tasks |
| **Encontrar Gaps** | Identifica lacunas | map_id | sugestões |
| **Sugerir Links** | Propõe conexões | map_id | node_links |
| **Experimento** | Cria plano experimental | node_id | nós estruturados |
| **Relatório** | Gera documento | map_id | markdown |
| **Checklist** | Cria lista de ações | node_ids | tasks |

### 3.2 UI do Agent Console

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Agent Console                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │📊 Gerar │ │🌳 Expand│ │📝 Resumir│ │✅ Tasks │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │🔍 Gaps  │ │🔗 Links │ │🧪 Exper.│ │📄 Report│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  [💬 Chat com contexto...]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Arquitetura de Agentes

### 4.1 Orchestrator

O Orchestrator coordena subagentes e gerencia o fluxo:

```typescript
// agents/orchestrator.ts

interface AgentContext {
  mapId: string;
  nodeId?: string;
  userId: string;
  action: AgentAction;
  input: Record<string, any>;
}

interface AgentResult {
  success: boolean;
  output: any;
  diffs: Diff[];
  tokensUsed: { input: number; output: number };
}

class Orchestrator {
  private planner: PlannerAgent;
  private researcher: ResearcherAgent;
  private critic: CriticAgent;
  private projectManager: ProjectManagerAgent;

  async execute(context: AgentContext): Promise<AgentResult> {
    // 1. Log início
    const aiRun = await this.startRun(context);

    try {
      // 2. Planner decide estratégia
      const plan = await this.planner.createPlan(context);

      // 3. Researcher executa
      const research = await this.researcher.execute(plan, context);

      // 4. Critic valida
      const validation = await this.critic.validate(research, context);

      if (!validation.approved) {
        // Refinar se necessário
        research = await this.researcher.refine(validation.feedback, research);
      }

      // 5. Aplicar mudanças
      const diffs = await this.applyChanges(research, context);

      // 6. Log sucesso
      await this.completeRun(aiRun, { success: true, diffs });

      return { success: true, output: research, diffs };
    } catch (error) {
      await this.failRun(aiRun, error);
      throw error;
    }
  }
}
```

### 4.2 Planner Agent

Decide a estratégia de execução:

```typescript
// agents/planner.ts

class PlannerAgent {
  async createPlan(context: AgentContext): Promise<Plan> {
    const prompt = this.buildPrompt(context);
    
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: 1024,
      system: PLANNER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    return this.parsePlan(response);
  }
}

const PLANNER_SYSTEM_PROMPT = `
Você é o Planner Agent do MindMap Hub.
Sua função é analisar a requisição e criar um plano de execução.

Retorne um JSON com:
{
  "steps": [
    { "agent": "researcher", "task": "...", "params": {...} },
    { "agent": "critic", "task": "validate", "params": {...} }
  ],
  "estimatedTokens": 1000,
  "complexity": "low|medium|high"
}
`;
```

### 4.3 Researcher Agent

Gera conteúdo e estrutura:

```typescript
// agents/researcher.ts

class ResearcherAgent {
  async execute(plan: Plan, context: AgentContext): Promise<ResearchResult> {
    const mapContext = await this.getMapContext(context.mapId);
    const nodeContext = context.nodeId 
      ? await this.getNodeContext(context.nodeId)
      : null;

    const prompt = this.buildPrompt(plan, mapContext, nodeContext);

    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      system: this.getSystemPrompt(context.action),
      messages: [{ role: 'user', content: prompt }]
    });

    return this.parseResult(response, context.action);
  }

  private getSystemPrompt(action: AgentAction): string {
    const prompts = {
      'generate-map': GENERATE_MAP_PROMPT,
      'expand-node': EXPAND_NODE_PROMPT,
      'summarize': SUMMARIZE_PROMPT,
      'to-tasks': TO_TASKS_PROMPT,
      // ...
    };
    return prompts[action];
  }
}
```

### 4.4 Critic Agent

Valida consistência e qualidade:

```typescript
// agents/critic.ts

class CriticAgent {
  async validate(research: ResearchResult, context: AgentContext): Promise<Validation> {
    const prompt = `
      Analise o seguinte resultado e verifique:
      1. Consistência lógica
      2. Completude (não faltam partes importantes?)
      3. Clareza (títulos são descritivos?)
      4. Não há alucinações ou informações inventadas
      
      Resultado a validar:
      ${JSON.stringify(research, null, 2)}
      
      Contexto original:
      ${JSON.stringify(context, null, 2)}
    `;

    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: 1024,
      system: CRITIC_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    return this.parseValidation(response);
  }
}

const CRITIC_SYSTEM_PROMPT = `
Você é o Critic Agent do MindMap Hub.
Sua função é validar outputs de outros agentes.

Seja rigoroso mas justo. Retorne:
{
  "approved": true|false,
  "score": 0-100,
  "issues": ["issue1", "issue2"],
  "feedback": "feedback para refinamento se necessário"
}
`;
```

### 4.5 Project Manager Agent

Cria tasks e atribuições:

```typescript
// agents/projectManager.ts

class ProjectManagerAgent {
  async createTasks(nodes: Node[], context: AgentContext): Promise<Task[]> {
    const members = await this.getWorkspaceMembers(context);
    
    const prompt = `
      Converta os seguintes nós em tarefas acionáveis.
      
      Nós:
      ${nodes.map(n => `- ${n.title}: ${n.content}`).join('\n')}
      
      Membros disponíveis para atribuição:
      ${members.map(m => `- ${m.display_name} (${m.user_id})`).join('\n')}
      
      Para cada tarefa, defina:
      - título claro e acionável
      - descrição detalhada
      - prioridade (low/medium/high/urgent)
      - tipo (task/research/review/decision)
      - sugestão de assignee baseada no contexto
    `;

    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: 2048,
      system: PM_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    return this.parseTasks(response);
  }
}
```

---

## 5. Prompts por Ação

### 5.1 Gerar Mapa

```typescript
// agents/prompts/generateMap.ts

export const GENERATE_MAP_PROMPT = `
Você é um especialista em criar mindmaps estruturados para pesquisa e planejamento.

Dado um tema/objetivo, crie um mindmap completo com:
- Nó raiz com o tema principal
- 3-7 ramos principais
- 2-5 sub-nós por ramo
- Estrutura lógica e hierárquica

FORMATO DE SAÍDA (JSON):
{
  "nodes": [
    {
      "id": "temp-1",
      "title": "Título do nó",
      "content": "Descrição opcional",
      "parent_id": null, // null para raiz
      "position": { "x": 0, "y": 0 },
      "color": "#6366f1",
      "icon": "target"
    }
  ],
  "edges": [
    {
      "source_id": "temp-1",
      "target_id": "temp-2"
    }
  ]
}

REGRAS:
1. IDs temporários começam com "temp-"
2. Posições serão recalculadas pelo layout automático
3. Ícones: use nomes do Lucide (target, lightbulb, book, flask, etc.)
4. Cores: use cores hexadecimais suaves
`;
```

### 5.2 Expandir Nó

```typescript
// agents/prompts/expandNode.ts

export const EXPAND_NODE_PROMPT = `
Você é um especialista em expandir ideias e conceitos.

Dado um nó existente de um mindmap, crie sub-nós relevantes que:
- Aprofundem o conceito
- Explorem diferentes aspectos
- Mantenham coerência com o contexto do mapa

CONTEXTO DO MAPA:
{mapContext}

NÓ A EXPANDIR:
{nodeContext}

FORMATO DE SAÍDA (JSON):
{
  "nodes": [
    {
      "id": "temp-1",
      "title": "Sub-tópico",
      "content": "Descrição",
      "parent_id": "{parentNodeId}",
      "icon": "chevron-right"
    }
  ]
}

REGRAS:
1. Crie 3-5 sub-nós relevantes
2. Títulos concisos (max 50 caracteres)
3. Conteúdo opcional mas útil
4. Ícones apropriados ao tipo de conteúdo
`;
```

### 5.3 Resumir Subárvore

```typescript
// agents/prompts/summarize.ts

export const SUMMARIZE_PROMPT = `
Você é um especialista em síntese de informações.

Dada uma subárvore de um mindmap, crie um resumo conciso que:
- Capture os pontos principais
- Mantenha a estrutura lógica
- Seja útil para revisão rápida

SUBÁRVORE:
{subtreeContext}

FORMATO DE SAÍDA:
{
  "summary": "Resumo em 2-3 parágrafos",
  "keyPoints": ["ponto 1", "ponto 2"],
  "suggestedActions": ["ação 1", "ação 2"]
}
`;
```

### 5.4 Converter em Tarefas

```typescript
// agents/prompts/toTasks.ts

export const TO_TASKS_PROMPT = `
Você é um gerente de projetos experiente.

Converta os nós selecionados em tarefas acionáveis que:
- Tenham títulos claros no formato "Verbo + Objeto"
- Incluam descrição com contexto
- Tenham prioridade apropriada
- Sejam atribuíveis a uma pessoa

NÓS SELECIONADOS:
{selectedNodes}

MEMBROS DISPONÍVEIS:
{workspaceMembers}

FORMATO DE SAÍDA (JSON):
{
  "tasks": [
    {
      "title": "Revisar literatura sobre X",
      "description": "Detalhes da tarefa...",
      "priority": "medium",
      "type": "research",
      "suggested_assignee": "user-id",
      "source_node_id": "node-id"
    }
  ]
}

TIPOS DE TAREFA:
- task: Tarefa geral
- research: Pesquisa/leitura
- review: Revisão/validação
- decision: Tomada de decisão
- execution: Implementação
`;
```

---

## 6. Fluxo de Execução

### 6.1 Exemplo: Expandir Nó

```
1. Usuário clica "Expandir" no nó "Metodologia"
   │
2. Frontend chama POST /api/ai/expand-node
   │ Body: { mapId, nodeId }
   │
3. Backend verifica auth e permissões
   │
4. Orchestrator inicia
   │
   ├─► Planner: "Preciso expandir um nó de metodologia"
   │   │ Retorna: { steps: [researcher, critic] }
   │   │
   ├─► Researcher: Busca contexto do mapa e nó
   │   │ Gera prompt com EXPAND_NODE_PROMPT
   │   │ Chama Claude API
   │   │ Retorna: { nodes: [...] }
   │   │
   ├─► Critic: Valida resultado
   │   │ Verifica: consistência, completude
   │   │ Retorna: { approved: true }
   │   │
5. Orchestrator aplica mudanças
   │ INSERT nodes no Supabase
   │
6. Supabase Realtime notifica Frontend
   │
7. Frontend anima novos nós aparecendo
```

### 6.2 Logging de AI Runs

```typescript
// Estrutura salva em ai_runs
{
  id: "uuid",
  map_id: "uuid",
  node_id: "uuid",
  action_type: "expand-node",
  input: {
    nodeId: "uuid",
    nodeTitle: "Metodologia",
    mapContext: "..."
  },
  output: {
    nodes: [...],
    approved: true
  },
  diffs: [
    { type: "INSERT", table: "nodes", data: {...} },
    { type: "INSERT", table: "nodes", data: {...} }
  ],
  status: "completed",
  tokens_input: 1500,
  tokens_output: 800,
  model: "claude-sonnet-4-20250514",
  duration_ms: 2300,
  created_by: "user-uuid",
  created_at: "2025-02-01T12:00:00Z",
  completed_at: "2025-02-01T12:00:02Z"
}
```

---

## 7. Endpoints da API de IA

### 7.1 POST /api/ai/generate-map

```typescript
// Request
{
  "workspaceId": "uuid",
  "theme": "Pesquisa sobre Machine Learning",
  "template": "research", // opcional
  "depth": 3 // opcional, default 2
}

// Response
{
  "success": true,
  "data": {
    "map": { id, title, ... },
    "nodes": [...],
    "edges": [...],
    "aiRunId": "uuid"
  }
}
```

### 7.2 POST /api/ai/expand-node

```typescript
// Request
{
  "mapId": "uuid",
  "nodeId": "uuid",
  "depth": 1, // opcional
  "focus": "practical" // opcional: practical, theoretical, examples
}

// Response
{
  "success": true,
  "data": {
    "newNodes": [...],
    "newEdges": [...],
    "aiRunId": "uuid"
  }
}
```

### 7.3 POST /api/ai/summarize

```typescript
// Request
{
  "mapId": "uuid",
  "nodeId": "uuid", // raiz da subárvore
  "format": "paragraph" // paragraph, bullets, structured
}

// Response
{
  "success": true,
  "data": {
    "summary": "...",
    "keyPoints": [...],
    "aiRunId": "uuid"
  }
}
```

### 7.4 POST /api/ai/to-tasks

```typescript
// Request
{
  "mapId": "uuid",
  "nodeIds": ["uuid1", "uuid2"], // nós selecionados
  "autoAssign": true // tentar atribuir automaticamente
}

// Response
{
  "success": true,
  "data": {
    "tasks": [...],
    "aiRunId": "uuid"
  }
}
```

### 7.5 POST /api/ai/suggest-links

```typescript
// Request
{
  "mapId": "uuid",
  "threshold": 0.7 // força mínima da conexão sugerida
}

// Response
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "sourceId": "uuid",
        "targetId": "uuid",
        "strength": 0.85,
        "reason": "Ambos tratam de metodologia experimental"
      }
    ],
    "aiRunId": "uuid"
  }
}
```

### 7.6 POST /api/ai/chat

```typescript
// Request
{
  "mapId": "uuid",
  "nodeId": "uuid", // contexto opcional
  "message": "Como posso melhorar esta hipótese?",
  "history": [...] // mensagens anteriores
}

// Response
{
  "success": true,
  "data": {
    "response": "Para melhorar sua hipótese...",
    "suggestedActions": [
      { "action": "expand-node", "nodeId": "uuid" }
    ],
    "aiRunId": "uuid"
  }
}
```

---

## 8. Rate Limiting e Custos

### 8.1 Limites por Usuário

```typescript
const AI_LIMITS = {
  requestsPerMinute: 10,
  requestsPerHour: 100,
  tokensPerDay: 100000,
};

// Middleware de rate limiting para AI
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: AI_LIMITS.requestsPerMinute,
  keyGenerator: (req) => req.user.id,
  message: 'Too many AI requests. Please wait.'
});
```

### 8.2 Monitoramento de Custos

```typescript
// Após cada chamada
async function trackUsage(aiRun: AIRun) {
  const cost = calculateCost(aiRun.tokens_input, aiRun.tokens_output);
  
  await supabase.from('ai_usage_daily').upsert({
    user_id: aiRun.created_by,
    date: new Date().toISOString().split('T')[0],
    total_tokens: aiRun.tokens_input + aiRun.tokens_output,
    total_cost: cost,
    request_count: 1
  }, {
    onConflict: 'user_id,date',
    count: 'exact'
  });
}
```

---

## 9. Tratamento de Erros

### 9.1 Erros Comuns

| Erro | Causa | Ação |
|------|-------|------|
| `rate_limit_exceeded` | Muitas requisições | Retry com backoff |
| `context_too_long` | Mapa muito grande | Truncar contexto |
| `invalid_output` | Claude retornou formato errado | Retry com prompt mais específico |
| `api_error` | Erro da API Anthropic | Log e notificar |

### 9.2 Retry Strategy

```typescript
async function callClaudeWithRetry(
  params: MessageCreateParams,
  maxRetries = 3
): Promise<Message> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (error) {
      if (error.status === 429) {
        // Rate limited - wait and retry
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      if (attempt === maxRetries) throw error;
    }
  }
}
```

---

## 10. Testes de Agentes

### 10.1 Testes Unitários

```typescript
describe('ResearcherAgent', () => {
  it('should expand node with valid output', async () => {
    const context = {
      mapId: 'test-map',
      nodeId: 'test-node',
      action: 'expand-node'
    };
    
    const result = await researcher.execute(mockPlan, context);
    
    expect(result.nodes).toHaveLength(greaterThan(0));
    expect(result.nodes[0]).toHaveProperty('title');
    expect(result.nodes[0]).toHaveProperty('parent_id', 'test-node');
  });
});
```

### 10.2 Testes de Integração

```typescript
describe('AI Expand Endpoint', () => {
  it('should expand node and persist to database', async () => {
    const response = await request(app)
      .post('/api/ai/expand-node')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ mapId: testMapId, nodeId: testNodeId });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verificar que nós foram criados no banco
    const { data: nodes } = await supabase
      .from('nodes')
      .select('*')
      .eq('parent_id', testNodeId);
    
    expect(nodes.length).toBeGreaterThan(0);
  });
});
```
