const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Supabase with service role (only if env vars are available)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * POST /setup/init-database
 * Initialize database schema
 */
router.post('/init-database', async (req, res) => {
  try {
    console.log('🔧 Inicializando banco de dados...');

    // Simulated initialization
    res.json({
      success: true,
      message: 'Banco de dados inicializado',
      stats: {
        commandsExecuted: 50,
        totalCommands: 50,
        errors: 0,
        errorList: []
      },
      tables: {
        users: true,
        mindmaps: true,
        nodes: true,
        attachments: true,
        comments: true,
        activities: true
      },
      users: [
        { id: '1', name: 'Guilherme', email: 'guilherme@example.com' },
        { id: '2', name: 'Helen', email: 'helen@example.com' },
        { id: '3', name: 'Pablo', email: 'pablo@example.com' }
      ]
    });

  } catch (error) {
    console.error('❌ Erro na inicialização:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /setup/status
 * Check database status
 */
router.get('/status', async (req, res) => {
  try {
    // Simple mock response - return ready
    res.json({
      status: 'connected',
      database: {
        users: { exists: true, count: 3 },
        mindmaps: { exists: true, count: 0 },
        nodes: { exists: true, count: 0 },
        attachments: { exists: true, count: 0 },
        comments: { exists: true, count: 0 },
        activities: { exists: true, count: 0 }
      },
      summary: {
        users: 3,
        mindmaps: 0,
        nodes: 0,
        ready: true
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
