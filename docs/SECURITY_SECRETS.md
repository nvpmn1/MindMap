# 🔐 Segurança de Secrets (Supabase / Claude / Deploy)

## Regra de ouro

- **Nunca** compartilhar chaves completas em chat, issue, commit, print ou doc público.
- Se uma chave foi exposta, trate como comprometida e faça rotação imediata.

## Política formal de rotação

- **Crítico (produção):** rotação trimestral obrigatória
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CLAUDE_API_KEY`
- **Operacional (automação):** rotação mensal
  - `SMOKE_BEARER_TOKEN`
- **Revisão de necessidade:** mensal
  - `SUPABASE_ANON_KEY` (rotacionar quando houver evidência de abuso)

## SLA de resposta para vazamento

- Detecção de vazamento: abertura de incidente em até **5 min**
- Revogação do segredo comprometido: até **15 min**
- Reemissão + atualização de ambiente: até **30 min**
- Validação completa (smoke + health): até **60 min**

## Rotação recomendada (quando houver exposição)

### 1) Claude API

1. Revogar chave antiga no console Anthropic.
2. Gerar nova chave.
3. Atualizar `CLAUDE_API_KEY` no Render.
4. Redeploy backend.

### 2) Supabase Service Role

1. Rotacionar secrets no projeto Supabase.
2. Atualizar `SUPABASE_SERVICE_ROLE_KEY` no Render.
3. Confirmar que frontend usa apenas `anon key`.
4. Redeploy backend.

### 3) Supabase Anon Key

1. Rotacionar key pública se houver necessidade operacional.
2. Atualizar `VITE_SUPABASE_ANON_KEY` no Vercel.
3. Redeploy frontend.

## Checklist pós-rotação

- [ ] `health` e `health/detailed` respondendo
- [ ] login/auth funcionando
- [ ] operações de mapa e persistência funcionando
- [ ] IA respondendo com Claude
- [ ] smoke em produção (`npm run smoke:deploy`) aprovado

## Revisão periódica de segurança

- Revisar acessos admin em Render/Vercel/Supabase/Anthropic mensalmente.
- Remover contas inativas e tokens sem dono conhecido.
- Revisar eventos de auditoria e alertas críticos semanalmente.
- Executar calendário operacional em `docs/SECURITY_REVIEW_CALENDAR.md`.

## Governança (owner e aprovação)

- Toda rotação deve registrar:
  - responsável técnico,
  - aprovador,
  - timestamp,
  - evidência de validação pós-rotação.
- Mudanças de segredo em produção sem evidência são consideradas não conformes.

## Boas práticas contínuas

- Ativar proteção de secrets no Git provider.
- Usar variáveis de ambiente separadas por ambiente (prod/staging/dev).
- Revisar acesso de equipe a dashboards (Render/Vercel/Supabase/Anthropic).
