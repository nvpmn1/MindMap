const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

// Import routes
const aiRoutes = require('./routes/ai');
const tasksRoutes = require('./routes/tasks');
const nodesRoutes = require('./routes/nodes');
const mindmapsRoutes = require('./routes/mindmaps');
const usersRoutes = require('./routes/users');
const setupRoutes = require('./routes/setup');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'MindMap Backend API'
  });
});

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/mindmaps', mindmapsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/setup', setupRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧠 MindMap Backend Server                               ║
║                                                           ║
║   Status: Running                                         ║
║   Port: ${PORT}                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                           ║
║   Endpoints:                                              ║
║   • GET  /health - Health check                           ║
║   • POST /api/ai/generate-map - Generate mind map         ║
║   • POST /api/ai/expand-node - Expand node with AI        ║
║   • POST /api/ai/summarize - Summarize content            ║
║   • POST /api/ai/chat - Chat with AI assistant            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
