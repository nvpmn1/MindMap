# 🛡️ Calendário de Revisão de Segurança

## Cadência

- **Semanal:** revisão rápida de alertas críticos (Sentry/Logtail + GitHub security alerts)
- **Mensal:** revisão de acesso aos provedores (Vercel, Render, Supabase, Anthropic)
- **Trimestral:** rotação planejada de secrets críticos
- **Semestral:** exercício de incidente + restore drill completo

## Checklist mensal

- [ ] Revisar membros com acesso administrativo
- [ ] Remover acessos não utilizados
- [ ] Verificar variáveis/secrets por ambiente
- [ ] Confirmar que frontend não expõe secrets sensíveis
- [ ] Revisar dependências com CVEs altos

## Checklist trimestral (rotação)

- [ ] `CLAUDE_API_KEY` rotacionada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` rotacionada
- [ ] `SUPABASE_ANON_KEY` revisada/rotacionada quando necessário
- [ ] `SMOKE_REFRESH_TOKEN` renovado
- [ ] Smoke público e autenticado executados após rotação

## Evidências obrigatórias

- link de PR com atualização dos ambientes
- timestamp da rotação
- resultado de smoke + quality gate
- responsável e aprovador
