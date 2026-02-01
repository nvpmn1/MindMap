# 🎨 UX/UI Design System - MindMap Hub

## 1. Princípios de Design

### 1.1 Filosofia

```
┌─────────────────────────────────────────────────────────────┐
│                    Princípios Core                           │
├─────────────────────────────────────────────────────────────┤
│  1. SIMPLICIDADE      - Interface limpa, foco no conteúdo   │
│  2. FLUIDEZ           - Animações suaves, transições        │
│  3. COLABORAÇÃO       - Presença visível, edição em tempo   │
│  4. DIDÁTICO          - Estados vazios explicam, guiam      │
│  5. DARK MODE FIRST   - Conforto visual para longos uso     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Goals

| Goal | Métrica | Target |
|------|---------|--------|
| Aprendizado zero | Tempo até primeira ação útil | < 30s |
| Fluidez | Frame rate durante interação | 60fps |
| Acessibilidade | WCAG compliance | AA |
| Responsividade | Breakpoints funcionais | 3 (mobile, tablet, desktop) |

---

## 2. Design Tokens

### 2.1 Cores

```css
:root {
  /* Background */
  --bg-primary: #0f0f12;
  --bg-secondary: #1a1a1f;
  --bg-tertiary: #252529;
  --bg-elevated: #2d2d33;
  
  /* Foreground */
  --fg-primary: #ffffff;
  --fg-secondary: #a1a1aa;
  --fg-tertiary: #71717a;
  --fg-muted: #52525b;
  
  /* Accent (Indigo) */
  --accent-50: #eef2ff;
  --accent-100: #e0e7ff;
  --accent-200: #c7d2fe;
  --accent-300: #a5b4fc;
  --accent-400: #818cf8;
  --accent-500: #6366f1;
  --accent-600: #4f46e5;
  --accent-700: #4338ca;
  --accent-800: #3730a3;
  --accent-900: #312e81;
  
  /* Status */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* User Colors (Presença) */
  --user-guilherme: #6366f1;
  --user-helen: #ec4899;
  --user-pablo: #10b981;
  
  /* Node Colors */
  --node-default: #6366f1;
  --node-idea: #f59e0b;
  --node-task: #22c55e;
  --node-question: #3b82f6;
  --node-warning: #ef4444;
  --node-note: #8b5cf6;
}
```

### 2.2 Tipografia

```css
:root {
  /* Font Family */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### 2.3 Espaçamento

```css
:root {
  /* Spacing Scale */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### 2.4 Bordas e Sombras

```css
:root {
  /* Border Radius */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;
  
  /* Border Width */
  --border-thin: 1px;
  --border-medium: 2px;
  --border-thick: 4px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-glow: 0 0 20px rgb(99 102 241 / 0.3);
}
```

### 2.5 Animações

```css
:root {
  /* Durations */
  --duration-instant: 50ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  
  /* Easings */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

---

## 3. Componentes UI

### 3.1 Button

```tsx
// Variantes
<Button variant="primary">Ação Principal</Button>
<Button variant="secondary">Ação Secundária</Button>
<Button variant="ghost">Ação Sutil</Button>
<Button variant="danger">Ação Destrutiva</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>

// Com ícone
<Button icon={<PlusIcon />}>Novo Mapa</Button>

// Loading
<Button loading>Processando...</Button>
```

**Especificações:**

| Propriedade | SM | MD | LG |
|-------------|----|----|-----|
| Height | 32px | 40px | 48px |
| Padding X | 12px | 16px | 24px |
| Font Size | 13px | 14px | 16px |
| Border Radius | 6px | 8px | 10px |

### 3.2 Input

```tsx
// Variantes
<Input placeholder="Digite aqui..." />
<Input type="search" icon={<SearchIcon />} />
<Input error="Campo obrigatório" />
<Input disabled />

// Com label
<FormField label="Email" hint="Usaremos para enviar o magic link">
  <Input type="email" placeholder="seu@email.com" />
</FormField>
```

### 3.3 Card

```tsx
<Card>
  <Card.Header>
    <Card.Title>Mapa de Pesquisa</Card.Title>
    <Card.Description>Última edição há 2 horas</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Preview do mapa */}
  </Card.Content>
  <Card.Footer>
    <Badge>3 pendências</Badge>
  </Card.Footer>
</Card>
```

### 3.4 Badge

```tsx
// Status
<Badge variant="success">Concluído</Badge>
<Badge variant="warning">Em progresso</Badge>
<Badge variant="error">Bloqueado</Badge>
<Badge variant="info">Aguardando</Badge>

// Com contador
<Badge count={5}>Notificações</Badge>

// Dot indicator
<Badge dot variant="success" />
```

### 3.5 Avatar

```tsx
// Com imagem
<Avatar src="/avatars/guilherme.jpg" alt="Guilherme" />

// Com iniciais
<Avatar>GU</Avatar>

// Com cor do usuário
<Avatar color="var(--user-guilherme)">GU</Avatar>

// Grupo de avatars (presença)
<AvatarGroup max={3}>
  <Avatar src="..." />
  <Avatar src="..." />
  <Avatar src="..." />
  <Avatar src="..." />
</AvatarGroup>
```

### 3.6 Modal

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <Modal.Header>
    <Modal.Title>Delegar Tarefa</Modal.Title>
    <Modal.Close />
  </Modal.Header>
  <Modal.Body>
    {/* Conteúdo */}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
    <Button variant="primary" onClick={onSubmit}>Delegar</Button>
  </Modal.Footer>
</Modal>
```

### 3.7 Drawer

```tsx
<Drawer open={isOpen} side="right" size="md">
  <Drawer.Header>
    <Drawer.Title>Detalhes do Nó</Drawer.Title>
    <Drawer.Close />
  </Drawer.Header>
  <Drawer.Body>
    {/* Tabs, formulários, etc */}
  </Drawer.Body>
</Drawer>
```

### 3.8 Toast

```tsx
// Sucesso
toast.success('Mapa criado com sucesso!');

// Erro
toast.error('Falha ao salvar. Tente novamente.');

// Info
toast.info('Helen está editando este nó');

// Com ação
toast('Tarefa delegada', {
  action: {
    label: 'Desfazer',
    onClick: () => undoDelegate()
  }
});
```

### 3.9 Dropdown

```tsx
<Dropdown>
  <Dropdown.Trigger asChild>
    <Button variant="ghost" icon={<MoreIcon />} />
  </Dropdown.Trigger>
  <Dropdown.Content align="end">
    <Dropdown.Item icon={<EditIcon />}>Editar</Dropdown.Item>
    <Dropdown.Item icon={<CopyIcon />}>Duplicar</Dropdown.Item>
    <Dropdown.Separator />
    <Dropdown.Item icon={<TrashIcon />} variant="danger">
      Excluir
    </Dropdown.Item>
  </Dropdown.Content>
</Dropdown>
```

---

## 4. Layouts

### 4.1 MainLayout (Home)

```
┌────────────────────────────────────────────────────────────┐
│ Header (64px)                                               │
│ [Logo]                              [Search] [Bell] [Avatar]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│                      Main Content                          │
│                      (padding: 24px)                       │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4.2 EditorLayout (Mapa)

```
┌────────────────────────────────────────────────────────────────────┐
│ TopBar (56px)                                                       │
│ [←][Título] [Map|List|Kanban] [Search] [Agent] [Presence] [Share]  │
├──────────┬─────────────────────────────────────────────┬───────────┤
│ Sidebar  │                                             │  Drawer   │
│ (240px)  │              Canvas (flex)                  │  (360px)  │
│          │                                             │           │
│ Collaps. │                                             │ Collaps.  │
│          │                                             │           │
├──────────┴─────────────────────────────────────────────┴───────────┤
│ Agent Console (56px) - Collapsible                                  │
│ [Expand] [Summarize] [→Tasks] [Delegate] [Links] [Chat...]         │
└────────────────────────────────────────────────────────────────────┘
```

### 4.3 Responsividade

```css
/* Breakpoints */
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

| Breakpoint | Sidebar | Drawer | Agent Console |
|------------|---------|--------|---------------|
| < 768px | Hidden (overlay) | Hidden (overlay) | Collapsed |
| 768-1024px | Collapsed (icons) | Hidden (overlay) | Visible |
| > 1024px | Visible | Visible | Visible |

---

## 5. Mindmap Canvas

### 5.1 Node Design

```
┌─────────────────────────────────────────┐
│ 🎯 Título do Nó                    [⋯] │
│ ───────────────────────────────────────│
│ Descrição opcional do nó que pode      │
│ ter múltiplas linhas...                │
│                                         │
│ [tag1] [tag2]                     👤 GU │
│                              [3] [💬2] │
└─────────────────────────────────────────┘

Legenda:
- 🎯 Ícone (customizável)
- [⋯] Menu de contexto
- 👤 GU = Avatar do criador/responsável
- [3] = Badge de subtarefas
- [💬2] = Badge de comentários
```

**Estados do Nó:**

| Estado | Borda | Background | Indicador |
|--------|-------|------------|-----------|
| Default | accent-500 | bg-elevated | - |
| Selected | accent-400 (2px) | bg-elevated | Glow |
| Hover | accent-400 | bg-tertiary | - |
| Editing | accent-400 (2px) | bg-secondary | Cursor |
| Collapsed | accent-600 | bg-elevated | [+] icon |
| Has pending | warning | bg-elevated | Yellow dot |

### 5.2 Edge Design

```css
/* Edge padrão */
.edge-default {
  stroke: var(--fg-tertiary);
  stroke-width: 2px;
  fill: none;
}

/* Edge selecionado */
.edge-selected {
  stroke: var(--accent-400);
  stroke-width: 3px;
}

/* Edge animado */
.edge-animated {
  stroke-dasharray: 5;
  animation: dash 1s linear infinite;
}
```

### 5.3 Controles do Canvas

```
┌─────────────────┐
│  [+] [-] [⟲]   │  Zoom in/out/reset
│  [◫]           │  Fit to view
│  [⊞]           │  Toggle minimap
└─────────────────┘
```

### 5.4 Minimap

```
┌───────────────┐
│    ┌──┐       │
│    │  │ ←View │
│    └──┘       │
│  ○   ○   ○    │
│   ╲ │ ╱       │
│    ○          │
└───────────────┘
```

---

## 6. Animações

### 6.1 Entrada de Nó (AI Generated)

```typescript
// Framer Motion
const nodeVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: -20 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
};

// Stagger children
const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

### 6.2 Focus Animation (Navegação)

```typescript
// Quando clica em notificação → foca no nó
const focusOnNode = async (nodeId: string) => {
  // 1. Zoom out suave
  await reactFlowInstance.fitView({ duration: 300 });
  
  // 2. Pan para o nó
  const node = getNode(nodeId);
  await reactFlowInstance.setCenter(
    node.position.x,
    node.position.y,
    { duration: 500, zoom: 1.5 }
  );
  
  // 3. Highlight pulse
  setHighlightedNode(nodeId);
  setTimeout(() => setHighlightedNode(null), 2000);
};
```

### 6.3 Presence Cursor

```typescript
// Cursor do outro usuário
const CursorPresence = ({ user, position }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: 1,
      x: position.x,
      y: position.y
    }}
    transition={{ type: "spring", damping: 30 }}
    style={{ position: 'absolute' }}
  >
    <CursorIcon color={user.color} />
    <span className="cursor-label">{user.name}</span>
  </motion.div>
);
```

### 6.4 Collapse/Expand

```typescript
const collapseAnimation = {
  initial: { height: 'auto', opacity: 1 },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};
```

---

## 7. Estados Vazios

### 7.1 Nenhum Mapa

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         🗺️                                  │
│                                                             │
│              Nenhum mapa ainda                              │
│                                                             │
│    Crie seu primeiro mapa para começar a colaborar         │
│                                                             │
│           [+ Novo Mapa] [📋 Usar Template]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Nenhuma Tarefa

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         ✅                                  │
│                                                             │
│              Nenhuma tarefa pendente                        │
│                                                             │
│    Use o botão "→ Tarefas" para converter nós em tasks     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Nenhuma Notificação

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         🔔                                  │
│                                                             │
│              Você está em dia!                              │
│                                                             │
│    Nenhuma notificação nova no momento                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Micro-interações

### 8.1 Hover Effects

```css
/* Card hover */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-500);
}

/* Button hover */
.btn-primary:hover {
  background: var(--accent-600);
  transform: scale(1.02);
}

/* Node hover - mostrar ações */
.node:hover .node-actions {
  opacity: 1;
  transform: translateY(0);
}
```

### 8.2 Click Feedback

```css
/* Button click */
.btn:active {
  transform: scale(0.98);
}

/* Ripple effect */
.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: ripple 0.6s ease-out;
}
```

### 8.3 Loading States

```tsx
// Skeleton
<Skeleton width={200} height={20} />

// Spinner inline
<Button loading>
  <Spinner size="sm" />
  Salvando...
</Button>

// Progress
<Progress value={65} />
```

---

## 9. Acessibilidade

### 9.1 Keyboard Navigation

| Ação | Atalho |
|------|--------|
| Novo mapa | `Ctrl/Cmd + N` |
| Buscar | `Ctrl/Cmd + K` |
| Salvar | `Ctrl/Cmd + S` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` |
| Deletar nó | `Delete` ou `Backspace` |
| Selecionar todos | `Ctrl/Cmd + A` |
| Zoom in | `Ctrl/Cmd + +` |
| Zoom out | `Ctrl/Cmd + -` |
| Fit view | `Ctrl/Cmd + 0` |
| Mover nó | Arrow keys |
| Editar nó | `Enter` ou `F2` |

### 9.2 ARIA Labels

```tsx
<button 
  aria-label="Expandir nó com IA"
  aria-describedby="expand-tooltip"
>
  <ExpandIcon />
</button>

<div role="tree" aria-label="Estrutura do mapa">
  <div role="treeitem" aria-expanded="true">
    Nó Raiz
  </div>
</div>
```

### 9.3 Cores e Contraste

- Mínimo 4.5:1 para texto normal
- Mínimo 3:1 para texto grande
- Indicadores não dependem só de cor (usar ícones/texto)

---

## 10. Checklist de Implementação

### 10.1 Componentes Base
- [ ] Button (todas variantes)
- [ ] Input
- [ ] FormField
- [ ] Card
- [ ] Badge
- [ ] Avatar / AvatarGroup
- [ ] Modal
- [ ] Drawer
- [ ] Toast system
- [ ] Dropdown
- [ ] Tabs
- [ ] Spinner
- [ ] Skeleton
- [ ] Progress

### 10.2 Layouts
- [ ] MainLayout
- [ ] EditorLayout
- [ ] Sidebar (collapsible)
- [ ] Header

### 10.3 Canvas
- [ ] MapCanvas (React Flow)
- [ ] Custom Node
- [ ] Custom Edge
- [ ] Controls
- [ ] Minimap
- [ ] Selection box

### 10.4 Animações
- [ ] Node entrance
- [ ] Focus navigation
- [ ] Collapse/expand
- [ ] Presence cursors
- [ ] Toast slide

### 10.5 Estados
- [ ] Empty states (todos)
- [ ] Loading states
- [ ] Error states
- [ ] Success feedback
