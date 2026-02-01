Beleza — vamos “resetar” e começar **do zero**, mas com um plano **bem profissional**, do tipo que você cola no **Claude Opus 4.5** e ele já sabe exatamente **o que construir**, **como organizar o repo**, **quais telas**, **quais tabelas**, **como integrar IA + Supabase + Vercel + Render**, **o que é MVP vs. o que é fase 2**, e **qual é a definição de “tá perfeito”**.

Antes (rápido e importante): você já postou chaves secretas em mensagem anterior. **Rotacione** a key do Claude e a `service_role` do Supabase (não vou repetir nenhuma).

Abaixo está o **SCRIPT/ESPECIFICAÇÃO MASTER** (sem código) para você colar no Opus.

---

# SCRIPT PARA O CLAUDE OPUS 4.5 — “MindMap Hub Cooperativo” (Vercel + Render + Supabase)

## 0) Objetivo do Produto (North Star)

Construir um **hub cooperativo de mindmaps** para pesquisa/planejamento com:

* **3 usuários iniciais**: Guilherme, Helen, Pablo
* Mindmaps **compartilhados e editáveis em tempo real**
* **3 modos integrados** (mesma “verdade” de dados):

  1. **Mapa**
  2. **Lista**
  3. **Kanban**
* Tudo “agent-first”: o usuário clica em botões e a IA:

  * gera mapa, expande nó, cria tarefas, define dependências, cria resumo, sugere caminhos, delega pendências
* UX extremamente simples de usar, mas “powerful” (atalhos, fluidez, animações, pesquisa, templates)
* Não é produto comercial: foco em simplicidade, baixo custo, e deploy fácil.

**Inspiração funcional (não copiar UI):** ferramentas de mindmap colaborativas geralmente destacam colaboração em tempo real, compartilhamento e templates, além de comentários/organização. ([MindMeister][1])

---

## 1) Princípios de Design (para guiar tudo)

1. **Uma fonte de verdade**: Map/List/Kanban são “views” do mesmo conteúdo.
2. **Tudo linkável**: nó ↔ tarefa ↔ comentário ↔ referência ↔ pessoa.
3. **Colaboração visível**: presença, cursores, seleção, “quem tá mexendo em quê”.
4. **IA como copiloto e como agente**:

   * copiloto = chat e sugestões
   * agente = executa ações e atualiza o estado do projeto
5. **Caminho feliz em 30 segundos**:

   * abrir → escolher template → gerar mapa → delegar → ver Kanban automaticamente.
6. **“Didático por padrão”**: visual mostra o “porquê” (trail, breadcrumbs, highlights, summaries).

---

## 2) Arquitetura Técnica (simples e correta)

### 2.1 Componentes

* **Frontend (Vite + React)**: hospedar no Vercel
* **Backend (Node/Express ou Node/Fastify)**: hospedar no Render

  * Backend é obrigatório para chamar o Claude (chave nunca vai para o browser)
* **Banco/Auth/Realtime/Storage**: Supabase (Postgres + Realtime + Auth + Storage)

### 2.2 Por que assim?

* Vercel é ótimo para frontends (Vite) e build configurável. ([Vercel][2])
* Render é ótimo para “Web Service” com build/start commands simples e env vars. ([Render][3])
* Supabase dá:

  * **Postgres Changes**, **Broadcast**, **Presence** para realtime. ([Supabase][4])
  * **RLS (Row Level Security)** pra segurança séria e simples. ([Supabase][5])
  * Auth passwordless (Magic Link/OTP). ([Supabase][6])

### 2.3 “Agent Mode” do Claude

* O backend usa a API do Claude via **Messages API**.
* O sistema deve permitir selecionar model via env var e também listar modelos disponíveis (Models API). ([Claude API Docs][7])
* O modelo alvo é **Claude Opus 4.5** (ideal para agentes/código/fluxos complexos). ([Anthropic][8])

---

## 3) Experiência do Usuário (fluxos essenciais)

### 3.1 Onboarding “sem senha chata”

Você pediu “não bem login e senha”. A solução profissional é:

**Supabase Auth passwordless:**

* Entrar com **Magic Link** ou **OTP por email** (sem senha). ([Supabase][6])
* Configurar Redirect URLs no Supabase para Vercel + localhost. ([Supabase][9])

**A camada “perfil” que você quer (UX):**

* Depois de autenticar, o app mostra “Perfis/Personas” do workspace:

  * Guilherme / Helen / Pablo
* O usuário escolhe seu “perfil visual” (avatar/cor), mas o controle real é por Auth.
* Para simplificar, criar um “Workspace” fixo chamado **MindLab** e convidar só esses 3 e-mails.

### 3.2 Home

Home deve ter:

* “Continuar de onde parei”
* Botões de criação:

  * “Novo Mapa a partir de Template”
  * “Gerar Mapa com IA”
  * “Importar (texto/markdown)”
* Cards:

  * Mapas recentes
  * Pendências atribuídas a mim
  * Notificações

### 3.3 Editor do Mapa

Layout mental (wireframe textual):

* **TopBar**: Switch (Mapa | Lista | Kanban), busca global, botão “Gerar/Agente”, presença (bolinhas dos usuários), botão Share
* **Sidebar esquerda**: Workspaces, Mapas, Templates, Filtros (tags, status, dono)
* **Canvas central**: mindmap (zoom, pan, minimap, seleção múltipla)
* **Painel direito (Drawer)**: detalhes do nó/tarefa (descrição, comentários, anexos, links, histórico, “pergunte à IA”)
* **Dock inferior**: “Agent Console”: ações rápidas (Expandir, Resumir, Transformar em tarefas, Delegar, Criar experimento, etc.)

### 3.4 Lista e Kanban (totalmente integrados)

* “Lista” é uma visão hierárquica: nó → subtópicos → tarefas anexadas
* “Kanban” é visão de tarefas com colunas:

  * Backlog / Doing / Waiting / Done
* Qualquer mudança em um lugar reflete nos outros (mesmo id de item).

### 3.5 Pendências e Delegação (o core cooperativo)

Você descreveu “eu marco uma parte do mapa e delego para o outro”.

Implementar:

* Em qualquer nó: botão **“Delegar”**

  * escolher pessoa (Helen/Pablo/Guilherme)
  * escrever pedido rápido
  * definir prazo, prioridade, tipo (pesquisa, resumo, decisão, execução)
* Isso cria:

  1. **Task** atribuída ao usuário
  2. **Notification** para o usuário
  3. Badge no nó (“1 pendência”) + highlight visual quando o usuário abrir

Notificação precisa apontar exatamente:

* “Em que parte da árvore está”
* Caminho/breadcrumbs do nó
* Link “Abrir e focar no nó”

---

## 4) Tipos de Mapas (templates “insanos” + botões)

Criar “biblioteca de templates” que o usuário escolhe e a IA preenche:

1. **Pesquisa científica**

* Pergunta central → hipóteses → literatura → experimentos → métricas → riscos

2. **Leitura de paper**

* Contexto → método → resultados → limitações → replicação → ideias novas

3. **Plano de projeto**

* objetivos → entregáveis → timeline → riscos → dependências → checklist

4. **Kanban + mapa acoplado**

* nós geram tarefas automaticamente

5. **Mapa de decisão**

* opções → prós/contras → critérios → recomendação

6. **Mapa de estudo**

* módulos → exercícios → revisão espaçada

7. **Mapa de brainstorming “divergir e convergir”**

* muitas ideias → cluster → síntese

8. **Mapa de mitigação de pendências**

* problema → causas → ações → donos → prazos

9. **Mapa de escrita**

* tese → outline → evidências → referências → revisão

10. **Mapa “rede neural de conceitos”**

* nós altamente linkados com tags, backlinks e relações semânticas

Inspiração: plataformas como Whimsical enfatizam “templates” e colaboração como aceleração de trabalho. ([whimsical.com][10])

---

## 5) Sistema de IA (Agent Mode) — como funcionar na prática

### 5.1 “Ações” (botões) em vez de prompt livre

Usuário clica e a IA executa:

* **Gerar Mapa** (a partir de tema/objetivo)
* **Expandir Nó** (com subramos sugeridos)
* **Resumir Subárvore**
* **Converter Subárvore em Tarefas**
* **Encontrar contradições / lacunas**
* **Criar plano de experimento**
* **Criar roteiro de estudo**
* **Transformar mapa em relatório**
* **Criar checklist de ação**
* **Sugerir links entre nós distantes** (“rede”)

### 5.2 Agentes internos (multi-agente)

Orquestrador no backend cria subagentes:

* **Planner**: decide quais passos fazer
* **Researcher**: propõe conteúdo e estrutura
* **Critic**: valida consistência, evita alucinações
* **Project Manager**: cria tasks, donos, prazos
* **Librarian**: cuida de referências, links e anexos

Cada execução do agente gera:

* um “AI Run” com:

  * input (tema, nó selecionado, contexto)
  * output (mudanças propostas)
  * diffs aplicados (o que mudou no banco)
  * rastreabilidade (para desfazer)

### 5.3 Segurança de chave e modelos

* Toda chamada ao Claude sai do backend
* Nome do modelo e limites vêm de env vars
* Criar rota backend para “list models” (para debug) usando endpoint de models. ([Claude API Docs][11])

---

## 6) Realtime: presença, cursores, edições (sem virar um monstro)

### 6.1 O mínimo “uau” (MVP realtime)

Usar Supabase Realtime para:

* **Presence**: quem está online no mapa e qual nó está selecionando
* **Broadcast**: cursor/seleção/ações leves
* **Postgres Changes**: sincronizar updates reais do banco na UI

Supabase Realtime cobre Broadcast/Presence/Postgres Changes. ([Supabase][4])

### 6.2 Conflito de edição (primeiro simples, depois CRDT)

**MVP (3 pessoas):**

* estratégia “optimistic UI + last write wins”
* cada nó tem `updated_at` e `version`
* ao salvar: se version mudou, UI avisa e oferece “mesclar” (agent ajuda a mesclar)

**Fase 2 (escala e robustez):**

* adicionar CRDT (ex.: Yjs) para texto e estrutura (só quando precisar)

---

## 7) Modelo de Dados (Supabase) — conceitual, sem SQL aqui

Criar tabelas (nomes sugeridos):

### Núcleo

* `workspaces`
* `workspace_members` (papel: owner/editor/viewer)
* `profiles` (user_id do auth, nome, cor, avatar, preferências)
* `maps` (workspace_id, título, tipo, template_id, status)
* `nodes` (map_id, parent_id opcional, título, conteúdo, posição, tags, status)
* `edges` (map_id, from_node_id, to_node_id, label, type)
* `node_links` (links entre nós como “rede neural” sem precisar de edge visual)
* `views` (preferências por usuário: layout, zoom, colunas kanban)

### Trabalho e cooperação

* `tasks` (map_id, node_id opcional, título, status, assignee, due_date, priority)
* `comments` (node_id, author, body, mentions)
* `notifications` (user_id, type, payload, read_at)
* `activity_events` (audit log: quem fez o quê)

### IA

* `ai_runs` (tipo de ação, input, output, diffs, created_by)
* `ai_suggestions` (opcional: sugestões pendentes de aprovação)

### Arquivos e referências

* `files` (Storage): anexos de papers/imagens
* `references` (url, citation, note, linked_node_id)

**Storage + RLS:** Supabase Storage funciona com RLS para controlar acesso por workspace. ([Supabase][12])

---

## 8) Segurança e Acesso (RLS de verdade, sem dor)

Regras:

* Tudo é por workspace_id
* Usuário só vê workspace onde é membro
* `anon` NÃO pode acessar tabelas sem RLS — ativar RLS em tudo que está em `public` schema. Supabase alerta que tabela sem RLS no `public` pode ficar acessível via role `anon`. ([Supabase][13])
* RLS é “defense in depth”. ([Supabase][5])

Políticas (em linguagem de regra):

* `workspaces`: owner/editor/viewer
* `maps/nodes/edges/tasks/comments`: permitido se user é membro do workspace
* `tasks`: allow update se (assignee == user) ou user é owner/editor
* `notifications`: apenas o próprio user
* `ai_runs`: apenas membros do workspace (ou só owner)

---

## 9) UI/UX “moderna e fluida” — especificação visual

### 9.1 Animações e sensação

* Zoom/pan suave (com inertia)
* Expand/collapse de subárvore com animação
* “Focus mode”: ao clicar notificação, a câmera faz:

  * zoom out → pan → zoom in → highlight pulse no nó
* Drag de nós com “snap” opcional e linhas elásticas
* Microinterações:

  * hover mostra ações (expandir, delegar, linkar, comentar)
  * badges com contagem (tarefas, comentários, pendências)

### 9.2 Sistema de design

* Dark mode first
* Tipografia clara
* Cores por usuário (presença)
* Componentes:

  * Button, Chip, Badge, Toast, Modal, Drawer
* Estados vazios didáticos (“crie seu primeiro mapa…”)

---

## 10) Estrutura do Repositório (monorepo simples)

```
mindmap-hub/
  README.md
  docs/
    PRODUCT_SPEC.md
    UX_UI.md
    ARCHITECTURE.md
    DATABASE.md
    SECURITY_RLS.md
    AI_AGENTS.md
    DEPLOYMENT.md
    ROADMAP.md
    QA_TESTING.md
  frontend/
    (Vite + React)
  backend/
    (Node API: auth-aware + Claude calls)
  database/
    schema.sql
    seed.sql
    rls_policies.sql
  scripts/
    dev.sh / dev.ps1 (rodar tudo)
```

---

## 11) Deploy do zero (checklist operacional)

### 11.1 Supabase

* Criar projeto
* Rodar `schema.sql` + `rls_policies.sql`
* Configurar Auth:

  * Magic Link/OTP (passwordless) ([Supabase][6])
  * Configurar redirect URLs (localhost + domínio Vercel) ([Supabase][9])
* Habilitar Realtime nas tabelas necessárias (nodes, tasks, comments)
* Configurar buckets de Storage (se tiver anexos)

### 11.2 Render (backend)

* Criar Web Service a partir do repo
* Setar Build Command / Start Command conforme doc do Render ([Render][3])
* Variáveis de ambiente:

  * SUPABASE_URL
  * SUPABASE_SERVICE_ROLE_KEY (somente backend)
  * SUPABASE_ANON_KEY (se necessário)
  * CLAUDE_API_KEY (somente backend)
  * FRONTEND_URL (domínio Vercel) para CORS
  * MODEL_NAME (ex.: opus)
* Endpoint obrigatório:

  * `/health`

### 11.3 Vercel (frontend)

* Importar projeto
* Root Directory = `frontend`
* Node 20.x
* Build: `npm run build`, Output: `dist`
* Env vars (sem segredos de backend):

  * VITE_SUPABASE_URL
  * VITE_SUPABASE_ANON_KEY
  * VITE_API_URL = `https://<render>/api`
* Deploy
* Validar: abre + faz login + cria mapa

Vercel permite configurar build settings e tem doc específica para Vite. ([Vercel][14])

---

## 12) Requisitos de Qualidade (definição de “tá perfeito”)

### Performance

* abrir mapa grande sem travar
* updates realtime sem “flicker”
* debounce para salvar posição/drag

### Confiabilidade

* histórico de atividade
* “undo” por ação (pelo menos undo do agente)
* proteção contra perda de dados (autosave, versões)

### UX

* o usuário entende “onde clicar” sem tutorial
* notificações levam ao nó exato

### Segurança

* nenhum segredo no frontend
* RLS ativo em tudo
* workspace isolation

---

## 13) Roadmap (entregas por fase)

### Fase 1 — MVP (2–5 dias de dev focado)

* Auth passwordless
* Workspace único (3 pessoas)
* Mapa básico (criar/editar nós)
* Tasks (criar/atribuir)
* Views: Mapa + Lista + Kanban
* Notificações simples
* IA: gerar mapa + expandir nó + converter para tarefas
* Deploy Vercel + Render + Supabase

### Fase 2 — Colaboração “uau”

* Presence + cursor + seleção
* Comentários + mentions
* Deep links (link direto pro nó)

### Fase 3 — Research Hub

* References, anexos, bibliografia
* Mapas para paper reading e experiment planning
* “Relatório automático” gerado pela IA

### Fase 4 — Luxo visual

* animações avançadas
* modo apresentação do mapa
* timeline/heatmap de atividade

---

## 14) Prompt de Trabalho para o Claude (como ele deve executar)

“Você é o engenheiro principal. Execute por etapas. Em cada etapa:

1. definir arquivos e módulos
2. definir modelo de dados e RLS
3. definir endpoints do backend
4. definir componentes do frontend
5. implementar testes mínimos
6. documentar env vars e deploy
7. finalizar com checklist de validação

Não usar segredos hardcoded. Criar `.env.example` para frontend e backend. Garantir deploy sem erros em Node 20.”

---

## Observação final (prática)

Você pediu para **não ter código aqui**, então deixei tudo como especificação.
Se você quiser, eu adapto esse mesmo script para o formato “tickets de implementação” (tipo Jira/Notion), com **tarefas bem pequenas**, *Definition of Done* por tarefa, e ordem de execução (ideal para o Opus “ir ticando” e não se perder).

Quer que eu gere:

* **(A)** versão “tickets”, ou
* **(B)** versão “um único prompt gigante” (pronta pra colar e ele construir tudo em sequência)?

[1]: https://www.mindmeister.com/content/collaboration?utm_source=chatgpt.com "Collaboration"
[2]: https://vercel.com/docs/frameworks/frontend/vite?utm_source=chatgpt.com "Vite on Vercel"
[3]: https://render.com/docs/web-services?utm_source=chatgpt.com "Web Services"
[4]: https://supabase.com/docs/guides/realtime?utm_source=chatgpt.com "Realtime | Supabase Docs"
[5]: https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"
[6]: https://supabase.com/docs/guides/auth/auth-email-passwordless?utm_source=chatgpt.com "Passwordless email logins | Supabase Docs"
[7]: https://docs.anthropic.com/claude/reference/getting-started-with-the-api?utm_source=chatgpt.com "API Overview - Claude API Docs"
[8]: https://www.anthropic.com/claude/opus?utm_source=chatgpt.com "Claude Opus 4.5"
[9]: https://supabase.com/docs/guides/auth/redirect-urls?utm_source=chatgpt.com "Redirect URLs | Supabase Docs"
[10]: https://whimsical.com/diagrams?utm_source=chatgpt.com "Whimsical Diagrams, Flowcharts, and Mind Maps"
[11]: https://docs.anthropic.com/en/api/models-list?utm_source=chatgpt.com "List Models - Claude API Reference"
[12]: https://supabase.com/docs/guides/storage/security/access-control?utm_source=chatgpt.com "Storage Access Control | Supabase Docs"
[13]: https://supabase.com/docs/guides/api/securing-your-api?utm_source=chatgpt.com "Securing your API | Supabase Docs"
[14]: https://vercel.com/docs/builds/configure-a-build?utm_source=chatgpt.com "Configuring a Build"
