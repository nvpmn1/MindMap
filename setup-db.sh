#!/bin/bash
# Script para executar schema.sql no Supabase

echo "🧠 MindMap - Setup do Banco de Dados"
echo "===================================="
echo ""
echo "Este script executará o schema SQL no Supabase."
echo ""
echo "Instruções manuais:"
echo ""
echo "1. Abra: https://mvkrlvjyocynmwslklzu.supabase.co"
echo "2. Login com suas credenciais"
echo "3. Vá em: SQL Editor > New Query"
echo "4. Cole o conteúdo do arquivo: database/schema.sql"
echo "5. Clique em 'Run'"
echo ""
echo "Ou use este comando psql se tiver PostgreSQL instalado:"
echo ""
echo "psql -h mvkrlvjyocynmwslklzu.supabase.co -U postgres -d postgres -f database/schema.sql"
echo ""
echo "Pressione Enter para abrir o Supabase Dashboard..."
read

# Open Supabase dashboard
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://mvkrlvjyocynmwslklzu.supabase.co/project/mvkrlvjyocynmwslklzu/sql/new"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://mvkrlvjyocynmwslklzu.supabase.co/project/mvkrlvjyocynmwslklzu/sql/new"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    start "https://mvkrlvjyocynmwslklzu.supabase.co/project/mvkrlvjyocynmwslklzu/sql/new"
fi
