# 🚀 SETUP RÁPIDO - MindMap

## 1️⃣ Pré-requisitos ✅
- Node.js v18+ instalado
- npm funcionando
- Credenciais do Supabase prontas
- Chave da IA Claude pronta

## 2️⃣ Iniciar os Servidores (ATUAL ✅)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Esperado: `🧠 MindMap Backend Server - Running on port 3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Esperado: `Local: http://localhost:5173`

## 3️⃣ Configurar Banco de Dados (PRÓXIMO ⏳)

### Opção A: Automático (Recomendado)
1. Abra: http://localhost:5173
2. Um modal deve aparecer: "🔧 Configurando Banco de Dados"
3. Clique em "Inicializar"
4. Aguarde ≈ 30 segundos
5. ✅ Pronto!

### Opção B: Manual (Se a automática falhar)

**Passo 1:** Abra o Editor SQL do Supabase
```
https://mvkrlvjyocynmwslklzu.supabase.co/project/mvkrlvjyocynmwslklzu/sql/new
```

**Passo 2:** Cole TODO o conteúdo de `database/schema.sql`

**Passo 3:** Clique em "RUN" (botão azul canto superior direito)

**Passo 4:** Aguarde a execução (canto inferior direito mostra "Query executed successfully")

## 4️⃣ Habilitar Realtime

1. Dashboard Supabase: https://mvkrlvjyocynmwslklzu.supabase.co
2. Menu esquerdo: **Database** → **Publications**
3. Clique em **supabase_realtime**
4. **Toggle ON** (ativar):
   - ✅ nodes
   - ✅ comments
   - ✅ activities
5. Clique em **Save**

## 5️⃣ Testar Aplicação

1. Abra: http://localhost:5173
2. Selecione um usuário (Guilherme, Helen ou Pablo)
3. Veja o Mapa Mental aparecer
4. Teste criando um novo nó (botão "+" verde)

## 6️⃣ Testar Colaboração

**Para testar em tempo real:**
1. Abra duas abas do navegador
2. Aba 1: http://localhost:5173 → Guilherme
3. Aba 2: http://localhost:5173 → Helen (em outra aba)
4. Em Aba 1: Crie um novo nó
5. Aba 2: Deve atualizar instantaneamente ✨

## 7️⃣ Testar IA

1. Clique no robô 🤖 (canto inferior direito)
2. Escreva: "Gere um mapa mental sobre inteligência artificial"
3. Aguarde a resposta
4. Clique em "Adicionar ao mapa"

## 🎉 Sucesso!

Se tudo funcionou:
- ✅ Frontend rodando
- ✅ Backend rodando
- ✅ Banco de dados criado
- ✅ Realtime ativo
- ✅ IA respondendo

---

## 🆘 Se algo der errado...

### Backend não inicia
```bash
# Limpar cache e reinstalar
rm -r node_modules
npm install
npm run dev
```

### Frontend branco vazio
- Abra DevTools (F12)
- Veja Console para erros
- Verifique se Backend está respondendo

### Banco de dados vazio
- Verifique se executou schema.sql
- Tente novamente clicando em "Tentar Novamente"
- Verifique os logs do backend

### IA não responde
- Verifique a chave no backend/.env
- Teste com: http://localhost:3001/health

---

**Perguntas?** Verifique os logs dos terminais onde npm run dev está rodando.
