# 📡 Observabilidade de Produção

Este projeto usa **Sentry + Logtail** para capturar erros críticos e reduzir MTTR em produção (Vercel + Render + Supabase + Claude).

## Stack

- **Frontend (Vercel / Browser):** `@sentry/react`, `@logtail/browser`
- **Backend (Render / Node):** `@sentry/node`, `@logtail/node`
- **Eventos monitorados:**
  - `window.error`
  - `unhandledrejection`
  - `uncaughtException`
  - `unhandledRejection`
  - respostas HTTP 5xx no backend

## Variáveis de ambiente

### Frontend (Vercel)

- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT=production`
- `VITE_SENTRY_TRACES_SAMPLE_RATE=0.1`
- `VITE_LOGTAIL_SOURCE_TOKEN`

### Backend (Render)

- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT=production`
- `SENTRY_TRACES_SAMPLE_RATE=0.1`
- `LOGTAIL_SOURCE_TOKEN`
- `OBSERVABILITY_SERVICE_NAME=mindmap-hub-api`

## Alertas recomendados

## Thresholds objetivos (produção)

Use os limites abaixo como padrão mínimo de pré-escala (48h):

| Categoria                | Métrica                          | Janela   | Warning     | Critical                  |
| ------------------------ | -------------------------------- | -------- | ----------- | ------------------------- |
| Backend disponibilidade  | `/health` status != 200          | 5 min    | >= 2 falhas | >= 5 falhas               |
| Backend estabilidade     | Taxa de erro 5xx                 | 5 min    | >= 2%       | >= 5%                     |
| Backend volume de falhas | Eventos `error` (Sentry/Logtail) | 5 min    | >= 15       | >= 40                     |
| Latência API             | p95 `/api/maps` e `/api/nodes`   | 10 min   | >= 1200ms   | >= 2500ms                 |
| Auth                     | `401` em `/api/auth/me` (smoke)  | execução | >= 1        | >= 1 (bloqueante release) |
| IA                       | `5xx` em `/api/ai/chat`          | 10 min   | >= 3        | >= 8                      |
| Frontend runtime         | unhandled `window.error`         | 10 min   | >= 5        | >= 15                     |

### Política de resposta

- **Warning:** abrir incidente e acompanhar por 30 min.
- **Critical:** acionar rollback imediato (frontend/backend) + post-mortem obrigatório.
- **Release gate:** qualquer falha no smoke autenticado (`401`, `5xx`, persistência inválida) bloqueia release.

### Sentry

Crie alert rules para:

1. **Erro novo em produção** (novas issues)
2. **Regressão reaberta**
3. **Spike de erros** (ex.: > 20 eventos em 5 min)

Regras sugeridas (produção):

- `new issue` em ambiente `production` → **warning**
- `regression` em ambiente `production` → **critical**
- `event frequency >= 40 events / 5 min` → **critical**
- `event frequency >= 15 events / 5 min` → **warning**
- `transactions p95 > 2500ms / 10 min` (rotas críticas) → **critical**

Canal sugerido: Slack + email de on-call.

### Logtail / Better Stack

Crie alertas para:

1. `level:error` e `statusCode >= 500`
2. palavra-chave `Unhandled promise rejection`
3. palavra-chave `uncaughtException`

Regras sugeridas (produção):

- query: `level:error AND service:mindmap-hub-api` com threshold >= 40 / 5 min → **critical**
- query: `statusCode:>=500` com threshold >= 20 / 5 min → **critical**
- query: `"Unhandled promise rejection" OR "uncaughtException"` com threshold >= 1 / 5 min → **critical**

## Playbook de incidente (rápido)

1. Confirmar alerta (Sentry/Logtail)
2. Coletar `requestId` e endpoint afetado
3. Validar saúde do backend em `/health/detailed`
4. Identificar impacto (auth, mapas, IA, persistência)
5. Mitigar (rollback no Vercel/Render se necessário)
6. Abrir post-mortem com causa raiz e ação preventiva
