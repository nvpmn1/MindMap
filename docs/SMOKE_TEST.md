# ✅ Smoke Test (5–10 min)

## Pré-requisitos
- Backend rodando com `ALLOW_PROFILE_AUTH=true`.
- Frontend rodando em `http://localhost:5173`.

## Fluxos Críticos

### 1) Acesso por perfil (sem senha)
- Abrir `/login`.
- Selecionar perfil e entrar.
- Confirmar redirecionamento para `/dashboard`.

### 2) Criar mapa
- Clicar em **Novo Mapa**.
- Confirmar navegação para `/map/:id`.
- Ver nó central visível.

### 3) CRUD de nós
- Criar nó de ideia.
- Editar título/descrição (duplo clique).
- Arrastar nó (posição persiste).
- Deletar nó (removido da tela).

### 4) View List
- Alternar para **Lista**.
- Ver hierarquia exibida.
- Clicar em item e verificar seleção.

### 5) View Kanban
- Alternar para **Kanban**.
- Ver tarefas (nós tipo `task`).
- Avançar status e ver mudança de coluna.

### 6) IA (expandir)
- Selecionar nó.
- Abrir **AI Agent** e executar **Expandir**.
- Ver novos nós no canvas.

---

## Resultado Esperado
- Sem erros críticos no console.
- Nenhum travamento no canvas.
- Dados persistidos em backend (quando `mapId` é UUID).
