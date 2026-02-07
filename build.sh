#!/bin/bash
set -e

echo "🔨 Building MindMap Hub Backend..."
cd backend
echo "📦 Installing dependencies..."
npm install
echo "🏗️  Compiling TypeScript..."
npm run build
echo "✅ Build complete!"
