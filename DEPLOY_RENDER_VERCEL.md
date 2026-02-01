# 🚀 Guia Completo: Deploy Render + Vercel

## ✅ Pré-requisitos
- ✅ FIX_SCHEMA.sql já executado no Supabase
- ✅ Backend rodando local em http://localhost:3001
- ✅ Frontend rodando local em http://localhost:5173
- ✅ Credenciais Render e Vercel configuradas

---

## 📋 RENDER BACKEND - "Failed deploy"

### Problema Identificado
O deploy falhou porque as **variáveis de ambiente não foram configuradas corretamente**.

### Solução: 4 Passos Simples

#### **PASSO 1: Acessar Render Dashboard**
1. Acesse https://dashboard.render.com
2. Selecione o serviço "MindMap" que está com "Failed deploy"
3. Clique em **Settings** (engrenagem)

#### **PASSO 2: Configurar Variáveis de Ambiente**
Clique em **Environment** no menu lateral e adicione EXATAMENTE estas variáveis:

```
PORT=3001

SUPABASE_URL=https://mvkrlvjyocynmwslklzu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[Cole sua chave do Supabase]
SUPABASE_ANON_KEY=[Cole sua chave anon do Supabase]

ANTHROPIC_API_KEY=[Cole sua chave Claude]

FRONTEND_URL=https://mind-map-three-blue.vercel.app
```

**Como pegar as chaves Supabase:**
- Acesse https://app.supabase.com/projects
- Selecione projeto "MindMap"
- Settings → API
- Copie `Project URL` (para SUPABASE_URL)
- Copie `service_role key` (para SUPABASE_SERVICE_ROLE_KEY)
- Copie `anon public key` (para SUPABASE_ANON_KEY)

#### **PASSO 3: Verificar Build Command**
1. Em Settings → Build & Deploy
2. **Build Command** deve ser: `npm install`
3. **Start Command** deve ser: `node server.js`

#### **PASSO 4: Redeploy**
1. Clique em **Deployments** no menu
2. Clique nos 3 pontinhos (...) do último deploy
3. Selecione **Redeploy** ou **Manual Deploy**
4. Aguarde 2-3 minutos
5. Status deve virar **Live** (verde)

**Validar:** Acesse https://mindmap-api.onrender.com/health
- Deve retornar: `{"status":"ok",...}`

---

## 🎨 VERCEL FRONTEND - 404 NOT_FOUND

### Problema Identificado
Vercel está buscando arquivo `index.html` que não existe. Vite gera para pasta `dist/`.

### Solução: 5 Passos

#### **PASSO 1: Acessar Vercel Dashboard**
1. Acesse https://vercel.com/dashboard
2. Clique no projeto **mind-map**
3. Vá para **Settings**

#### **PASSO 2: Configurar Build Settings**
Em **Settings → Git** → **Root Directory**:
- Coloque: `frontend` (se ainda não estiver)

Em **Settings → Build & Development**:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### **PASSO 3: Configurar Environment Variables**
Clique em **Settings → Environment Variables** e adicione:

```
VITE_API_URL=https://mindmap-api.onrender.com
VITE_SUPABASE_URL=https://mvkrlvjyocynmwslklzu.supabase.co
VITE_SUPABASE_ANON_KEY=[Cole sua chave anon do Supabase]
```

#### **PASSO 4: Verificar vite.config.js**
Abra `c:\Users\gui_o\Desktop\MindMap\frontend\vite.config.js`

Deve ter:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
```

#### **PASSO 5: Fazer Commit e Push**
```bash
cd C:\Users\gui_o\Desktop\MindMap
git add .
git commit -m "Fix: production deployment configuration"
git push origin main
```

Vercel fará auto-deploy. Aguarde 1-2 minutos e verifique se o deploy ficou "Ready".

**Validar:** Acesse https://mind-map-three-blue.vercel.app
- Deve carregar a página inicial com os 3 botões de usuário

---

## 🔗 Configuração de Conectividade

### No arquivo `frontend/.env.production`
Certifique-se que existe:
```
VITE_API_URL=https://mindmap-api.onrender.com
```

### No arquivo `backend/.env` (Render)
As variáveis configuradas no passo anterior são suficientes.

---

## ✅ Checklist Final

- [ ] Supabase: FIX_SCHEMA.sql executado ✓
- [ ] Render: Variáveis de ambiente configuradas
- [ ] Render: Deploy retorna status "Live"
- [ ] Render: `/health` retorna JSON
- [ ] Render: `/api/users` retorna usuários
- [ ] Vercel: Build Settings corretos
- [ ] Vercel: Environment variables configuradas
- [ ] Vercel: Deploy retorna status "Ready"
- [ ] Vercel: Frontend carrega sem 404
- [ ] Frontend: Consegue logar em um dos 3 usuários
- [ ] Frontend: Consegue criar mindmap (POST /api/mindmaps)
- [ ] Frontend: Chat com IA funciona

---

## 🆘 Troubleshooting

### Render ainda mostra "Failed"
1. Clique em **Logs** e procure por error
2. Procure por `SUPABASE_URL is required` → faltam env vars
3. Procure por `listen EADDRINUSE` → porta já em uso
4. Solução: Clique em **Manual Deploy** novamente

### Vercel mostra 404
1. Clique em **Deployments** e verifique se build foi sucesso
2. Se build falhou, clique no deployment e veja os logs
3. Procure por erro de `npm run build`
4. Solução: Fazer novo push para main branch

### Frontend conecta mas não consegue chamar API
1. Abra DevTools (F12) → Console
2. Procure por erro de CORS
3. Verifique se VITE_API_URL está correto
4. Verifique se Render tem `FRONTEND_URL` apontando para Vercel

### POST /api/mindmaps falha mesmo após schema fix
1. No Render, redeploy o backend (pode estar com versão antiga)
2. Verifique se SUPABASE_SERVICE_ROLE_KEY está correto
3. Teste localmente: `npm run dev` no backend

---

## 📱 URLs Finais (após deploy)

- **Frontend**: https://mind-map-three-blue.vercel.app
- **Backend API**: https://mindmap-api.onrender.com
- **Health Check**: https://mindmap-api.onrender.com/health
- **Users API**: https://mindmap-api.onrender.com/api/users

---

## 🎯 Próximo Passo

Após confirmar tudo funcionando:
1. Abra https://mind-map-three-blue.vercel.app
2. Clique em um dos 3 usuários (ex: Guilherme)
3. Teste criar um novo MindMap
4. Teste conversar com IA
5. Confirme que tudo está perfeito! ✅
