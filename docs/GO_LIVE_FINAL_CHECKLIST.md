# ✅ Go-Live Final Checklist

## Pré-go-live técnico

- [ ] `npm run quality:gate` verde
- [ ] `npm run smoke:deploy:public` verde
- [ ] smoke autenticado verde (GitHub Actions)
- [ ] `npm run e2e:critical` verde
- [ ] budget por módulo atendido (`npm run lint:budget:check`)

## Plataforma

- [ ] Frontend Vercel acessível
- [ ] Backend Render saudável (`/health` e `/health/detailed`)
- [ ] Supabase RLS e Realtime validados
- [ ] Claude API com cota válida

## Produto

- [ ] Funil de adoção instrumentado (eventos v1)
- [ ] Métricas de ativação acompanhadas semanalmente
- [ ] Alertas críticos configurados (Sentry + Logtail)

## Segurança

- [ ] Política de rotação aplicada
- [ ] Revisão de acessos concluída
- [ ] Plano de incidente validado
- [ ] Drill de backup/restore com evidência

## Aceite final

- [ ] Executar sessão real com 2-3 usuários (login, criar mapa, editar, IA, salvar)
- [ ] Registrar feedback e bugs de produção (hotfix backlog)
