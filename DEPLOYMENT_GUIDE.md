# 🚀 GUIA COMPLETO DE DEPLOYMENT

## ✅ O que foi feito

- [x] Git commit e push de todas as mudanças
- [x] Configuração Vercel.json criada
- [x] Arquivo .env.production para frontend
- [x] Arquivo .env.production para backend
- [x] render.yaml configurado

## 📋 PASSO 1: Deploy Frontend (Vercel)

### 1.1 Login no Vercel

```bash
vercel login
```

Siga as instruções no navegador e confirme.

### 1.2 Deploy automático

```bash
cd c:\Users\gui_o\Desktop\MindMap\frontend
vercel
```

**Respostas recomendadas:**
- Set up and deploy? → `Y`
- Which scope? → Sua conta/organização
- Detected project → `N` (criar novo)
- Project name → `mindmap-hub` (ou seu nome)
- Link to existing? → `N`
- Project directory → `./` (usar padrão)
- Build command → Use default? → `Y`
- Output directory → Use default? → `Y`

### 1.3 Configure variáveis de ambiente

Após o deploy, vá para: https://vercel.com/dashboard

1. Selecione o projeto `mindmap-hub`
2. Settings > Environment Variables
3. Adicione:
   - `VITE_SUPABASE_URL` = `https://seu-projeto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = Sua chave anon do Supabase
   - `VITE_API_URL` = `https://mindmap-hub-api.onrender.com/api/v1` (após criar backend)

### 1.4 Redeploy

```bash
vercel --prod
```

---

## 📋 PASSO 2: Deploy Backend (Render)

### 2.1 Login no Render

Acesse: https://render.com
Sign up ou Login com GitHub

### 2.2 Conectar GitHub

1. Dashboard > New >
2. Selecione: Web Service
3. Connect a GitHub repository
4. Selecione seu repositório `MindMap`
5. Autorize o Render

### 2.3 Configurar o serviço

**Build & Deploy Settings:**
- **Name**: `mindmap-hub-api`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Standard` (paga, recomendado)

### 2.4 Environment Variables

Adicione em "Environment":

```
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

ANTHROPIC_API_KEY=sk-ant-sua-chave

CORS_ORIGIN=https://mindmap-hub.vercel.app
```

### 2.5 Deploy

Clique em "Deploy"

Aguarde 3-5 minutos...

---

## 📋 PASSO 3: Configurar Supabase

Se ainda não tiver Supabase configurado:

### 3.1 Criar projeto

1. Acesse: https://supabase.com
2. Sign up ou Login
3. New Project
4. Fill in:
   - Project name: `mindmap-hub`
   - Database password: Gere uma senha forte
   - Region: `South America (São Paulo)` ou sua região
5. Create new project

### 3.2 Setup da Database

1. Vá em SQL Editor
2. Copie e cole o conteúdo de `database/schema.sql`
3. Execute o SQL
4. Copie e cole `database/rls_policies.sql`
5. Execute

### 3.3 Obter chaves

Settings > API:
- Copie `Project URL`
- Copie `anon public`
- Copie `service_role secret`

---

## 🔑 PASSO 4: Obter API Keys

### Anthropic Claude API

1. Acesse: https://console.anthropic.com
2. API Keys > Create Key
3. Copie e guarde em local seguro
4. Adicione ao Render em Environment Variables

---

## 🧪 PASSO 5: Testar

### Frontend
```
https://mindmap-hub.vercel.app
```

### Backend (Health Check)
```
https://mindmap-hub-api.onrender.com/api/v1/health
```

Deve retornar: `{ "status": "ok" }`

---

## 🔄 DEPOIS DO DEPLOY INICIAL

### Para fazer novo deploy após mudanças:

**Frontend (Vercel):**
```bash
cd frontend
git add .
git commit -m "Tua mensagem"
git push origin main
# Vercel faz deploy automático!
```

**Backend (Render):**
```bash
cd backend
git add .
git commit -m "Tua mensagem"
git push origin main
# Render faz deploy automático!
```

---

## ✨ Domínio Custom (Opcional)

### Vercel:
Settings > Domains > Add Domain

### Render:
Settings > Custom Domains

---

## 🚨 Troubleshooting

### "Build failed on Vercel"
- Verificar se `frontend/package.json` está ok
- Verificar environment variables
- Ver logs em Vercel Dashboard

### "Backend não responde"
- Verificar se Render rodou com sucesso
- Checkar logs em Render Dashboard
- Verificar CORS_ORIGIN nas env vars

### "Banco de dados vazio"
- Executar `database/schema.sql` novamente
- Verificar se SUPABASE_SERVICE_ROLE_KEY está correto

---

## 📊 Status Checklist

- [ ] Git push completo
- [ ] Vercel frontend deployado
- [ ] Render backend deployado
- [ ] Supabase configurado
- [ ] Environment variables adicionadas
- [ ] Database schema executado
- [ ] Testar /dashboard
- [ ] Testar /maps
- [ ] Testar /tasks
- [ ] Testar /settings

---

## 💾 Links Importantes

- **Frontend**: https://mindmap-hub.vercel.app
- **Backend**: https://mindmap-hub-api.onrender.com
- **GitHub**: seu-repo
- **Supabase**: https://app.supabase.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com

---

## 🎉 Pronto!

Seu app está no ar e acessível globalmente! 🚀
