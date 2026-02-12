# 🎯 Metas de Qualidade por Módulo (Warning Budget)

Este documento define o orçamento máximo de warnings por área para controle de dívida técnica.

## Fonte de verdade

- Arquivo de budget: `docs/quality/module-warning-budget.json`
- Verificação: `npm run lint:budget:check`

## Política

1. Cada módulo tem um teto (`maxWarnings`).
2. Se `currentWarnings > maxWarnings`, o check falha.
3. Alteração de budget exige justificativa + owner + sprint.
4. `targetWarnings` define a meta da sprint (não bloqueia sozinha, mas é reportada no check).

## Fluxo recomendado

1. `npm run lint:baseline:check`
2. `npm run lint:budget:check`
3. Ajustar código até cumprir budget
4. Atualizar baseline apenas após ganho consolidado

## Governança

- Owner por área obrigatório no JSON de budget.
- Revisão semanal dos módulos em risco (<= 5 warnings de folga).
- Meta global atual: sair de 938 para 750 warnings (Sprint 2).
