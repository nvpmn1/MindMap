# 📈 Métricas de Produto e Funil de Adoção

## Objetivo

Medir adoção real da plataforma, identificar gargalos de conversão e orientar priorização com dados.

## North Star Metric

- **NSM:** usuários ativos semanais que criaram ou editaram ao menos 1 mapa (`WAU_active_map_editors`).

## Funil principal (Activation Funnel)

1. `app_opened`
2. `login_profile_selected`
3. `login_success`
4. `maps_viewed`
5. `map_created`
6. `map_editor_opened`
7. `node_created`
8. `ai_chat_requested`
9. `map_saved`

## KPIs por etapa

- **Open → Login Success:** taxa de autenticação
- **Login Success → Map Created:** taxa de ativação inicial
- **Map Created → Node Created:** taxa de uso editor
- **Node Created → AI Chat:** taxa de adoção IA
- **D1 / D7 retention:** retenção de usuários ativos

## Fórmulas recomendadas

- `activation_rate = map_created_users / login_success_users`
- `editor_engagement_rate = node_created_users / map_created_users`
- `ai_adoption_rate = ai_chat_users / map_editor_opened_users`
- `d7_retention = users_day_7 / users_day_0`

## Thresholds operacionais (pré-escala)

- `activation_rate >= 50%`
- `editor_engagement_rate >= 70%`
- `ai_adoption_rate >= 25%`
- `d7_retention >= 20%`

## Eventos instrumentados (v1)

- `app_opened`
- `login_profile_selected`
- `login_success`
- `maps_viewed`
- `map_created`
- `map_create_failed`
- `map_deleted`
- `map_duplicated`

## Dimensões recomendadas

- `workspace_id`
- `user_id` (hash/anônimo quando aplicável)
- `environment` (`production`, `staging`)
- `release_version`
- `source` (`ui`, `smoke`, `api`)

## Cadência de revisão

- **Semanal:** review de funil + principais quedas
- **Quinzenal:** ajustes de UX com base nos gargalos
- **Mensal:** revisão de metas e evolução de retenção

## Playbook de decisão

- Queda de `activation_rate`: revisar onboarding/login UX
- Queda de `editor_engagement_rate`: melhorar empty state + criação guiada
- Queda de `ai_adoption_rate`: melhorar CTA de IA no editor
- Queda de retenção D7: investigar performance + confiabilidade de persistência
