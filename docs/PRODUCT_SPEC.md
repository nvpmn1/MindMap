# 📋 Especificação do Produto - MindMap Hub Cooperativo

## 1. Objetivo (North Star)

Construir um **hub cooperativo de mindmaps** para pesquisa e planejamento que permita:

- **3 usuários iniciais**: Guilherme, Helen, Pablo
- **Mindmaps compartilhados** e editáveis em tempo real
- **3 modos integrados** (mesma fonte de dados):
  1. Mapa visual
  2. Lista hierárquica
  3. Kanban de tarefas

### 1.1 Princípio "Agent-First"

O usuário interage através de **botões/ações** e a IA executa:
- Gera mapas completos
- Expande nós automaticamente
- Cria tarefas e dependências
- Define prazos e responsáveis
- Sugere caminhos e conexões
- Gera resumos e relatórios

---

## 2. Princípios de Design

### 2.1 Uma Fonte de Verdade
Map, Lista e Kanban são **views diferentes** do mesmo conteúdo. Alterar em um reflete nos outros.

### 2.2 Tudo Linkável
```
Nó ↔ Tarefa ↔ Comentário ↔ Referência ↔ Pessoa
```

### 2.3 Colaboração Visível
- Presença online (quem está no mapa)
- Cursores em tempo real
- Seleção visível do outro
- "Quem está mexendo em quê"

### 2.4 IA como Copiloto e Agente
| Modo | Descrição |
|------|-----------|
| **Copiloto** | Chat e sugestões contextuais |
| **Agente** | Executa ações e atualiza o projeto |

### 2.5 Caminho Feliz em 30 Segundos
```
Abrir → Escolher Template → Gerar Mapa → Delegar → Ver Kanban
```

### 2.6 Didático por Padrão
- Trail de navegação (breadcrumbs)
- Highlights de contexto
- Summaries automáticos
- Estados vazios explicativos

---

## 3. Personas e Casos de Uso

### 3.1 Guilherme (Pesquisador/Dev)
- Cria mapas de pesquisa científica
- Analisa papers e literatura
- Delega leituras para Helen e Pablo
- Quer ver progresso no Kanban

### 3.2 Helen (Pesquisadora)
- Recebe delegações de leitura
- Comenta e anota nos nós
- Expande subárvores com descobertas
- Marca tarefas como concluídas

### 3.3 Pablo (Pesquisador)
- Colabora em tempo real
- Usa templates para estruturar
- Revisa trabalho dos outros
- Sugere conexões entre nós

---

## 4. Funcionalidades por Módulo

### 4.1 Autenticação (Passwordless)

**Fluxo:**
1. Usuário digita email
2. Recebe Magic Link ou código OTP
3. Clica/digita e está logado
4. Seleciona perfil visual (Guilherme/Helen/Pablo)

**Requisitos:**
- [ ] Magic Link via Supabase Auth
- [ ] OTP como alternativa
- [ ] Sessão persistente (7 dias)
- [ ] Redirect URL configurado para localhost e produção
- [ ] Workspace "MindLab" pré-criado
- [ ] 3 membros pré-configurados

### 4.2 Home

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  🧠 MindLab                              [Avatar] [Sair]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📌 Continuar de onde parei                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Mapa 1   │ │ Mapa 2   │ │ Mapa 3   │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│                                                            │
│  ➕ Criar Novo                                             │
│  [Novo de Template] [Gerar com IA] [Importar]             │
│                                                            │
│  📋 Minhas Pendências (3)                                  │
│  • Revisar literatura - Mapa Pesquisa X                   │
│  • Expandir hipóteses - Mapa Experimento Y                │
│  • Aprovar estrutura - Mapa Paper Z                       │
│                                                            │
│  🔔 Notificações (2)                                       │
│  • Helen comentou em "Metodologia"                        │
│  • Pablo delegou tarefa para você                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Requisitos:**
- [ ] Lista de mapas recentes (últimos 10)
- [ ] Cards clicáveis com preview
- [ ] Botões de criação (3 tipos)
- [ ] Lista de pendências atribuídas
- [ ] Feed de notificações
- [ ] Busca global

### 4.3 Editor de Mapa

**Layout Completo:**
```
┌────────────────────────────────────────────────────────────────────┐
│ TopBar                                                              │
│ [🗺️ Mapa] [📋 Lista] [📊 Kanban]  🔍 Buscar...  [🤖 Agente] 👤👤👤 │
├──────────┬─────────────────────────────────────────────┬───────────┤
│ Sidebar  │                                             │  Drawer   │
│          │              CANVAS                         │           │
│ Worksp.  │                                             │  Detalhes │
│ ├─MindLab│         ┌─────────┐                        │  do Nó    │
│          │         │  Root   │                        │           │
│ Mapas    │         └────┬────┘                        │  Título   │
│ ├─Mapa 1 │        ┌─────┴─────┐                       │  Status   │
│ ├─Mapa 2 │   ┌────┴───┐ ┌────┴───┐                   │  Dono     │
│ └─Mapa 3 │   │ Nó A   │ │ Nó B   │                   │  Tags     │
│          │   └────────┘ └────────┘                    │           │
│ Templates│                                             │  Coment.  │
│ ├─Pesq.  │                                             │  Anexos   │
│ ├─Paper  │                                             │  Links    │
│ └─Projeto│                                             │  IA Chat  │
│          │                                             │           │
│ Filtros  │         [Minimap]                           │           │
│ [Tags]   │                                             │           │
│ [Status] │                                             │           │
│ [Dono]   │                                             │           │
├──────────┴─────────────────────────────────────────────┴───────────┤
│ Agent Console (Dock Inferior)                                       │
│ [Expandir] [Resumir] [→Tarefas] [Delegar] [Experimento] [Links]    │
└────────────────────────────────────────────────────────────────────┘
```

**Requisitos Canvas:**
- [ ] Zoom in/out (scroll + botões)
- [ ] Pan (arrastar canvas)
- [ ] Minimap no canto
- [ ] Seleção múltipla (Shift+click ou box select)
- [ ] Drag & drop de nós
- [ ] Conexões elásticas
- [ ] Collapse/expand de subárvores
- [ ] Animações suaves

**Requisitos Nó:**
- [ ] Título editável inline
- [ ] Cor/ícone personalizável
- [ ] Badge de status
- [ ] Badge de tarefas/comentários
- [ ] Menu de contexto (right-click)
- [ ] Hover mostra ações rápidas

### 4.4 View Lista

**Layout:**
```
📋 Lista - Mapa de Pesquisa

▼ 🎯 Pergunta Central
  ▼ 💡 Hipótese 1
    • 📚 Literatura relacionada
    • 🧪 Experimento proposto
    ▼ 📊 Métricas
      • Taxa de sucesso
      • Tempo de execução
  ▶ 💡 Hipótese 2 (colapsado)
  ▶ 💡 Hipótese 3 (colapsado)
```

**Requisitos:**
- [ ] Hierarquia colapsável
- [ ] Ícones por tipo de nó
- [ ] Drag para reordenar
- [ ] Checkbox para tarefas
- [ ] Inline editing
- [ ] Filtros (status, dono, tag)

### 4.5 View Kanban

**Layout:**
```
📊 Kanban - Tarefas do Mapa

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Backlog  │ │  Doing   │ │ Waiting  │ │   Done   │
│    (5)   │ │    (2)   │ │    (1)   │ │    (8)   │
├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │
│ │Task 1│ │ │ │Task 6│ │ │ │Task 8│ │ │ │Task 9│ │
│ │Helen │ │ │ │Pablo │ │ │ │Gui.  │ │ │ │Helen │ │
│ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │
│ ┌──────┐ │ │ ┌──────┐ │ │          │ │ ┌──────┐ │
│ │Task 2│ │ │ │Task 7│ │ │          │ │ │Task10│ │
│ │Gui.  │ │ │ │Helen │ │ │          │ │ │Pablo │ │
│ └──────┘ │ │ └──────┘ │ │          │ │ └──────┘ │
│ ...      │ │          │ │          │ │ ...      │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Requisitos:**
- [ ] 4 colunas padrão
- [ ] Drag entre colunas
- [ ] Card com info essencial
- [ ] Avatar do responsável
- [ ] Link para nó de origem
- [ ] Filtros (meu, todos, por data)
- [ ] Contador por coluna

### 4.6 Sistema de Delegação

**Fluxo:**
```
1. Usuário seleciona nó(s)
2. Clica "Delegar"
3. Modal abre:
   - Escolher pessoa (dropdown)
   - Escrever pedido
   - Definir prazo (opcional)
   - Definir prioridade (baixa/média/alta/urgente)
   - Definir tipo (pesquisa/resumo/decisão/execução)
4. Confirmar
5. Sistema cria:
   - Task atribuída
   - Notificação para pessoa
   - Badge no nó
```

**Requisitos:**
- [ ] Modal de delegação
- [ ] Dropdown de membros
- [ ] Campo de descrição
- [ ] Date picker para prazo
- [ ] Selector de prioridade
- [ ] Selector de tipo
- [ ] Criação automática de task
- [ ] Notificação push

### 4.7 Sistema de Notificações

**Tipos:**
| Tipo | Trigger | Mensagem |
|------|---------|----------|
| `delegation` | Alguém delega para mim | "Pablo delegou 'Revisar literatura' para você" |
| `comment` | Comentário em nó meu | "Helen comentou em 'Metodologia'" |
| `mention` | @menção | "Você foi mencionado em 'Hipótese 1'" |
| `task_done` | Minha task foi concluída | "Task 'Resumo' marcada como concluída" |
| `ai_complete` | IA terminou ação | "Mapa expandido com sucesso" |

**Requisitos:**
- [ ] Badge contador no header
- [ ] Dropdown de notificações
- [ ] Marcar como lida
- [ ] Marcar todas como lidas
- [ ] Click leva ao nó/tarefa
- [ ] Deep link (URL direta)

---

## 5. Templates de Mapas

### 5.1 Pesquisa Científica
```
Pergunta Central
├── Hipótese 1
│   ├── Literatura
│   ├── Experimento
│   └── Métricas
├── Hipótese 2
├── Riscos
└── Conclusões
```

### 5.2 Leitura de Paper
```
Paper: [Título]
├── Contexto
│   ├── Problema
│   └── Gap na literatura
├── Método
│   ├── Abordagem
│   └── Dados
├── Resultados
├── Limitações
├── Replicação
└── Ideias Novas
```

### 5.3 Plano de Projeto
```
Projeto: [Nome]
├── Objetivos
├── Entregáveis
│   ├── E1
│   ├── E2
│   └── E3
├── Timeline
├── Riscos
├── Dependências
└── Checklist
```

### 5.4 Mapa de Decisão
```
Decisão: [Pergunta]
├── Opção A
│   ├── Prós
│   └── Contras
├── Opção B
│   ├── Prós
│   └── Contras
├── Critérios
└── Recomendação
```

### 5.5 Brainstorming
```
Tema: [Tópico]
├── Divergir (muitas ideias)
│   ├── Ideia 1
│   ├── Ideia 2
│   └── ...
├── Clusters
│   ├── Grupo A
│   └── Grupo B
└── Síntese
```

*(Continua com os outros 5 templates...)*

---

## 6. Métricas de Sucesso

### 6.1 Performance
| Métrica | Target |
|---------|--------|
| Time to First Paint | < 1.5s |
| Time to Interactive | < 3s |
| Render mapa 100 nós | < 500ms |
| Update realtime | < 100ms |

### 6.2 UX
| Métrica | Target |
|---------|--------|
| Criar mapa até primeira tarefa | < 30s |
| Encontrar notificação → nó | < 5s |
| Curva de aprendizado | 0 (intuitivo) |

### 6.3 Confiabilidade
| Métrica | Target |
|---------|--------|
| Uptime | 99.5% |
| Data loss | 0 |
| Sync conflicts resolvidos | 100% |

---

## 7. Fora de Escopo (MVP)

- [ ] Mobile app nativo
- [ ] Offline mode
- [ ] Exportar para PDF/PPT
- [ ] Integrações (Notion, Slack, etc.)
- [ ] Múltiplos workspaces
- [ ] Billing/pagamento
- [ ] Mais de 3 usuários
- [ ] CRDT (usar last-write-wins primeiro)

---

## 8. Glossário

| Termo | Definição |
|-------|-----------|
| **Nó** | Elemento do mindmap (caixa) |
| **Edge** | Conexão visual entre nós |
| **Node Link** | Conexão semântica (sem linha visual) |
| **Task** | Tarefa atribuível derivada de nó |
| **Delegação** | Ato de atribuir trabalho a outro membro |
| **Agent** | IA que executa ações automaticamente |
| **Workspace** | Espaço de trabalho compartilhado |
| **View** | Modo de visualização (Mapa/Lista/Kanban) |
