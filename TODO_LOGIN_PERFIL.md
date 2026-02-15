# TODO LIST - Login + Perfil (Contas Fixas)

## Backend
- [x] Remover rotas de magic link/OTP e refresh.
- [x] Criar endpoint publico `GET /api/auth/accounts` (sem senha) para listar as 3 contas permitidas.
- [x] Provisionar automaticamente as 3 contas no startup (Supabase Auth) + perfil + membership no workspace padrao.
- [x] Bloquear qualquer email fora da lista no middleware `authenticate`.
- [x] Ajustar `/api/setup/seed` para nao criar usuarios novos (somente seed para o admin atual).

## Frontend
- [x] Refazer tela de login para `email + senha` (sem callback, sem magic link) com selecao das 3 contas.
- [x] Remover fluxo de `AuthCallbackPage` e referencias.
- [x] Remover fallback de login por headers `x-profile-*`.
- [x] Adicionar pagina `/profile` para editar nome e avatar.
- [x] Atualizar sidebar e breadcrumb para incluir Perfil.

## Qualidade
- [x] Atualizar E2E para novo login.
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`

## Proximos (nao fazer agora)
- [ ] (Opcional) Atualizar docs que mencionam magic link.
- [ ] (Futuro) Implementar cadastro/criacao de contas + recuperacao de senha.
