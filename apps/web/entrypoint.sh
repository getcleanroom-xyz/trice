#!/bin/sh
set -e
npx drizzle-kit push
exec node server.js
