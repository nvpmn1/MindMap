# 🧪 QA e Testing - MindMap Hub

## 1. Estratégia de Testes

### 1.1 Pirâmide de Testes

```
                    ┌─────────┐
                    │   E2E   │  ← Poucos, lentos, caros
                   ┌┴─────────┴┐
                   │Integration│  ← Médio, API + DB
                  ┌┴───────────┴┐
                  │    Unit     │  ← Muitos, rápidos, baratos
                 └──────────────┘
```

### 1.2 Cobertura Alvo

| Tipo | Cobertura | Foco |
|------|-----------|------|
| Unit | 80%+ | Utils, hooks, services |
| Integration | 60%+ | API endpoints, DB queries |
| E2E | Fluxos críticos | Auth, CRUD mapa, IA |

---

## 2. Testes Unitários

### 2.1 Frontend (Vitest + Testing Library)

```typescript
// utils/mapLayout.test.ts
import { calculateNodePosition, autoLayout } from './mapLayout';

describe('calculateNodePosition', () => {
  it('should calculate position for first child', () => {
    const parent = { x: 0, y: 0 };
    const result = calculateNodePosition(parent, 0, 3);
    
    expect(result.x).toBe(200); // offset horizontal
    expect(result.y).toBe(-100); // primeiro filho acima
  });

  it('should spread children vertically', () => {
    const parent = { x: 0, y: 0 };
    const positions = [0, 1, 2].map(i => 
      calculateNodePosition(parent, i, 3)
    );
    
    // Verifica que estão espaçados
    expect(positions[1].y).toBeGreaterThan(positions[0].y);
    expect(positions[2].y).toBeGreaterThan(positions[1].y);
  });
});

describe('autoLayout', () => {
  it('should layout tree without overlaps', () => {
    const nodes = [
      { id: '1', parent_id: null },
      { id: '2', parent_id: '1' },
      { id: '3', parent_id: '1' },
    ];
    
    const result = autoLayout(nodes);
    
    // Verifica que nós não se sobrepõem
    const boxes = result.map(n => ({
      x1: n.position_x,
      y1: n.position_y,
      x2: n.position_x + 200,
      y2: n.position_y + 80,
    }));
    
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(boxesOverlap(boxes[i], boxes[j])).toBe(false);
      }
    }
  });
});
```

### 2.2 Hooks

```typescript
// hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should start with loading state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('should update user after login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn('test@example.com');
    });
    
    expect(result.current.isLoading).toBe(false);
    // Note: Magic link não loga direto, apenas envia email
  });
});
```

### 2.3 Backend (Jest)

```typescript
// services/mapService.test.ts
import { mapService } from './mapService';
import { supabase } from './supabase';

jest.mock('./supabase');

describe('mapService', () => {
  describe('create', () => {
    it('should create map with default values', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: '123', title: 'Test Map' },
        error: null,
      });
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: () => ({ single: () => mockInsert() }),
      });

      const result = await mapService.create({
        title: 'Test Map',
        workspaceId: 'ws-1',
        userId: 'user-1',
      });

      expect(result.id).toBe('123');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Map',
          workspace_id: 'ws-1',
        })
      );
    });
  });

  describe('getById', () => {
    it('should return null if not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => ({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      const result = await mapService.getById('non-existent');
      
      expect(result).toBeNull();
    });
  });
});
```

---

## 3. Testes de Integração

### 3.1 API Endpoints

```typescript
// routes/maps.test.ts
import request from 'supertest';
import { app } from '../app';
import { createTestUser, createTestWorkspace } from '../test/helpers';

describe('Maps API', () => {
  let authToken: string;
  let workspaceId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    authToken = user.token;
    const workspace = await createTestWorkspace(user.id);
    workspaceId = workspace.id;
  });

  describe('POST /api/maps', () => {
    it('should create a new map', async () => {
      const response = await request(app)
        .post('/api/maps')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Map',
          workspaceId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Map');
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/maps')
        .send({
          title: 'Test Map',
          workspaceId,
        });

      expect(response.status).toBe(401);
    });

    it('should reject invalid workspace', async () => {
      const response = await request(app)
        .post('/api/maps')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Map',
          workspaceId: 'invalid-uuid',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/maps/:id', () => {
    it('should return map with nodes', async () => {
      // Criar mapa primeiro
      const createRes = await request(app)
        .post('/api/maps')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test', workspaceId });

      const mapId = createRes.body.data.id;

      const response = await request(app)
        .get(`/api/maps/${mapId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(mapId);
      expect(response.body.data.nodes).toBeDefined();
    });
  });
});
```

### 3.2 AI Endpoints

```typescript
// routes/ai.test.ts
import request from 'supertest';
import { app } from '../app';

describe('AI API', () => {
  describe('POST /api/ai/expand-node', () => {
    it('should expand node with sub-nodes', async () => {
      const response = await request(app)
        .post('/api/ai/expand-node')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mapId: testMapId,
          nodeId: testNodeId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newNodes.length).toBeGreaterThan(0);
      
      // Verificar que nós foram salvos
      const nodes = await getNodesByParent(testNodeId);
      expect(nodes.length).toBeGreaterThan(0);
    }, 30000); // Timeout maior para IA

    it('should handle rate limiting', async () => {
      // Fazer muitas requisições
      const promises = Array(15).fill(null).map(() =>
        request(app)
          .post('/api/ai/expand-node')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ mapId: testMapId, nodeId: testNodeId })
      );

      const responses = await Promise.all(promises);
      
      // Algumas devem ser rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

---

## 4. Testes E2E (Playwright)

### 4.1 Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 Fluxo de Auth

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
  });

  test('should send magic link email', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /enviar/i }).click();
    
    await expect(page.getByText(/verifique seu email/i)).toBeVisible();
  });

  test('should redirect after successful auth', async ({ page }) => {
    // Simular sessão válida
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/');
    
    await expect(page).toHaveURL('/home');
  });
});
```

### 4.3 Fluxo de Mapa

```typescript
// e2e/map.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Map Editor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should create a new map', async ({ page }) => {
    await page.goto('/home');
    
    // Clicar em novo mapa
    await page.getByRole('button', { name: /novo mapa/i }).click();
    
    // Preencher título
    await page.getByPlaceholder(/título/i).fill('Meu Mapa de Teste');
    await page.getByRole('button', { name: /criar/i }).click();
    
    // Deve redirecionar para o editor
    await expect(page).toHaveURL(/\/map\/.+/);
    
    // Canvas deve estar visível
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('should add a node to the map', async ({ page }) => {
    await page.goto('/map/test-map-id');
    
    // Double click no canvas para criar nó
    const canvas = page.locator('.react-flow');
    await canvas.dblclick({ position: { x: 400, y: 300 } });
    
    // Modal de criação deve abrir
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Preencher e salvar
    await page.getByPlaceholder(/título/i).fill('Novo Nó');
    await page.getByRole('button', { name: /salvar/i }).click();
    
    // Nó deve aparecer
    await expect(page.getByText('Novo Nó')).toBeVisible();
  });

  test('should drag node to new position', async ({ page }) => {
    await page.goto('/map/test-map-id');
    
    const node = page.locator('[data-nodeid="test-node"]');
    const initialPos = await node.boundingBox();
    
    // Drag
    await node.dragTo(page.locator('.react-flow'), {
      targetPosition: { x: 500, y: 400 },
    });
    
    // Verificar nova posição
    const newPos = await node.boundingBox();
    expect(newPos?.x).not.toBe(initialPos?.x);
    expect(newPos?.y).not.toBe(initialPos?.y);
  });

  test('should expand node with AI', async ({ page }) => {
    await page.goto('/map/test-map-id');
    
    // Selecionar nó
    await page.click('[data-nodeid="test-node"]');
    
    // Clicar em expandir
    await page.getByRole('button', { name: /expandir/i }).click();
    
    // Loading
    await expect(page.getByText(/gerando/i)).toBeVisible();
    
    // Aguardar conclusão (timeout maior)
    await expect(page.getByText(/gerando/i)).not.toBeVisible({ timeout: 30000 });
    
    // Novos nós devem aparecer
    const nodes = page.locator('.react-flow__node');
    await expect(nodes).toHaveCount({ minimum: 2 });
  });
});
```

### 4.4 Fluxo de Delegação

```typescript
// e2e/delegation.spec.ts
test.describe('Task Delegation', () => {
  test('should delegate task to another user', async ({ page }) => {
    await page.goto('/map/test-map-id');
    
    // Selecionar nó
    await page.click('[data-nodeid="test-node"]');
    
    // Abrir menu de contexto
    await page.click('[data-nodeid="test-node"]', { button: 'right' });
    
    // Clicar em delegar
    await page.getByRole('menuitem', { name: /delegar/i }).click();
    
    // Preencher modal
    await page.getByRole('combobox', { name: /para/i }).click();
    await page.getByRole('option', { name: /helen/i }).click();
    
    await page.getByPlaceholder(/descrição/i).fill('Por favor revisar este item');
    
    await page.getByRole('button', { name: /delegar/i }).click();
    
    // Toast de sucesso
    await expect(page.getByText(/tarefa delegada/i)).toBeVisible();
    
    // Badge no nó
    await expect(page.locator('[data-nodeid="test-node"] .badge')).toBeVisible();
  });
});
```

---

## 5. Testes de RLS (Segurança)

```typescript
// tests/rls.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Row Level Security', () => {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const userAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const userBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  beforeAll(async () => {
    // Simular login de userA e userB
    await userAClient.auth.signInWithPassword({ email: 'usera@test.com', password: 'test' });
    await userBClient.auth.signInWithPassword({ email: 'userb@test.com', password: 'test' });
  });

  test('anon should not access any data', async () => {
    const { data, error } = await anonClient.from('maps').select('*');
    
    expect(data).toEqual([]);
    // RLS bloqueia acesso
  });

  test('user should only see their workspace maps', async () => {
    const { data } = await userAClient.from('maps').select('*');
    
    // Todos os mapas devem ser do workspace de userA
    data?.forEach(map => {
      expect(map.workspace_id).toBe(userAWorkspaceId);
    });
  });

  test('user should not update another workspace map', async () => {
    const { error } = await userAClient
      .from('maps')
      .update({ title: 'Hacked!' })
      .eq('id', userBMapId);
    
    expect(error).toBeTruthy();
  });

  test('user should not see other user notifications', async () => {
    const { data } = await userAClient
      .from('notifications')
      .select('*')
      .eq('user_id', userBId);
    
    expect(data).toEqual([]);
  });
});
```

---

## 6. Testes de Performance

### 6.1 Load Testing (k6)

```javascript
// load-tests/map-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 10 },   // Stay
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

const BASE_URL = 'https://mindmap-kpf1.onrender.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  // GET map
  const mapRes = http.get(`${BASE_URL}/api/maps/test-map-id`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  
  check(mapRes, {
    'map status is 200': (r) => r.status === 200,
    'map has nodes': (r) => JSON.parse(r.body).data.nodes.length > 0,
  });

  sleep(1);

  // GET nodes
  const nodesRes = http.get(`${BASE_URL}/api/maps/test-map-id/nodes`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });

  check(nodesRes, {
    'nodes status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

### 6.2 Frontend Performance (Lighthouse CI)

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://mind-map-three-blue.vercel.app
            https://mind-map-three-blue.vercel.app/login
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "total", "budget": 500 }
    ],
    "resourceCounts": [
      { "resourceType": "third-party", "budget": 10 }
    ],
    "timings": [
      { "metric": "interactive", "budget": 3000 },
      { "metric": "first-contentful-paint", "budget": 1500 }
    ]
  }
]
```

---

## 7. Checklist de QA (Manual)

### 7.1 Antes de Release

**Auth:**
- [ ] Magic link chega no email
- [ ] Link expira após uso
- [ ] Sessão persiste após reload
- [ ] Logout funciona

**Mapas:**
- [ ] Criar mapa funciona
- [ ] Editar título funciona
- [ ] Deletar mapa funciona
- [ ] Mapa aparece na lista

**Nós:**
- [ ] Criar nó funciona
- [ ] Editar nó inline funciona
- [ ] Deletar nó funciona
- [ ] Drag & drop funciona
- [ ] Posição persiste após reload
- [ ] Conexões funcionam

**Views:**
- [ ] Map view renderiza corretamente
- [ ] List view mostra hierarquia
- [ ] Kanban mostra tasks
- [ ] Switch entre views funciona
- [ ] Alterações sincronizam entre views

**Tasks:**
- [ ] Criar task funciona
- [ ] Atribuir task funciona
- [ ] Mudar status funciona
- [ ] Drag no kanban funciona

**IA:**
- [ ] Gerar mapa funciona
- [ ] Expandir nó funciona
- [ ] Loading aparece durante geração
- [ ] Erro tratado graciosamente

**Notificações:**
- [ ] Badge aparece com contagem
- [ ] Lista mostra notificações
- [ ] Marcar como lida funciona
- [ ] Click leva ao item

**Responsividade:**
- [ ] Desktop (1920x1080) OK
- [ ] Laptop (1366x768) OK
- [ ] Tablet (768x1024) OK

**Performance:**
- [ ] Load inicial < 3s
- [ ] Mapa com 50 nós não trava
- [ ] Scroll/zoom suave

### 7.2 Smoke Test (5 minutos)

1. Abrir app ✓
2. Fazer login ✓
3. Criar mapa ✓
4. Criar 3 nós ✓
5. Mover um nó ✓
6. Expandir com IA ✓
7. Ver em List view ✓
8. Ver em Kanban ✓
9. Criar task ✓
10. Logout ✓

---

## 8. Automação CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Run backend tests
        run: cd backend && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: cd frontend && npx playwright test
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## 9. Bug Report Template

```markdown
## Bug Report

**Descrição:**
[Descrição clara do bug]

**Passos para reproduzir:**
1. Ir para '...'
2. Clicar em '...'
3. Ver erro

**Comportamento esperado:**
[O que deveria acontecer]

**Comportamento atual:**
[O que está acontecendo]

**Screenshots:**
[Se aplicável]

**Ambiente:**
- Browser: [Chrome 120]
- OS: [Windows 11]
- Resolução: [1920x1080]

**Logs:**
```
[Console logs se houver]
```

**Prioridade:**
- [ ] P0 - Blocker
- [ ] P1 - Critical
- [ ] P2 - Major
- [ ] P3 - Minor
```
