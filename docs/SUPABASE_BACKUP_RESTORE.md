# 🛟 Supabase Backup & Restore Drill

## Objetivo

Garantir que backup e restauração do banco são executáveis, auditáveis e reproduzíveis.

## Frequência

- **Drill mínimo:** semanal (ambiente de pré-escala)
- **Obrigatório:** antes de release de alto risco (migração estrutural)

## Pré-requisitos

- `pg_dump` e `psql` instalados
- URL de conexão PostgreSQL do projeto Supabase
- Ambiente alvo de restore (staging/projeto clone)

## Variáveis

- `SUPABASE_DB_URL` → banco principal
- `SUPABASE_RESTORE_DB_URL` → banco de restauração (staging)
- `BACKUP_DIR` (opcional) → diretório de saída

## Execução recomendada

1. **Dry-run / pré-check**

```bash
npm run backup:drill:check
```

1. **Backup lógico**

```bash
pg_dump --format=custom --no-owner --no-privileges --dbname "$SUPABASE_DB_URL" --file "./.reports/backups/mindmap-backup-<timestamp>.dump"
```

1. **Restore em ambiente alvo (staging)**

```bash
psql "$SUPABASE_RESTORE_DB_URL" -v ON_ERROR_STOP=1 -f "./database/0_reset_database.sql"
pg_restore --no-owner --no-privileges --clean --if-exists --dbname "$SUPABASE_RESTORE_DB_URL" "./.reports/backups/mindmap-backup-<timestamp>.dump"
```

1. **Validação pós-restore**

```sql
SELECT now() AS validated_at;
SELECT count(*) FROM maps;
SELECT count(*) FROM nodes;
SELECT count(*) FROM edges;
SELECT count(*) FROM tasks;
```

1. **Validação funcional**

- rodar smoke público
- rodar smoke autenticado
- verificar fluxo UI crítico (E2E)

## Critério de aceite do drill

- backup gerado sem erro
- restore concluído sem erro
- contagens essenciais válidas
- smoke público/autenticado verdes
- incidente/rollback playbook atualizado com learnings

## Riscos comuns e mitigação

- **Senha inválida:** revisar connection string completa.
- **Permissão insuficiente:** usar usuário com role adequada.
- **Restore parcial:** usar `--clean --if-exists` e staging limpo.
- **Divergência de schema:** aplicar migrações antes do restore quando necessário.
