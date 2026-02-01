// ============================================================================
// MindMap Hub - Application Entry Point
// ============================================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// ============================================================================
// Mount Application
// ============================================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
