# 📌 Decisões Técnicas e Pendências

## Decisões Implementadas (2026-02-02)

1. **Auth sem senha (perfil)**
   - Modo alternativo ativado por `ALLOW_PROFILE_AUTH=true`.
   - Backend aceita headers `x-profile-*` quando não há token Supabase.
   - Cria `profiles` e `workspace_members` automaticamente no workspace padrão.

2. **Workspace padrão**
   - `DEFAULT_WORKSPACE_ID=11111111-1111-1111-1111-111111111111`.
   - Workspace é criado automaticamente se não existir.

3. **Persistência mínima funcional**
   - Editor carrega/salva via API quando `mapId` é UUID.
   - Fallback localStorage quando API falha.

4. **IA backend-first**
   - `aiAgent` tenta backend e cai para simulação local se a API falhar.

5. **Views sincronizadas**
   - Map/List/Kanban na mesma base de nós/edges.

---

## Pendências (curto prazo)

- **Performance extra**: virtualização de lista e batch update de posições.
- **Testes manuais**: validar CRUD mapa/nó e IA expandir.
- **Documentar fluxos críticos** (auth perfil, persistência remota, fallback local).

---

## Observações

- `profiles.id` usa UUIDs para compatibilidade com o backend.
- `ai_runs` depende de `CLAUDE_API_KEY` válido no backend.
