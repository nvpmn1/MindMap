# 🔧 INSTRUÇÕES - ARRUMAR BANCO DE DADOS E BOTÕES

## ⚠️ IMPORTANTE: VOCÊ PRECISA EXECUTAR ISTO NO SUPABASE

### Opção 1: Se o banco está VAZIO (Recomendado - Mais Fácil)

1. Abra [Supabase](https://app.supabase.com/)
2. Vá para **SQL Editor** > **+ New Query**
3. Copie **TUDO** do arquivo `SCHEMA.sql` (no seu projeto local)
4. Cole no editor
5. Clique em **Run**
6. ✅ Pronto! O banco está criado com todas as colunas

### Opção 2: Se o banco JÁ TEM DADOS (Cuidado - Pode perder dados)

1. Abra [Supabase](https://app.supabase.com/)
2. Vá para **SQL Editor** > **+ New Query**
3. Copie **TUDO** do arquivo `SCHEMA_UPDATE.sql` (no seu projeto local)
4. Cole no editor
5. Clique em **Run**
6. ✅ Pronto! Adicionadas as colunas faltantes

---

## ✅ O QUE FOI ARRUMADO NO CÓDIGO

### Frontend (.env criado)
```
VITE_API_URL=http://localhost:3001/api
```
✅ Agora o frontend sabe para onde enviar as requisições

### API (api.js melhorado)
- ✅ Tratamento de erros melhorado
- ✅ Suporta respostas com erro sem crash
- ✅ Logs mais descritivos

### Componentes
- ✅ HomePage.jsx - Botão de seleção de perfil funciona
- ✅ Sidebar.jsx - Botão "Novo Mapa Mental" chamando a API corretamente
- ✅ Todos os `cursor-pointer` adicionados
- ✅ Cores Tailwind corretas (sem classes inválidas)

### Banco de Dados (SCHEMA.sql)
Agora contém:
- ✅ Coluna `visibility` em mindmaps
- ✅ Coluna `type` em nodes
- ✅ Colunas `position_x`, `position_y` em nodes
- ✅ Coluna `order_index` em nodes
- ✅ Coluna `assigned_to` em nodes
- ✅ Coluna `created_by` em nodes
- ✅ 3 usuários de exemplo pré-criados
- ✅ Row Level Security (RLS)
- ✅ Índices para performance
- ✅ Triggers automáticos de updated_at

---

## 🚀 PASSOS PARA TESTAR

### 1. Certificar-se que está tudo rodando
```
Backend:  http://localhost:3001   ✅
Frontend: http://localhost:5173   ✅
Supabase: Online                   ✅
```

### 2. Executar SQL no Supabase
- Copie o SQL completo do `SCHEMA.sql`
- Cole e execute no Supabase SQL Editor

### 3. Atualizar o Frontend (cache)
```javascript
// No console do navegador (F12):
localStorage.clear();
location.reload();
```

### 4. Testar os botões

#### Na página inicial:
1. Clique em um perfil (Guilherme, Helen, Paulo)
2. Clique em "Começar agora"
3. ✅ Deve levar você para a página do mapa

#### Na barra lateral:
1. Veja o botão "+ Novo Mapa Mental"
2. Clique nele
3. ✅ Deve criar um novo mapa
4. ✅ Deve abrir automaticamente

#### No mapa:
1. Clique em "+ Adicionar nó"
2. ✅ Deve criar um novo nó
3. Clique no nó > "Editar"
4. ✅ Deve abrir o painel de edição

---

## 🐛 SE AINDA HOUVER PROBLEMAS

### Verificar erros do console
1. Abra F12 (Developer Tools)
2. Vá para a aba "Console"
3. Procure por mensagens de erro em vermelho
4. Copie a mensagem de erro completa

### Verificar conexão com backend
```powershell
# No terminal PowerShell:
Invoke-WebRequest -Uri "http://localhost:3001/api/mindmaps" -UseBasicParsing
```
✅ Deve retornar: `{ "success": true, "data": [] }`

### Verificar se Supabase está conectado
Vá para a aba "Network" do console (F12) e procure por requisições para:
- `https://mvkrlvjyocynmwslklzu.supabase.co`

---

## 📋 CHECKLIST FINAL

- [ ] SQL executado no Supabase (Schema ou Update)
- [ ] Portas 3001 e 5173 estão listening
- [ ] .env.local criado no frontend
- [ ] Cache do navegador limpo
- [ ] Teste de clique em perfil ✅
- [ ] Teste de criar novo mapa ✅
- [ ] Teste de adicionar nó ✅

Pronto! Sua aplicação deve estar completamente funcional agora! 🎉
