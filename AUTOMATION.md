# 🚀 MindMap Automation Deployment

## Visão Geral

Você agora tem **automação completa** para todos os seus serviços:

- **Vercel (Frontend)** - Deploy automático com um comando
- **Render (Backend)** - Deploy automático via Git push
- **Supabase (Database)** - Pré-configurado e pronto

## Como Usar

### Opção 1: Python Automation (Recomendado)

```bash
# Na raiz do projeto
python deploy.py
```

**O que faz:**
- ✅ Checa status do Render
- ✅ Faz push para GitHub (triggers Render)
- ✅ Valida Supabase
- ✅ Aguarda services ficarem prontos
- ✅ Verifica Frontend e Backend

**Output:**
```
🚀 MINDMAP AUTOMATION DEPLOYMENT
============================================================

📦 STEP 1: Backend Deployment
   ✅ Backend push triggered - Render will redeploy

💾 STEP 2: Supabase Configuration
   ✅ Supabase project: mvkrlvjyocynmwslklzu

⏳ STEP 3: Waiting for services to be ready...
   [Automatic retry loop...]

🎨 STEP 4: Frontend Verification
   ✅ Frontend is live and responsive

🔗 LIVE LINKS:
   Frontend: https://mind-map-three-blue.vercel.app
   Backend: https://mindmap-hub-api.onrender.com/api/v1/health
   Supabase: https://app.supabase.com/project/mvkrlvjyocynmwslklzu
```

### Opção 2: Verificação Rápida

```bash
# Verificar status sem fazer deploy
python deploy.py --check-only
```

### Opção 3: Deploy Específico

```bash
# Deploy só frontend
vercel --prod

# Deploy só backend
cd backend && npm run build && git add . && git commit -m "update" && git push

# Build local sem deploy
npm run build
```

## Fluxo Automático Simplificado

### Para Fazer Qualquer Mudança:

#### 1. **Frontend** (React/TypeScript)

```bash
# Fazer mudanças em frontend/src/...

# Build local para testar
cd frontend
npm run build

# Deploy automático
cd ../
python deploy.py
```

#### 2. **Backend** (Node/Express)

```bash
# Fazer mudanças em backend/src/...

# Build local para testar
cd backend
npm run build

# Deploy automático
cd ../
git add .
git commit -m "Sua mensagem"
git push origin main
# Render vai detectar automaticamente!
```

#### 3. **Database** (Supabase)

```bash
# Fazer mudanças diretamente no dashboard:
# https://app.supabase.com/project/mvkrlvjyocynmwslklzu
```

## Arquivos de Automação

| Arquivo | Descrição |
|---------|-----------|
| `deploy.py` | Script Python para automação completa |
| `deploy.ps1` | Script PowerShell (alternativo) |
| `.env` | Variáveis locais (NÃO commitado) |
| `.vercelignore` | Ignora backend/docs no Vercel |
| `.gitignore` | Protege .env e arquivos sensíveis |

## URLs dos Serviços

### Production (Ao Vivo)

| Serviço | URL |
|---------|-----|
| **Frontend** | https://mind-map-three-blue.vercel.app |
| **Backend** | https://mindmap-hub-api.onrender.com/api/v1 |
| **API Health** | https://mindmap-hub-api.onrender.com/api/v1/health |
| **Supabase** | https://app.supabase.com/project/mvkrlvjyocynmwslklzu |
| **GitHub** | https://github.com/nvpmn1/MindMap |

### Development (Local)

```bash
# Frontend
npm run dev        # http://localhost:5173

# Backend
npm run dev        # http://localhost:3001

# Database
# Use o Supabase CLI ou dashboard
```

## Monitoramento

### Verificar Status Real-Time

```bash
# Abrir dashboards
start https://vercel.com/dashboard
start https://dashboard.render.com
start https://app.supabase.com/
```

### Ver Logs

```bash
# Vercel
# Dashboard → Deployments → Ver logs

# Render
# Dashboard → mindmap-hub-api → Logs

# Local
npm run dev         # mostra logs no console
```

## Troubleshooting

### Backend Não Responde (404)

```bash
# Renderestá em warmup (demora 2-5 min após deploy)
# Ou há erro de TypeScript

# Verificar:
cd backend
npm run build        # procura por erros
```

### Frontend Mostra Conteúdo Antigo

```bash
# Limpar cache Vercel
python deploy.py     # redeploy automático

# Ou:
vercel --prod --force
```

### Supabase Connection Error

```bash
# Verificar variáveis de ambiente
echo $env:VITE_SUPABASE_URL
echo $env:VITE_SUPABASE_ANON_KEY

# Ou ir direto ao dashboard
start https://app.supabase.com/project/mvkrlvjyocynmwslklzu/settings/api
```

## Próximos Passos

1. **Fazer mudanças** no código
2. **Testar localmente** com `npm run dev`
3. **Fazer commit** com `git commit -m "descricao"`
4. **Fazer push** com `git push origin main`
5. **Pronto!** Services atualizam automaticamente

## Ambiente Completo

```
┌─────────────────────────────────────────┐
│         MindMap Automation              │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (React)  ─→  Vercel          │
│      ✅ Deploy automático                │
│                                         │
│  Backend (Node)    ─→  Render          │
│      ✅ Deploy via Git                  │
│                                         │
│  Database (SQL)    ─→  Supabase        │
│      ✅ Pré-configurado                 │
│                                         │
│  GitHub            ─→  Hub Central     │
│      ✅ Triggers automáticos            │
│                                         │
└─────────────────────────────────────────┘
```

---

**Status:** ✅ 100% Operacional
**Last Update:** 2026-02-02
**Version:** 2.0.2
