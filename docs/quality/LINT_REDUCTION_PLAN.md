# 🧹 Lint Warning Baseline + Plano de Redução por Sprint

## Objetivo

Congelar o baseline atual de warnings e impedir regressão por módulo.

## Comandos

- Gerar baseline inicial:
  - `npm run lint:baseline:write`
- Validar sem regressão:
  - `npm run lint:baseline:check`
- Gate completo:
  - `npm run quality:gate`

O snapshot fica em: `docs/quality/lint-baseline.json`.
Warning budget por módulo fica em: `docs/quality/module-warning-budget.json`.

## Política

1. **Nenhum módulo pode aumentar warnings** em relação ao baseline.
2. Redução mínima planejada por sprint:
   - Sprint 1: -10%
   - Sprint 2: -20% acumulado
   - Sprint 3: -30% acumulado
3. Warnings novos só entram com justificativa explícita e plano de remoção.
4. Todo módulo deve respeitar seu `maxWarnings` definido no warning budget.

## Estratégia de execução por módulo

### Sprint 1

- `backend/src/routes/**`
- `backend/src/middleware/**`

#### Resultado (Sprint 1 - concluído)

- Baseline inicial: **1169 warnings**
- Atual após correções seguras + auto-fix controlado: **938 warnings**
- Redução absoluta: **231 warnings**
- Redução percentual: **19,76%**
- Meta mínima da sprint: **10%** ✅ **superada**

#### Como manter o ganho (obrigatório)

1. Executar `npm run lint:baseline:write` para congelar o novo patamar.
2. Em PRs, bloquear regressão com `npm run lint:baseline:check`.
3. Qualquer exceção de warning novo deve incluir:

- justificativa técnica,
- data limite de remoção,
- referência no plano da sprint corrente.

### Sprint 2

- `backend/src/ai/**`
- `backend/src/services/**`

Meta operacional Sprint 2:

- reduzir warnings globais de **938** para **<= 750**
- cumprir `npm run lint:budget:check` sem regressão por módulo

### Sprint 3

- `frontend/src/components/mindmap/**`
- `frontend/src/lib/**`

Meta operacional Sprint 3:

- manter frontend em **0 warnings**
- reduzir backend para **<= 650 warnings**

## Definição de pronto para cada módulo

- Warnings reduzidos sem abrir novos erros de runtime.
- `typecheck` e `build` verdes.
- Smoke test de fluxo principal validado.
