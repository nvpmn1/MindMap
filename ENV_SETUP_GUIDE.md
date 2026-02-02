# 🔧 Configuração de Variáveis de Ambiente

## ⚠️ IMPORTANTE
Os arquivos `.env` locais **NÃO são enviados para o GitHub** (estão no .gitignore por segurança).

Você precisa configurar as variáveis manualmente nos dashboards do **Render** e **Vercel**.

---

## 🎨 1. VERCEL (Frontend)

**URL do Projeto**: https://mind-map-three-blue.vercel.app  
**Dashboard**: https://vercel.com/dashboard

### Variáveis Obrigatórias

1. Acesse: **Project Settings** → **Environment Variables**
2. Adicione cada variável abaixo:

```env
VITE_API_URL=https://mindmap-hub-api.onrender.com/api/v1
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_APP_NAME=NeuralMap
VITE_APP_VERSION=1.0.0
```

3. **Environment**: Selecione `Production`, `Preview` e `Development` para todas
4. Clique em **Save**
5. **Redeploy** o projeto para aplicar as variáveis

---

## 🚀 2. RENDER (Backend)

**URL do Serviço**: https://mindmap-hub-api.onrender.com  
**Dashboard**: https://dashboard.render.com

### Variáveis Obrigatórias

1. Acesse: **Dashboard** → **mindmap-hub-api** → **Environment**
2. Adicione cada variável abaixo:

```env
PORT=8000
NODE_ENV=production

SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
SUPABASE_ANON_KEY=sua_anon_key_aqui

CLAUDE_API_KEY=sua_chave_claude_aqui
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7

FRONTEND_URL=https://seu-dominio.vercel.app

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
AI_RATE_LIMIT_MAX=10
```

3. Clique em **Save Changes**
4. O Render vai **automaticamente fazer redeploy** do serviço

---

## 🗄️ 3. SUPABASE (Database)

**URL do Projeto**: https://mvkrlvjyocynmwslklzu.supabase.co  
**Dashboard**: https://supabase.com/dashboard

### Verificar Configurações

1. Acesse: **Project Settings** → **API**
2. Confirme as URLs e keys:

```
Project URL: https://SEU_PROJETO.supabase.co
Anon Key: sua_anon_key_aqui
Service Role Key: sua_service_role_key_aqui
```

---

## 📋 Checklist de Deploy

- [ ] Variáveis configuradas no **Vercel**
- [ ] Variáveis configuradas no **Render**
- [ ] Vercel fez **redeploy** (vai pegar as novas env vars)
- [ ] Render fez **redeploy** automático
- [ ] Testar frontend: https://mind-map-three-blue.vercel.app
- [ ] Testar backend: https://mindmap-hub-api.onrender.com/api/v1/health
- [ ] Verificar CORS (frontend consegue chamar backend)
- [ ] Testar login com Supabase
- [ ] Testar AI Agent com Claude API

---

## 🔍 Como Testar

### 1. Teste o Backend (Render)
```bash
curl https://mindmap-hub-api.onrender.com/api/v1/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T...",
  "services": {
    "database": "connected",
    "ai": "configured"
  }
}
```

### 2. Teste o Frontend (Vercel)
1. Abra: https://mind-map-three-blue.vercel.app
2. Verifique se carrega sem erros no console
3. Tente fazer login
4. Teste criar um mapa mental
5. Teste o AI Agent

### 3. Verifique os Logs

**Render Logs**:
- Dashboard → mindmap-hub-api → Logs
- Procure por "❌ Invalid environment variables" (se aparecer, alguma variável está faltando)

**Vercel Logs**:
- Dashboard → Deployments → View Function Logs
- Procure por erros de CORS ou API calls falhando

---

## ⚠️ Troubleshooting

### Erro: "Missing Supabase environment variables"
- Certifique-se que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão no Vercel

### Erro: "Failed to fetch"
- Verifique se `VITE_API_URL` no Vercel aponta para: `https://mindmap-hub-api.onrender.com/api/v1`
- Verifique CORS no Render (`FRONTEND_URL` deve incluir o domínio do Vercel)

### Erro: "Anthropic API error"
- Verifique se `CLAUDE_API_KEY` está correto no Render
- Confirme que a chave é válida: https://console.anthropic.com

### Backend não inicia no Render
- Verifique se **todas** as variáveis obrigatórias estão configuradas
- Veja os logs para identificar qual variável está faltando
