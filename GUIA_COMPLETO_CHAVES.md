# 🔑 Guia Completo: Como Pegar Todas as Chaves e APIs

## ✅ O que você JÁ TEM configurado

- ✅ Supabase URL
- ✅ Supabase Anon Key
- ✅ Supabase Service Role Key
- ✅ Claude API Key

## ❌ O que FALTA (crítico para drill de backup)

### 1️⃣ **SENHA DO BANCO POSTGRES (URGENTE)**

#### Como pegar:

1. Acesse: https://supabase.com/dashboard/projects
2. Clique no projeto `mvkrlvjyocynmwslklzu`
3. Menu lateral esquerdo → **"Project Settings"** (ícone de engrenagem)
4. Clique em **"Database"**
5. Role até a seção **"Connection string"**
6. Você verá algo assim:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.mvkrlvjyocynmwslklzu.supabase.co:5432/postgres
   ```

#### ⚠️ IMPORTANTE:

- **Se você NÃO sabe a senha:** Você definiu ela quando criou o projeto (ou pode ter sido enviada por email)
- **Se perdeu a senha:** Você pode resetar em **"Database" → "Database Password" → "Reset database password"**
- ⚠️ **CUIDADO:** Resetar a senha vai quebrar todas as conexões existentes!

#### O que fazer depois:

Copie a string **COMPLETA** (com a senha real no lugar de `[YOUR-PASSWORD]`) e me envie aqui.

---

## 2️⃣ **BANCO DE RESTORE (STAGING) - OPCIONAL MAS RECOMENDADO**

Para validar backup/restore com segurança, o ideal é ter um **segundo projeto Supabase** (gratuito) para usar como staging.

#### Como criar (OPCIONAL - leva 2 minutos):

1. https://supabase.com/dashboard/projects
2. Clique em **"New Project"**
3. Nome: `mindmap-staging` (ou qualquer nome)
4. Região: **MESMA do projeto principal** (importante!)
5. Database Password: Anote em algum lugar seguro
6. Clique em **"Create new project"**
7. Aguarde ~2 minutos para provisionar
8. Depois de criado, pegue a connection string igual ao passo 1

#### Se não quiser criar staging agora:

Sem problemas! Vou pular o restore por enquanto e só testar o **backup** (que já é muito importante).

---

## 3️⃣ **OBSERVABILIDADE (OPCIONAL - pode fazer depois)**

Essas são **opcionais** mas recomendadas em produção:

### Sentry (monitoramento de erros)

1. Acesse: https://sentry.io/
2. Crie conta gratuita (se não tiver)
3. Crie novo projeto → Tipo: **React** (frontend) e **Node** (backend)
4. Copie o **DSN** que aparece

**Onde usar:**

- Backend: `SENTRY_DSN=https://...@sentry.io/...`
- Frontend: `VITE_SENTRY_DSN=https://...@sentry.io/...`

### Logtail (logs centralizados)

1. Acesse: https://betterstack.com/logs
2. Crie conta gratuita
3. Crie novo **Source** → Nome: `mindmap-backend` e outro `mindmap-frontend`
4. Copie os **Source Tokens**

**Onde usar:**

- Backend: `LOGTAIL_SOURCE_TOKEN=...`
- Frontend: `VITE_LOGTAIL_SOURCE_TOKEN=...`

---

## 📋 CHECKLIST RÁPIDO

### Para rodar LOCAL agora:

- [ ] Senha do Postgres do projeto principal
- [ ] (Opcional) Senha do Postgres do projeto staging

### Para produção depois:

- [ ] Sentry DSN (backend)
- [ ] Sentry DSN (frontend)
- [ ] Logtail Token (backend)
- [ ] Logtail Token (frontend)

---

## 🚀 Próximos Passos

Quando você tiver a **senha do Postgres**, me mande e eu:

1. ✅ Atualizo o `.env` automaticamente
2. ✅ Rodo o preflight do backup
3. ✅ Executo backup real do banco
4. ✅ (Se tiver staging) Testo restore completo
5. ✅ Valido com smoke tests
6. ✅ Rodo todo o quality gate
7. ✅ Te dou o checklist final para subir em produção

---

## ❓ Dúvidas Comuns

**P: E se eu resetar a senha do banco?**
R: Vai quebrar tudo temporariamente. Você vai precisar atualizar a senha em TODOS os lugares:

- `.env` local
- Variáveis de ambiente no Render (backend)
- Variáveis de ambiente no Vercel (se tiver)

**P: Preciso mesmo do staging?**
R: Não é obrigatório para desenvolvimento, mas é **extremamente recomendado** antes de qualquer operação de restore em produção.

**P: As chaves de observabilidade são obrigatórias?**
R: Não! Elas são opcionais. O sistema funciona perfeitamente sem elas. Mas em produção, vão te salvar quando algum erro acontecer.

---

## 📞 Me chame quando tiver:

Só me mande:

```
Senha Postgres principal: [sua-senha-aqui]
```

Ou se criou staging:

```
Senha Postgres principal: [sua-senha-aqui]
Senha Postgres staging: [sua-senha-staging]
```

E eu faço a mágica acontecer! 🪄
