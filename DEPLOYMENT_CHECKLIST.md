# 🎯 DEPLOYMENT CHECKLIST - MindMap Hub

## ✅ COMPLETADO

- [x] Git commit com todas as mudanças
- [x] Git push para main
- [x] Configuração Vercel criada (vercel.json)
- [x] .env.production criado (frontend e backend)
- [x] render.yaml configurado
- [x] DEPLOYMENT_GUIDE.md criado com instruções passo a passo

---

## 🚀 PRÓXIMOS PASSOS (Execute Agora!)

### 1️⃣ DEPLOY FRONTEND (Vercel) - 5 minutos

```powershell
cd C:\Users\gui_o\Desktop\MindMap\frontend
vercel --prod
```

**Alternativa rápida:**
```powershell
.\deploy.ps1
```

**O que vai acontecer:**
- Build do projeto
- Upload para Vercel
- Deploy automático
- URL: `https://mindmap-hub.vercel.app`

---

### 2️⃣ DEPLOY BACKEND (Render) - 10 minutos

1. Acesse: **https://dashboard.render.com**

2. Clique em **New** > **Web Service**

3. Conecte seu repositório GitHub:
   - Selecione: `seu-usuario/MindMap`
   - Autorize Render

4. Preencha:
   - **Name**: `mindmap-hub-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. Environment Variables (copie do `backend/.env.production`):
   ```
   PORT=3001
   NODE_ENV=production
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua-anon-key
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role
   ANTHROPIC_API_KEY=sk-ant-sua-chave
   CORS_ORIGIN=https://mindmap-hub.vercel.app
   ```

6. Clique **Deploy**
   - Aguarde 5-10 minutos
   - URL: `https://mindmap-hub-api.onrender.com`

---

### 3️⃣ CONFIGURAR SUPABASE - 15 minutos

**Se ainda não tiver:**

1. Acesse: **https://supabase.com**

2. New Project:
   - Project name: `mindmap-hub`
   - Region: South America (São Paulo)
   - Create password

3. SQL Editor > New Query:
   - Abra: `database/schema.sql`
   - Copie e cole tudo no editor
   - Clique Run

4. Repita com: `database/rls_policies.sql`

5. Settings > API:
   - Copie `Project URL`
   - Copie `anon public` key
   - Copie `service_role secret`

---

### 4️⃣ OBTER ANTHROPIC API KEY - 5 minutos

1. Acesse: **https://console.anthropic.com**

2. Sign up (se não tiver)

3. API Keys > Create Key

4. Copie a chave (salve em local seguro!)

---

### 5️⃣ CONFIGURAR VARIÁVEIS NO VERCEL

1. Acesse: **https://vercel.com/dashboard**

2. Selecione projeto `mindmap-hub`

3. Settings > Environment Variables:
   ```
   VITE_SUPABASE_URL = https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY = sua-anon-key
   VITE_API_URL = https://mindmap-hub-api.onrender.com/api/v1
   ```

4. Clique "Redeploy" na Deployments

---

## 🧪 TESTAR TUDO

### Frontend
```
Abra: https://mindmap-hub.vercel.app
```

**Deve mostrar:**
- ✅ Login screen
- ✅ Selecionar perfil
- ✅ Dashboard carregando
- ✅ Todos os links funcionando

### Backend (Health Check)
```powershell
Invoke-WebRequest https://mindmap-hub-api.onrender.com/api/v1/health
```

**Deve retornar:**
```json
{ "status": "ok" }
```

### Verificar IA
- Login
- Vá em Dashboard
- Clique no ícone IA (canto superior)
- Escreva uma mensagem
- IA deve responder ✅

---

## 📊 STATUS FINAL

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | 🚀 Deployando | https://mindmap-hub.vercel.app |
| Backend | ⏳ Aguardando | https://mindmap-hub-api.onrender.com |
| Database | 🔧 Configurando | Supabase Console |
| IA API | 🔑 Pendente | Anthropic Console |

---

## 🔗 LINKS IMPORTANTES

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **Supabase Console**: https://app.supabase.com
- **Anthropic Console**: https://console.anthropic.com
- **GitHub Repo**: Seu repositório

---

## 💡 DICAS

1. **Vercel deploy automático**: A cada push para `main`, Vercel faz deploy automático!

2. **Render deploy automático**: Igualmente, a cada push, Render faz rebuild!

3. **Não esqueça de setar env vars**: Sem elas, o app vai quebrar em produção

4. **Teste tudo localmente**: `npm run dev` antes de fazer push

5. **Monitor logs**: 
   - Vercel: Dashboard > Deployments > Logs
   - Render: Dashboard > Logs

---

## ⚠️ PROBLEMAS COMUNS

### "Build failed on Vercel"
- Verificar: `npm run build` funciona localmente?
- Ver logs: Vercel Dashboard > Deployments

### "Backend não responde"
- Verificar env vars no Render
- Ver logs: Render Dashboard
- Testar: `curl https://mindmap-hub-api.onrender.com/api/v1/health`

### "Erro 401 Supabase"
- Verificar SUPABASE_ANON_KEY
- Não confundir com service_role_key

### "IA não responde"
- Verificar ANTHROPIC_API_KEY no Render
- Testar se key é válida

---

## 🎉 SUCESSO!

Se tudo funcionou, seu app está **LIVE** e acessível pelo mundo! 🌍

Compartilhe com seus amigos:
```
🚀 MindMap Hub - Plataforma de Mapas Mentais com IA
Acesso: https://mindmap-hub.vercel.app
```

---

**Documentação completa**: Ver `DEPLOYMENT_GUIDE.md`
