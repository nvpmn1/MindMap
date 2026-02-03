# ===========================================
# 🚀 GUIA RÁPIDO DE CONFIGURAÇÃO - MINDMAP HUB
# ===========================================

## 📋 VISÃO GERAL

Este projeto está **100% funcional em modo demo** sem necessidade de configurar Supabase.
A IA funciona localmente, os dados são salvos no localStorage, e todas as funcionalidades
estão disponíveis para teste imediato.

---

## ⚡ INÍCIO RÁPIDO (5 segundos)

```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173
Selecione um perfil e comece a usar!

---

## 🔧 CONFIGURAÇÃO COMPLETA (Produção)

### 1. Supabase (Banco de dados)

1. Acesse https://supabase.com e crie uma conta
2. Crie um novo projeto
3. Vá em "SQL Editor" e execute o arquivo `database/schema.sql`
4. Vá em "Authentication > URL Configuration" e configure:
   - Site URL: `http://localhost:5173` (dev) ou sua URL de produção
   
5. Copie as chaves em "Settings > API":
   - Project URL
   - anon/public key

6. Crie o arquivo `frontend/.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 2. Backend (API + IA)

1. Obtenha uma API key da Anthropic: https://console.anthropic.com

2. Configure as variáveis de ambiente do backend:
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
ANTHROPIC_API_KEY=sua-claude-api-key
CORS_ORIGIN=http://localhost:5173
```

3. Execute o backend:
```bash
cd backend
npm install
npm run dev
```

### 3. Deploy na Vercel (Frontend)

```bash
npm install -g vercel
cd frontend
vercel
```

Configure as variáveis de ambiente no painel da Vercel.

### 4. Deploy no Render (Backend)

1. Conecte seu repositório GitHub ao Render
2. Configure as variáveis de ambiente
3. Deploy automático!

---

## 🎯 FUNCIONALIDADES DISPONÍVEIS

### ✅ Funcionando Agora (Demo Mode)
- [x] Login com perfis de demonstração
- [x] Dashboard completo com estatísticas
- [x] Página "Meus Mapas" com grid/list view
- [x] Página "Tarefas" com Kanban e list view
- [x] Configurações completas
- [x] IA com respostas inteligentes (simulação local)
- [x] Editor de mapas mentais
- [x] Tema escuro/claro
- [x] Animações e transições

### 🔜 Requer Configuração
- [ ] Persistência real no Supabase
- [ ] Autenticação com Google/GitHub
- [ ] Colaboração em tempo real
- [ ] IA com Claude (Anthropic API)

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### Erro: "Missing Supabase environment variables"
O app funciona sem Supabase em modo demo. Para usar Supabase real,
configure as variáveis de ambiente conforme o guia acima.

### Erro 404 nas páginas
Todas as rotas estão configuradas:
- `/login` - Página de login
- `/dashboard` - Dashboard principal
- `/maps` - Lista de mapas
- `/tasks` - Lista de tarefas
- `/settings` - Configurações
- `/map/:id` - Editor de mapa

### IA não responde
A IA local está configurada para funcionar sem backend.
Se quiser usar Claude, configure a API da Anthropic no backend.

---

## 📁 ESTRUTURA DO PROJETO

```
MindMap/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── stores/      # Zustand stores
│   │   ├── services/    # Serviços (AI, API)
│   │   └── lib/         # Utilitários
│   └── .env.example     # Template de configuração
│
├── backend/           # Express + TypeScript
│   └── src/
│       ├── routes/      # Rotas da API
│       ├── ai/          # Integração Claude
│       └── services/    # Serviços
│
└── database/          # Scripts SQL
    ├── schema.sql       # Schema principal
    └── rls_policies.sql # Políticas de segurança
```

---

## 🎨 TECNOLOGIAS

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Estado**: Zustand (persistência local)
- **UI**: shadcn/ui, Framer Motion
- **Mapas**: ReactFlow (@xyflow/react)
- **Backend**: Express, Anthropic Claude
- **Database**: Supabase (PostgreSQL)

---

## 📞 SUPORTE

Desenvolvido com 💙 para fins educacionais.
