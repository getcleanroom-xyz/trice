#!/bin/sh
set -e
echo "Running schema push..."
timeout 60 npx drizzle-kit push || echo "WARN: Schema push failed or timed out"
echo "Starting Next.js..."
exec node server.js
