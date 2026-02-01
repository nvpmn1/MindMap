# 📚 Guia Git - Push para Deploy Automático

## ✅ Já tem Git configurado?

```bash
# Verificar status do repositório
cd C:\Users\gui_o\Desktop\MindMap
git status
```

Se aparecer `fatal: not a git repository` → pule para "INICIALIZAR GIT"

---

## 🆕 INICIALIZAR GIT (se ainda não tem)

```bash
cd C:\Users\gui_o\Desktop\MindMap
git init
git add .
git commit -m "Initial commit: MindMap collaborative platform"
```

---

## 📤 FAZER DEPLOY AUTOMÁTICO (Vercel + Render)

### Passo 1: Commit suas mudanças
```bash
cd C:\Users\gui_o\Desktop\MindMap
git add .
git commit -m "fix: production environment variables and build config"
```

### Passo 2: Push para GitHub
```bash
# Se ainda não tem remote configurado:
git remote add origin https://github.com/SEU_USUARIO/mindmap.git

# Se já tem configurado, apenas faça push:
git push origin main
```

### ⚠️ Não tem conta GitHub?

**Siga estes passos:**

1. Acesse https://github.com/signup
2. Crie uma conta gratuita
3. Crie um novo repositório vazio chamado `mindmap`
4. Não adicione nenhum arquivo (deixe vazio)
5. Copie o comando de setup que GitHub fornece
6. Cole no terminal PowerShell (em `C:\Users\gui_o\Desktop\MindMap`)

**Exemplo:**
```bash
git remote add origin https://github.com/seu-usuario/mindmap.git
git branch -M main
git push -u origin main
```

---

## 🔄 CICLO DE DEPLOY AUTOMÁTICO

Após fazer `git push origin main`:

1. **Vercel** detecta automaticamente
   - Deploy inicia automaticamente
   - Aguarde 1-2 minutos
   - Acesse https://vercel.com/dashboard para acompanhar

2. **Render** (se configurado com GitHub)
   - Se conectou ao repositório GitHub, faz deploy automático
   - Se não, faça Manual Deploy em https://dashboard.render.com

---

## 🧪 TESTAR APÓS DEPLOY

```bash
# Terminal 1: Backend Local (para testar local)
cd C:\Users\gui_o\Desktop\MindMap\backend
npm run dev

# Terminal 2: Frontend (aponta para prod backend)
cd C:\Users\gui_o\Desktop\MindMap\frontend
npm run build  # Simula build de produção

# Para testar realmente a produção:
# Frontend: https://mind-map-three-blue.vercel.app
# Backend: https://mindmap-api.onrender.com/health
```

---

## 📋 Checklist de Deploy

- [ ] FIX_SCHEMA.sql executado no Supabase
- [ ] Render: Variáveis de ambiente configuradas
- [ ] Vercel: Build settings corretos (root dir = "frontend")
- [ ] GitHub: Repositório criado e configurado
- [ ] GitHub: Primeiro push feito (`git push origin main`)
- [ ] Vercel: Deploy automático iniciou
- [ ] Render: Backend online (`/health` retorna JSON)
- [ ] Frontend: Carrega sem 404
- [ ] Frontend: Consegue chamar API do Render
- [ ] Funcionalidade: Criar mindmap funciona
- [ ] Funcionalidade: Chat com IA funciona

---

## 🆘 Problemas Comuns

### "fatal: not a git repository"
Solução:
```bash
cd C:\Users\gui_o\Desktop\MindMap
git init
git add .
git commit -m "Initial commit"
```

### "Permission denied" ao fazer push
Solução: Gerar token GitHub
1. Acesse https://github.com/settings/tokens
2. Gere um "Personal Access Token"
3. Use o token em vez de senha

### "Vercel deploy failed"
Solução: Verificar logs
1. Acesse https://vercel.com/dashboard
2. Clique no projeto
3. Vá em "Deployments"
4. Clique no deploy falhado
5. Verifique os logs (aba "Build Logs")

---

## 🎯 Resumo Rápido (TL;DR)

```bash
# 1. Estando em C:\Users\gui_o\Desktop\MindMap

# 2. Commit tudo
git add .
git commit -m "Production config"

# 3. Push
git push origin main

# 4. Aguarde 2-3 minutos

# 5. Verifique
# Frontend: https://mind-map-three-blue.vercel.app
# Backend: https://mindmap-api.onrender.com/health
```

**Feito!** Tanto Vercel quanto Render fazem deploy automático após cada push.
