# 🧠 MindMap Colaborativo - Guia de Setup Completo

## ✅ Status Atual

✅ Backend rodando na porta 3001  
✅ Frontend rodando na porta 5173  
✅ IA Claude integrada  
⏳ Banco de dados - precisa de setup

---

## 📋 Passo 1: Configurar Banco de Dados

### Opção A: Setup Automático (Recomendado)

1. Abra a aplicação: http://localhost:5173
2. Um modal "Configurando Banco de Dados" aparecerá
3. Clique em "Inicializar"
4. Aguarde a conclusão automática

### Opção B: Setup Manual

1. Abra o Dashboard do Supabase:
   https://mvkrlvjyocynmwslklzu.supabase.co

2. Faça login

3. Vá em **SQL Editor** → **New Query**

4. Copie todo o conteúdo do arquivo `database/schema.sql`

5. Cole no editor e clique em **RUN**

6. Aguarde a execução (pode levar 30-60 segundos)

---

## 📊 Passo 2: Habilitar Realtime

Depois que o schema for executado, você precisa habilitar Realtime nas tabelas principais:

1. No Dashboard do Supabase, vá em **Database** → **Publications**

2. Clique em **supabase_realtime**

3. Procure pelas tabelas e ative:
   - ✅ nodes
   - ✅ comments  
   - ✅ activities

4. Clique em **Save**

---

## 🚀 Passo 3: Usar a Aplicação

### Seleção de Usuário
Quando abrir http://localhost:5173, escolha um dos 3 usuários:
- 👤 **Guilherme** (Admin)
- 👤 **Helen** (Membro)
- 👤 **Pablo** (Membro)

### Funcionalidades Principais

#### 🗺️ Mapa Mental
- Crie nós, organize hierarquicamente
- Use IA para gerar ideias
- Colaboração em tempo real

#### 📋 Kanban
- Veja tarefas por status (A Fazer, Fazendo, Feito)
- Arraste para mudar status
- Atribua responsáveis

#### ✅ Lista
- Visualização em árvore expandível
- Editar inline
- Filtrar por usuário

#### 🤖 IA Assistant
- Clique no ícone de robô no canto inferior direito
- Converse com Claude
- Peça para gerar mapas, expandir ideias, resumir

---

## 🛠️ Troubleshooting

### "Erro de conexão ao Supabase"
- Verifique o .env está correto
- Confirme que o Supabase está online
- Tente recarregar a página

### "Tabelas não foram criadas"
- Verifique se executou o schema.sql
- Confirme que não houve erros no SQL Editor
- Tente novamente com o script setup-database.bat

### "IA não está respondendo"
- Verifique a chave do Anthropic no .env
- Confirme que tem saldo/créditos na conta
- Verifique os logs do backend: `npm run dev`

### "Mudanças não sincronizam entre usuários"
- Abra dois navegadores diferentes (ou duas abas)
- Fique logado como usuários diferentes em cada um
- Confirme que Realtime está ativado no Supabase

---

## 📦 Estrutura de Arquivos

```
MindMap/
├── backend/              # Node.js + Express
│   ├── server.js        # Servidor principal
│   ├── routes/          # API endpoints
│   ├── services/        # Serviços (IA, Supabase)
│   └── .env             # Variáveis de ambiente
│
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── store/       # Estado global
│   │   ├── lib/         # Utilitários
│   │   └── App.jsx      # App principal
│   └── index.html       # HTML entry point
│
├── database/
│   └── schema.sql       # Schema PostgreSQL
│
└── README.md            # Este arquivo
```

---

## 🔗 URLs Importantes

| Serviço | URL |
|---------|-----|
| Frontend (Local) | http://localhost:5173 |
| Backend (Local) | http://localhost:3001 |
| Supabase Dashboard | https://mvkrlvjyocynmwslklzu.supabase.co |
| Supabase SQL Editor | https://mvkrlvjyocynmwslklzu.supabase.co/project/mvkrlvjyocynmwslklzu/sql/new |
| Frontend (Vercel) | https://mind-map-three-blue.vercel.app |
| Backend (Render) | https://mindmap-kpf1.onrender.com |

---

## 📱 Teclas de Atalho

| Atalho | Ação |
|--------|------|
| `Tab` | Novo sub-item |
| `Enter` | Novo item |
| `Shift+Tab` | Voltar nível |
| `Duplo clique` | Editar item |
| `Del/Backspace` | Deletar item |
| `Ctrl+S` | Salvar (auto-save ativo) |

---

## 🚀 Deploy em Produção

### Backend no Render
1. Vá em https://render.com
2. Connect seu repositório GitHub
3. Crie novo Web Service
4. Defina variáveis de ambiente
5. Deploy!

### Frontend no Vercel  
1. Vá em https://vercel.com
2. Import seu repositório
3. Configure variáveis de ambiente
4. Deploy!

---

## 📞 Suporte

Se tiver dúvidas:
1. Verifique os logs do terminal (npm run dev)
2. Abra o console do navegador (F12)
3. Verifique se as credenciais estão corretas

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2026  
**Status:** ✅ Pronto para uso

Bom trabalho! 🎉
