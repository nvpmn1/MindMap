# 🚀 INSTRUÇÕES - FAÇA ISSO AGORA

## 1️⃣ ABRA O NAVEGADOR

```
http://localhost:5173
```

> Se der erro de conexão recusada = servidores não estão rodando
> Vá para: Terminal → Verifique se npm run dev está rodando em backend/ e frontend/

---

## 2️⃣ VEJA UM MODAL PEDINDO PARA INICIALIZAR

Você verá uma tela assim:

```
┌─────────────────────────────────┐
│      🗄️ Banco de Dados          │
│                                 │
│  Precisamos inicializar o BD    │
│                                 │
│  [Inicializar Banco de Dados]   │
└─────────────────────────────────┘
```

---

## 3️⃣ CLIQUE NO BOTÃO

Clique em **"Inicializar Banco de Dados"**

A página vai mostrar uma barra de progresso:

```
Inicializando... [████████░░] 80%

Criando tabelas...
Inserindo dados...
```

---

## 4️⃣ AGUARDE 30 SEGUNDOS

Não clique em nada!

A página vai **recarregar automaticamente** quando terminar.

---

## 5️⃣ SELECIONE UM USUÁRIO

Você vai ver 3 opções:

```
┌──────────────────────────────────┐
│   Selecione seu usuário          │
│                                  │
│  [👤 Guilherme] [👤 Helen]       │
│        [👤 Pablo]                │
└──────────────────────────────────┘
```

Clique em um deles. Exemplo: **Guilherme**

---

## 6️⃣ PRONTO!

A aplicação abriu! 🎉

Você está vendo:

- **Esquerda:** Menu (Mapa, Kanban, Lista, Chat)
- **Topo:** Busca, notificações, tema
- **Centro:** O mapa mental ou outra visualização
- **Direita:** Detalhes do nó selecionado

---

## 🎮 USE A APLICAÇÃO

### Criar um novo nó:
1. Clique no botão "+" no topo
2. Digite um nome
3. Pressione Enter

### Mudar para Kanban:
1. Clique em "Kanban" no menu
2. Arraste os nós entre colunas

### Mudar para Lista:
1. Clique em "Lista" no menu
2. Expanda/collapse os itens

### Conversar com IA:
1. Clique no ícone de Chat (💬)
2. Digite sua pergunta
3. Claude responde!

---

## ⚠️ SE ALGO DER ERRADO

### ❌ "Conexão recusada"
```
Solução:
1. Abra terminal
2. cd backend
3. npm run dev
4. Em outra aba: cd frontend
5. npm run dev
6. Recarregue a página
```

### ❌ "Erro ao inicializar BD"
```
Solução Manual:
1. Vá para: https://mvkrlvjyocynmwslklzu.supabase.co
2. Clique em SQL Editor
3. Clique em "New Query"
4. Abra arquivo: database/schema.sql
5. Copie TODO o conteúdo
6. Cole no Supabase
7. Clique em "Run"
8. Recarregue a página (Ctrl+Shift+R)
```

### ❌ "Chat IA não responde"
```
Solução:
1. Verifique backend/.env
2. Procure: ANTHROPIC_API_KEY=
3. Deve ter um valor começando com: sk-ant-
4. Se estiver vazio, copie sua chave da API Anthropic
5. Salve e reinicie o backend
```

### ❌ "Página continua em branco"
```
Solução:
1. Aperte F12 (Developer Tools)
2. Vá em Console
3. Veja qual é o erro
4. Envie-me a mensagem de erro
```

---

## 💾 ATIVAR REALTIME (Colaboração em tempo real)

Isso é **OPCIONAL** mas legal!

Quando 2 pessoas usam ao mesmo tempo, tudo sincroniza em tempo real.

```
1. Vá para Supabase: https://mvkrlvjyocynmwslklzu.supabase.co
2. Clique em "Database"
3. Clique em "Publications"
4. Procure "supabase_realtime"
5. Clique nos 3 pontos (...)
6. Ative (toggle ON) para:
   - nodes
   - comments  
   - activities
7. Clique "Save"
```

---

## 📞 CHECKLIST RÁPIDO

Faça isso para confirmar que tudo está funcionando:

- [ ] Navegador abriu em http://localhost:5173
- [ ] Modal de setup apareceu
- [ ] Cliquei em "Inicializar"
- [ ] Página recarregou automaticamente
- [ ] Selecionei um usuário
- [ ] App abriu com o mapa
- [ ] Cliquei em "+" e criei um nó
- [ ] Consegui ver o nó novo no mapa
- [ ] Mudei para Kanban e funcionou
- [ ] Mudei para Lista e funcionou
- [ ] Abri o Chat IA e conversei

Se tudo acima estava verde (✅) = **VOCÊ ESTÁ PRONTO!**

---

## 🎯 PRÓXIMOS PASSOS

### Hoje (Agora mesmo!)
- ✅ Usar a aplicação
- ✅ Testar com amigos (Guilherme, Helen, Pablo)
- ✅ Brincar e se divertir!

### Amanhã (Opcional)
- Deploy no Render (backend)
- Deploy no Vercel (frontend)
- Configurar domínio personalizado

### Documentações complementares:
- **QUICK_START.md** - Resumo técnico
- **COMPLETO.md** - Documentação completa
- **SETUP.md** - Setup detalhado

---

## 🎉 Aproveite!

Você tem uma **aplicação profissional** com:
- ✨ Interface moderna
- 🧠 Visualização inteligente de dados
- 🤖 IA integrada
- 🔄 Sincronização em tempo real
- 👥 Colaboração entre usuários

Divirta-se! 🚀

---

```
 _   _     _       _     _   _
| | | |   / \     | |   | |_| |
| | | |  / _ \    | |   |  _  |
| |_| | / ___ \   | |__ | | | |
 \___/ /_/   \_\  |____||_| |_|
```

**Desenvolvido para você com ❤️**
