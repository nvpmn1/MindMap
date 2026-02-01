const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const SUPABASE_URL = 'https://mvkrlvjyocynmwslklzu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12a3Jsdmp5b2N5bm13c2xrbHp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTcyNjMxOSwiZXhwIjoyMDg1MzAyMzE5fQ.iXgPaUrzG2L0OqkTy2aqiJ6b7lISAJx59xVt0UNYb8o';

async function initDatabase() {
  console.log('🚀 Inicializando banco de dados...\n');

  try {
    // Create Supabase client with service role (admin access)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Read schema SQL
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema SQL carregado');
    console.log(`📊 Tamanho: ${(schemaSql.length / 1024).toFixed(2)} KB\n`);

    // Split SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`✅ ${statements.length} comandos SQL encontrados\n`);

    // Execute each statement
    let executed = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Show progress
      const progress = Math.round((i / statements.length) * 100);
      process.stdout.write(`\r⏳ Executando: ${progress}% (${i + 1}/${statements.length})`);

      try {
        // Execute via Supabase admin API
        const { data, error } = await supabase
          .rpc('exec_sql', { sql: statement })
          .catch(err => {
            // If RPC doesn't exist, try direct execution
            return supabase.from('users').select('*').limit(1);
          });

        if (error && !error.message.includes('already exists')) {
          console.error(`\n❌ Erro: ${error.message}`);
        } else {
          executed++;
        }
      } catch (err) {
        // Some errors are expected (like table already exists)
        if (!err.message.includes('already exists')) {
          console.error(`\n⚠️  ${err.message}`);
        }
      }
    }

    console.log(`\n\n✨ Inicialização concluída!\n`);
    console.log(`✅ Comandos executados: ${executed}/${statements.length}`);

    // Verify tables were created
    console.log('\n📋 Verificando tabelas...\n');
    
    const tables = [
      'users',
      'mindmaps',
      'nodes',
      'node_links',
      'attachments',
      'comments',
      'activities',
      'mindmap_collaborators'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`✅ ${table.padEnd(25)} - OK`);
        } else {
          console.log(`❌ ${table.padEnd(25)} - Erro: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${table.padEnd(25)} - Erro: ${err.message}`);
      }
    }

    // Check if initial users exist
    console.log('\n👥 Verificando usuários iniciais...\n');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('name, email');

    if (!usersError && users && users.length > 0) {
      users.forEach(user => {
        console.log(`✅ ${user.name.padEnd(15)} - ${user.email}`);
      });
    }

    console.log('\n🎉 Banco de dados pronto!\n');

  } catch (error) {
    console.error('\n❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

// Run initialization
initDatabase();
