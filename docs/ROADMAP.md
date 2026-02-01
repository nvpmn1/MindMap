# 📅 Roadmap de Desenvolvimento - MindMap Hub

## Visão Geral das Fases

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ROADMAP MINDMAP HUB                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FASE 1: MVP                    FASE 2: Colaboração                     │
│  ═══════════                    ════════════════════                    │
│  □ Auth (Magic Link)            □ Presence + Cursors                    │
│  □ Workspace + Members          □ Comentários + @mentions               │
│  □ CRUD Mapas                   □ Deep links                            │
│  □ CRUD Nós                     □ Activity feed                         │
│  □ Views (Map/List/Kanban)      □ Melhorias de UX                       │
│  □ Tasks básico                                                         │
│  □ Notificações                 FASE 3: Research Hub                    │
│  □ IA (gerar/expandir)          ════════════════════                    │
│  □ Deploy                       □ References/Bibliografia               │
│                                 □ Anexos (Storage)                      │
│  ~3-5 dias                      □ Paper reading template                │
│                                 □ Relatório automático                  │
│                                                                         │
│                                 FASE 4: Polish                          │
│                                 ═════════════                           │
│                                 □ Animações avançadas                   │
│                                 □ Modo apresentação                     │
│                                 □ Timeline de atividade                 │
│                                 □ Atalhos de teclado                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: MVP (3-5 dias)

### Sprint 1.1: Infraestrutura (Dia 1)

| ID | Task | Prioridade | Estimativa | DoD |
|----|------|------------|------------|-----|
| 1.1.1 | Setup repositório monorepo | P0 | 1h | Estrutura de pastas criada, git init |
| 1.1.2 | Setup Supabase (projeto + schema) | P0 | 2h | Tabelas criadas, RLS ativo |
| 1.1.3 | Setup Backend (Express + TS) | P0 | 2h | `/health` respondendo |
| 1.1.4 | Setup Frontend (Vite + React + TS) | P0 | 2h | Tela em branco renderizando |
| 1.1.5 | Deploy inicial (Vercel + Render) | P0 | 2h | URLs acessíveis |

**Entregável:** Infraestrutura base funcionando em produção.

### Sprint 1.2: Auth + Home (Dia 2)

| ID | Task | Prioridade | Estimativa | DoD |
|----|------|------------|------------|-----|
| 1.2.1 | Login com Magic Link | P0 | 3h | Email recebido, sessão criada |
| 1.2.2 | Callback de auth | P0 | 1h | Redirect funcionando |
| 1.2.3 | AuthGuard (proteção de rotas) | P0 | 1h | Rotas protegidas |
| 1.2.4 | Profile creation (primeiro login) | P1 | 1h | Profile criado automaticamente |
| 1.2.5 | Home page básica | P1 | 2h | Lista mapas, botões de ação |

**Entregável:** Usuário consegue logar e ver Home.

### Sprint 1.3: CRUD Mapas e Nós (Dia 2-3)

| ID | Task | Prioridade | Estimativa | DoD |
|----|------|------------|------------|-----|
| 1.3.1 | Criar mapa | P0 | 2h | Mapa salvo no banco |
| 1.3.2 | Listar mapas | P0 | 1h | Cards na home |
| 1.3.3 | Abrir mapa (editor) | P0 | 2h | Canvas renderiza |
| 1.3.4 | Criar nó | P0 | 2h | Nó aparece no canvas |
| 1.3.5 | Editar nó (inline) | P0 | 2h | Título editável |
| 1.3.6 | Deletar nó | P0 | 1h | Nó removido |
| 1.3.7 | Mover nó (drag) | P0 | 2h | Posição salva |
| 1.3.8 | Criar edge (conexão) | P1 | 2h | Linha entre nós |

**Entregável:** CRUD completo de mapas e nós.

### Sprint 1.4: Views (Dia 3-4)

| ID | Task | Prioridade | Estimativa | DoD |
|----|------|------------|------------|-----|
| 1.4.1 | View Mapa (canvas) | P0 | 4h | Zoom, pan, minimap |
| 1.4.2 | View Lista (árvore) | P1 | 3h | Hierarquia colapsável |
| 1.4.3 | View Kanban | P1 | 4h | 4 colunas, drag entre |
| 1.4.4 | Switch entre views | P0 | 1h | Tabs funcionando |
| 1.4.5 | Sincronização entre views | P0 | 2h | Mudança reflete em todas |

**Entregável:** 3 views funcionais e sincronizadas.

### Sprint 1.5: Tasks e Notificações (Dia 4)

| ID | Task | Prioridade | Estimativa | DoD |
|----|------|------------|------------|-----|
| 1.5.1 | CRUD Tasks | P0 | 2h | Task criada/editada/deletada |
| 1.5.2 | Atribuir task (assignee) | P0 | 1h | Dropdown de membros |
| 1.5.3 | Modal de delegação | P1 | 2h | Delegar com descrição |
| 1.5.4 | Criar notificação (trigger) | P0 | 1h | Notif criada ao delegar |
| 1.5.5 | Listar notificações | P0 | 2h | Dropdown com lista |
| 1.5.6 | Marcar como lida | P1 | 1h | Click marca read_at |
| 1.5.7 | Badge de contagem | P1 | 30m | Número no sino |

**Entregável:** Sistema de tasks e notificações funcional.

### Sprint 1.6: IA Básica (Dia 4-5)

| ID | Task | Prioridade | Estimativa | DoD |
|----|------|------------|------------|-----|
| 1.6.1 | Endpoint /ai/generate-map | P0 | 3h | Mapa gerado por tema |
| 1.6.2 | Endpoint /ai/expand-node | P0 | 2h | Sub-nós criados |
| 1.6.3 | Endpoint /ai/to-tasks | P1 | 2h | Tasks criadas de nós |
| 1.6.4 | Agent Console UI | P0 | 2h | Botões no dock inferior |
| 1.6.5 | Loading state durante IA | P1 | 1h | Spinner, disable botões |
| 1.6.6 | Log de ai_runs | P2 | 1h | Registro no banco |

**Entregável:** IA gera mapas e expande nós.

### Sprint 1.7: Polish MVP (Dia 5)

| ID | Task | Prioridade | Estimativa | DoD |
|----|------|------------|------------|-----|
| 1.7.1 | Estados vazios | P1 | 1h | Mensagens amigáveis |
| 1.7.2 | Toasts de feedback | P1 | 1h | Sucesso/erro/info |
| 1.7.3 | Loading states | P1 | 1h | Skeletons, spinners |
| 1.7.4 | Responsividade básica | P2 | 2h | Funciona em tablet |
| 1.7.5 | Teste end-to-end manual | P0 | 2h | Fluxo completo funciona |
| 1.7.6 | Fix de bugs críticos | P0 | 2h | Nenhum blocker |

**Entregável:** MVP polido e testado.

---

## Fase 2: Colaboração (5-7 dias)

### Sprint 2.1: Realtime Presence

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 2.1.1 | Subscribe Presence channel | 2h | Conexão estabelecida |
| 2.1.2 | Broadcast posição do cursor | 2h | Cursor enviado |
| 2.1.3 | Renderizar cursores remotos | 3h | Cursor com nome/cor |
| 2.1.4 | Indicar seleção remota | 2h | Nó highlight do outro |
| 2.1.5 | Avatars de presença no header | 1h | Bolinhas mostrando quem tá online |

### Sprint 2.2: Realtime Sync

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 2.2.1 | Subscribe Postgres Changes (nodes) | 2h | Updates chegando |
| 2.2.2 | Merge updates no state | 2h | UI atualiza sem reload |
| 2.2.3 | Optimistic UI | 2h | Ação instantânea local |
| 2.2.4 | Conflict detection | 2h | Aviso se versão mudou |
| 2.2.5 | Conflict resolution (merge) | 3h | IA ajuda a mesclar |

### Sprint 2.3: Comentários

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 2.3.1 | CRUD Comentários | 2h | Criar/editar/deletar |
| 2.3.2 | Lista de comentários no drawer | 2h | Ordenados por data |
| 2.3.3 | @mentions | 2h | Autocomplete de membros |
| 2.3.4 | Notificação de mention | 1h | Notif criada |
| 2.3.5 | Badge de comentários no nó | 1h | Contador visível |

### Sprint 2.4: Deep Links

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 2.4.1 | URL com map_id | 1h | /map/:id |
| 2.4.2 | URL com node_id | 1h | /map/:id?node=:nodeId |
| 2.4.3 | Focus automático ao abrir | 2h | Zoom no nó |
| 2.4.4 | Share button (copiar link) | 1h | Clipboard |
| 2.4.5 | Notificação com link clicável | 1h | Click abre no nó |

### Sprint 2.5: Activity Feed

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 2.5.1 | Log de activity_events | 2h | Insert em cada ação |
| 2.5.2 | Feed na home | 2h | Lista de atividades |
| 2.5.3 | Feed no drawer do mapa | 2h | Histórico do mapa |
| 2.5.4 | Filtros (por usuário, por tipo) | 1h | Dropdown filter |

---

## Fase 3: Research Hub (7-10 dias)

### Sprint 3.1: References

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 3.1.1 | CRUD References | 2h | URL, título, citation |
| 3.1.2 | UI no drawer (tab References) | 2h | Lista de refs do nó |
| 3.1.3 | Auto-fetch título de URL | 2h | OpenGraph/meta |
| 3.1.4 | Formatação de citação | 2h | APA/ABNT básico |

### Sprint 3.2: Anexos (Storage)

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 3.2.1 | Upload de arquivo | 3h | Drag & drop |
| 3.2.2 | Preview de imagem | 2h | Thumbnail |
| 3.2.3 | Download de arquivo | 1h | Link de download |
| 3.2.4 | Delete de arquivo | 1h | Remove do storage |
| 3.2.5 | RLS no Storage | 2h | Apenas membros acessam |

### Sprint 3.3: Templates Avançados

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 3.3.1 | Paper Reading template | 2h | Estrutura pré-definida |
| 3.3.2 | Research Project template | 2h | Com hipóteses/experimentos |
| 3.3.3 | Literature Review template | 2h | Matriz de papers |
| 3.3.4 | UI de seleção de template | 2h | Cards com preview |

### Sprint 3.4: IA Avançada

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 3.4.1 | /ai/summarize | 2h | Resumo de subárvore |
| 3.4.2 | /ai/find-gaps | 3h | Identificar lacunas |
| 3.4.3 | /ai/suggest-links | 3h | Conexões semânticas |
| 3.4.4 | /ai/generate-report | 4h | Markdown completo |
| 3.4.5 | Chat contextual | 4h | Perguntas sobre o mapa |

---

## Fase 4: Polish (5-7 dias)

### Sprint 4.1: Animações

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 4.1.1 | Node entrance animation | 2h | Fade + scale |
| 4.1.2 | Focus animation (pan + zoom) | 3h | Suave e natural |
| 4.1.3 | Collapse/expand animation | 2h | Smooth height |
| 4.1.4 | Cursor presence animation | 2h | Cursor suave |
| 4.1.5 | Toast animations | 1h | Slide in/out |

### Sprint 4.2: Modo Apresentação

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 4.2.1 | Fullscreen mode | 2h | Esconde UI |
| 4.2.2 | Navegação por setas | 2h | Próximo/anterior nó |
| 4.2.3 | Auto-focus no nó | 2h | Zoom automático |
| 4.2.4 | Highlight de caminho | 2h | Breadcrumb visual |

### Sprint 4.3: Atalhos de Teclado

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 4.3.1 | Implementar sistema de hotkeys | 2h | useHotkeys hook |
| 4.3.2 | Atalhos de navegação | 2h | Arrows, Enter, Esc |
| 4.3.3 | Atalhos de ação | 2h | Ctrl+N, Ctrl+S, Delete |
| 4.3.4 | Modal de atalhos (?) | 1h | Lista de todos |

### Sprint 4.4: Timeline/Heatmap

| ID | Task | Estimativa | DoD |
|----|------|------------|-----|
| 4.4.1 | Heatmap de atividade | 3h | GitHub-style |
| 4.4.2 | Timeline do mapa | 3h | Histórico visual |
| 4.4.3 | Replay de mudanças | 4h | Slider temporal |

---

## Definição de Done (Global)

Uma task só é considerada "Done" quando:

- [ ] Código implementado e funcionando
- [ ] Sem erros no console
- [ ] Responsivo (se aplicável)
- [ ] Estados de loading/erro tratados
- [ ] Testado manualmente
- [ ] Code review passado
- [ ] Deploy em produção funcionando

---

## Métricas de Progresso

### Fase 1 (MVP)
```
Total de tasks: ~40
Story points estimados: ~60h
Prazo alvo: 5 dias
```

### Por Sprint
```
Sprint 1.1: 9h
Sprint 1.2: 8h
Sprint 1.3: 14h
Sprint 1.4: 14h
Sprint 1.5: 9h
Sprint 1.6: 11h
Sprint 1.7: 9h
```

---

## Critérios de Sucesso do MVP

1. **Funcional**
   - [ ] 3 usuários conseguem logar
   - [ ] Criar e editar mapas
   - [ ] Ver em 3 views
   - [ ] Delegar tarefas
   - [ ] IA gera/expande

2. **Performance**
   - [ ] Load < 3s
   - [ ] 60fps no canvas

3. **Estabilidade**
   - [ ] 0 crashes em uso normal
   - [ ] Dados persistidos corretamente

4. **UX**
   - [ ] Intuitivo sem tutorial
   - [ ] Feedback em cada ação
