# 🎯 LOCAL DEVELOPMENT GUIDE

## ⚡ Início Rápido (30 segundos)

### Opção 1: Script Automático (Recomendado)

```powershell
cd C:\Users\gui_o\Desktop\MindMap
.\start-dev.ps1
```

Pronto! Frontend + Backend rodando em:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Opção 2: Manual (Em dois terminais)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🗄️ Banco de Dados

### Dados Locais (Já Configurado)

- ✅ **localStorage**: Dados de usuários, mapas, tarefas
- ✅ **Supabase Mock**: URLs e chaves configuradas em `.env.local`
- ✅ **IA Local**: Respostas simuladas sem API externa

Nada adicional precisa ser configurado para começar a testar!

### Adicionar Supabase Real (Opcional)

Se quiser usar banco de dados real local:

**1. Instalar Supabase CLI:**
```bash
npm install -g supabase
```

**2. Iniciar Supabase local:**
```bash
supabase start
```

**3. Executar schema:**
```bash
supabase db push
```

**4. Atualizar `.env.local` do backend:**
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJ... (gerada pelo CLI)
```

---

## 🧪 Testar Tudo

### 1. Login
```
Abra: http://localhost:5173
Selecione um perfil:
  • Guilherme
  • Helen
  • Pablo
```

### 2. Navegar
- ✅ Dashboard → Check estatísticas
- ✅ Meus Mapas → Criar novo mapa
- ✅ Tarefas → Adicionar tarefa
- ✅ Configurações → Mudar tema/preferências

### 3. Editor de Mapas
- ✅ Arrastar nós
- ✅ Conectar com linhas
- ✅ Usar IA (painel direito)

### 4. IA
- Abra o Chat (ícone 🤖 no header)
- Escreva uma pergunta
- IA responde com sugestões locais

---

## 🔄 Workflow de Desenvolvimento

### Para cada mudança:

```bash
# 1. Fazer mudança no código
# Editor VS Code já atualiza automaticamente (Hot Reload)

# 2. Testar no navegador
# Já atualizado em tempo real!

# 3. Se adicionar nova dependência:
npm install novo-pacote

# 4. Quando pronto:
git add .
git commit -m "Tua mensagem"
git push
# Vercel/Render fazem deploy automático!
```

---

## 📊 Arquitetura Local

```
Frontend (React + Vite)
    ↓
localhost:5173
    ↓
    ├─→ API Backend (Express)
    │       ↓
    │   localhost:3001/api/v1
    │       ↓
    │   ├─→ Supabase (localhost:54321)
    │   │   └─→ PostgreSQL
    │   │
    │   └─→ Anthropic API (opcional)
    │
    └─→ LocalStorage (cache/dados)
```

---

## 🐛 Troubleshooting

### Porta já em uso

```powershell
# Encontrar processo na porta 3001:
Get-NetTCPConnection -LocalPort 3001

# Matar processo:
Stop-Process -Id [PID] -Force
```

### Backend não conecta

- Verificar: `http://localhost:3001/api/v1/health`
- Ver logs no terminal do backend
- Checkar `.env.local`

### Frontend vazio/branco

- Abrir DevTools (F12)
- Ver console para erros
- Limpar cache: CTRL+SHIFT+DEL

### IA não responde

- Verificar se `USE_LOCAL_AI=true` em `backend/.env.local`
- Logs devem mostrar "Using LocalAISimulator"
- Chat deve funcionar offline

---

## 💾 Dados Persistem?

**Localmente:**
- ❌ Mapas não persistem (localStorage apenas na sessão)
- ❌ Tarefas não persistem
- ✅ Perfil persiste (dados do usuário logado)

**Para persistência real:**
- Configure Supabase (ver seção acima)
- Modifique componentes para salvar no Supabase
- Migre de localStorage para API

---

## 🚀 Performance Local

- Frontend: **Vite** - Rebuild em <100ms
- Backend: **Nodemon** - Restart em <1s
- IA: **Local** - Resposta em <500ms
- Cache: **localStorage** - Instantâneo

---

## 📦 Adicionar Novo Feature

### Backend:

1. Criar rota em `backend/src/routes/`
2. Criar serviço em `backend/src/services/`
3. Testar em http://localhost:3001

### Frontend:

1. Criar componente em `frontend/src/components/`
2. Usar hook do store (Zustand)
3. Chamar API em `frontend/src/services/`
4. Testar em http://localhost:5173

### IA:

1. Adicionar método em `aiAgent.ts`
2. Ou modificar `LocalAISimulator`
3. Testar no Chat Panel

---

## 🔗 Links Rápidos

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| API Health | http://localhost:3001/api/v1/health |
| Supabase Local | http://localhost:54321 |
| DevTools | F12 |
| Terminal Backend | Nova janela PowerShell |
| Terminal Frontend | Nova janela PowerShell |

---

## ✨ Próximas Etapas

Após testar localmente e melhorar:

1. **Commit mudanças:**
   ```bash
   git add .
   git commit -m "🚀 Nova feature"
   git push
   ```

2. **Deploy Automático:**
   - Vercel faz deploy do frontend
   - Render faz deploy do backend

3. **Monitorar:**
   - Dashboard Vercel: https://vercel.com/dashboard
   - Dashboard Render: https://dashboard.render.com

---

## 💡 Dicas Pro

- Use **VS Code Extensions**:
  - `ES7+ React/Redux/React-Native snippets`
  - `Tailwind CSS IntelliSense`
  - `Better Comments`

- **Atalhos úteis:**
  - `CTRL+K CTRL+C` = Comentar código
  - `SHIFT+ALT+F` = Formatar código
  - `F2` = Renomear variável

- **Git workflow:**
  - `git log --oneline -10` = Ver últimos commits
  - `git diff` = Ver mudanças
  - `git status` = Ver status

---

**Boa sorte com o desenvolvimento! 🎉**
