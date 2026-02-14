# 🚬 Smoke de Deploy em Ambiente Real

Script automatizado para validar produção (Vercel + Render + Supabase + Claude):

- Auth (`/api/auth/me`)
- Criação/edição de mapa
- Criação/edição de nó (persistência)
- IA (`/api/ai/chat`)
- Leitura final para confirmar persistência

## Pré-requisitos

1. Backend e frontend publicados.
2. Credencial válida de usuário real (`SMOKE_REFRESH_TOKEN` recomendado).
3. Usuário com acesso a pelo menos um workspace.

## Variáveis

- `SMOKE_FRONTEND_URL` (ex: `https://mindmap-hub.vercel.app`)
- `SMOKE_BACKEND_URL` (ex: `https://mindmap-api.onrender.com`)
- `SMOKE_REFRESH_TOKEN` (refresh token do usuário; recomendado para CI porque não expira em ~1h)
- `SMOKE_BEARER_TOKEN` (access token/JWT do usuário; útil para execuções pontuais, mas expira em ~1h)
- `SMOKE_WORKSPACE_ID` (opcional; usa primeiro do `/api/auth/me`)
- `SMOKE_KEEP_RESOURCES` (opcional, `true` para não deletar mapa de teste)
- `SMOKE_TIMEOUT_MS` (opcional, default `15000`)
- `SMOKE_HEALTH_MAX_ATTEMPTS` (opcional, default `8`)
- `SMOKE_HEALTH_RETRY_DELAY_MS` (opcional, default `12000`)

## Execução

Comando:

- `npm run smoke:deploy`

## Integração com release

Comando único de gate + smoke:

- `npm run release:verify`

## CI/CD automático

Arquivo: `.github/workflows/production-smoke.yml`

- `smoke-public`: executa sempre que workflow é disparado (manual/schedule)
- `smoke-authenticated`: executa quando `SMOKE_REFRESH_TOKEN` ou `SMOKE_BEARER_TOKEN` existir

Para habilitar 100% da automação no GitHub:

1. Defina `SMOKE_FRONTEND_URL` e `SMOKE_BACKEND_URL` em Repository Variables.
2. Defina `SMOKE_REFRESH_TOKEN` em Repository Secrets (recomendado).
3. (Opcional) Defina `SMOKE_BEARER_TOKEN` em Repository Secrets para execuções pontuais.

## Resultado esperado

- Saída final com `Smoke test completed successfully`.
- Em falha, script sai com `exit 1` para bloquear release.

## Nota sobre Render (cold start)

Em serviços que podem entrar em standby, o smoke aplica retry automático no `/health`.
Isso evita falso negativo por aquecimento de instância.
