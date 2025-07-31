#!/bin/bash

echo "🧹 Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "🔨 Rebuilding application..."
npm run build

echo "✅ Clean build complete!"
echo "Run 'npm run dev' to start the development server"