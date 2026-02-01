# 🧠 MindMap - Instruções de Setup Supabase

## ✅ Problema Resolvido: "Pisca Pisca" da Tela

A tela estava atualizando continuamente porque o componente DatabaseSetup estava recarregando a página com `window.location.reload()`. 

**Solução aplicada:**
- ✅ Removidos os `window.location.reload()` do DatabaseSetup.jsx
- ✅ Adicionado localStorage para comunicação entre componentes
- ✅ O modal agora fecha automaticamente após sucesso
- ✅ Sem mais re-renderizações infinitas!

---

## 📋 Como Executar o SQL no Supabase

### Passo 1: Abrir o Supabase
1. Acesse: https://app.supabase.com/
2. Selecione seu projeto
3. Vá para **SQL Editor** (no menu lateral esquerdo)

### Passo 2: Copiar o SQL
1. Abra o arquivo `SCHEMA.sql` neste diretório
2. Copie **TODO o conteúdo** do arquivo

### Passo 3: Colar e Executar
1. No Supabase SQL Editor, clique em **+ New Query**
2. Cole o SQL completo no editor
3. Clique em **Run** (botão azul com play)
4. Aguarde a conclusão (levará alguns segundos)

### Passo 4: Verificar Sucesso
- Se não houver erros em vermelho, tudo funcionou! ✅
- Você verá as mensagens de sucesso em verde
- As 8 tabelas foram criadas com sucesso

---

## 📁 SQL Disponível

O arquivo `SCHEMA.sql` contém:

**Tabelas criadas:**
- 👥 **users** - Usuários da aplicação
- 🧠 **mindmaps** - Mind maps principais
- 📌 **nodes** - Nós individuais dos mind maps
- 🔗 **node_links** - Conexões entre nós
- 📎 **attachments** - Arquivos anexados
- 💬 **comments** - Comentários nos nós
- 📊 **activities** - Log de atividades
- 👫 **mindmap_collaborators** - Colaboradores por mind map

**Dados de exemplo:**
- 3 usuários pré-criados (Guilherme, Helen, Pablo)

**Recursos:**
- ✅ Índices para performance
- ✅ Triggers de updated_at automático
- ✅ Row Level Security (RLS) configurado
- ✅ Políticas de segurança implementadas

---

## 🔧 Como Limpar Cache Local (se necessário)

Se a tela continuar com problemas, abra o console do navegador (F12) e cole:

```javascript
localStorage.removeItem('skipDatabaseSetup');
localStorage.removeItem('databaseReady');
window.location.reload();
```

---

## 🚀 Fluxo Agora

1. **App inicia** → Verifica localStorage e conexão com backend
2. **Backend responde** com status "ready" 
3. **Modal DatabaseSetup fecha** automaticamente
4. **Aplicação carrega** normalmente sem pisca pisca

---

## ✨ Tecnologia

- **Frontend:** React 18 + Vite
- **Backend:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Row Level Security (RLS)

Tudo pronto! 🎉
