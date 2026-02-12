# 🚨 Incident Runbook (produção)

## Objetivo

Reduzir MTTR com um fluxo padronizado para incidentes de frontend, backend, auth, IA e persistência.

## Níveis de severidade

- **SEV-1 (Crítico):** indisponibilidade total, perda de dados, auth quebrado globalmente.
- **SEV-2 (Alto):** falha em fluxo crítico (criar mapa, salvar nó, IA) com impacto amplo.
- **SEV-3 (Médio):** degradação parcial, workaround disponível.

## SLA operacional

- **SEV-1:** triagem em até 5 min, mitigação em até 15 min.
- **SEV-2:** triagem em até 15 min, mitigação em até 60 min.
- **SEV-3:** triagem no mesmo dia, correção planejada.

## Gatilhos automáticos

- Sentry/Logtail `critical` conforme `docs/OBSERVABILITY.md`.
- Falha em `smoke-authenticated`.
- `/health` fora de 200 por janela de 5 min.

## War Room Checklist (0-15 min)

1. Confirmar severidade e abrir incidente.
2. Coletar evidências: endpoint, requestId, deploy SHA, timestamps.
3. Conferir saúde:
   - `GET /health`
   - `GET /health/detailed`
4. Verificar dashboards:
   - Sentry issues/regressions
   - Logtail erro 5xx/unhandled
   - Render/Vercel status
5. Classificar domínio do incidente:
   - Auth
   - Persistência (maps/nodes)
   - IA (`/api/ai/chat`)
   - Frontend runtime

## Mitigação por cenário

### A) Backend indisponível / 5xx alto

1. Rollback no Render para o último deploy estável.
2. Validar `/health` e `/health/detailed`.
3. Rodar smoke público.
4. Se auth envolvido, rodar smoke autenticado.

### B) Frontend quebrado (runtime)

1. Rollback no Vercel para deploy anterior.
2. Validar carregamento `/`, `/login`, `/maps`.
3. Rodar E2E crítico.

### C) IA instável (Claude)

1. Verificar `CLAUDE_API_KEY`/cota no provider.
2. Reduzir impacto via fallback de UX (mensagem degradada).
3. Reexecutar smoke autenticado com etapa IA.

### D) Persistência inconsistente

1. Bloquear novas gravações se necessário (feature flag/maintenance).
2. Validar integridade de `maps`, `nodes`, `edges`.
3. Se corrupção confirmada, iniciar procedimento de restore (runbook backup).

## Critério de recuperação

- Smoke público **verde**.
- Smoke autenticado **verde** (sem `401` inesperado).
- Erro crítico estabilizado por 15 min.
- Sem regressão nova em Sentry.

## Comunicação

1. Aviso inicial (impacto + escopo + ETA preliminar).
2. Atualizações a cada 15 min em SEV-1/2.
3. Encerramento com causa raiz preliminar.

## Post-mortem (até 24h)

- Linha do tempo completa.
- Causa raiz e fator contribuinte.
- Ações corretivas (curto prazo).
- Ações preventivas (longo prazo).
- Dono e prazo por ação.
