# 🚀 MindMap - Guia de Correção Completo

## ⚠️ PROBLEMA IDENTIFICADO

O banco de dados no Supabase está com colunas faltando. Precisamos executar um SQL para corrigir.

---

## 📋 PASSO 1: Executar SQL no Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login e selecione o projeto **MindMap**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. **COPIE E COLE TODO O CONTEÚDO** do arquivo `FIX_SCHEMA.sql` que está na pasta do projeto
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Você deve ver a mensagem: `Schema fixed successfully!`

---

## 📋 PASSO 2: Iniciar os Servidores (Já estão rodando!)

### Backend (porta 3001)
```powershell
# Já está rodando! Para reiniciar:
node C:\Users\gui_o\Desktop\MindMap\backend\server.js
```

### Frontend (porta 5173)
```powershell
# Já está rodando! Para reiniciar:
cd C:\Users\gui_o\Desktop\MindMap\frontend
npm run dev
```

---

## 📋 PASSO 3: Testar a Aplicação

Acesse: **http://localhost:5173**

1. Você deve ver a página inicial com 3 perfis (Guilherme, Helen, Pablo)
2. Clique em um perfil para selecionar
3. Teste criar um novo mapa mental
4. Teste a IA (botão de chat no canto inferior direito)

---

## 🔧 URLs dos Serviços

| Serviço | URL |
|---------|-----|
| Frontend Local | http://localhost:5173 |
| Backend Local | http://localhost:3001 |
| Supabase Dashboard | https://supabase.com/dashboard |
| Vercel (Frontend Produção) | https://mind-map-three-blue.vercel.app |
| Render (Backend Produção) | https://mindmap-kpf1.onrender.com |

---

## 🔑 Credenciais (Salvas nos arquivos .env)

### Supabase
- **URL**: https://mvkrlvjyocynmwslklzu.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Claude AI
- **API Key**: sk-ant-api03-LlVl... (configurada no backend)

---

## ❌ Se algo não funcionar

### Backend não inicia
```powershell
# Matar processos node
Get-Process node | Stop-Process -Force
# Reiniciar
node C:\Users\gui_o\Desktop\MindMap\backend\server.js
```

### Frontend não inicia
```powershell
# Ir para pasta frontend
cd C:\Users\gui_o\Desktop\MindMap\frontend
# Reinstalar dependências se necessário
npm install
# Iniciar
npm run dev
```

### Erro de banco de dados
- Execute o SQL do arquivo `FIX_SCHEMA.sql` no Supabase SQL Editor

---

## ✅ Status Atual

- [x] Supabase conectado e funcionando
- [x] Usuários criados (Guilherme, Helen, Pablo)
- [x] Backend rodando na porta 3001
- [x] Frontend rodando na porta 5173
- [ ] **PENDENTE: Executar FIX_SCHEMA.sql no Supabase**

---

**Depois de executar o SQL, tudo vai funcionar!** 🎉
