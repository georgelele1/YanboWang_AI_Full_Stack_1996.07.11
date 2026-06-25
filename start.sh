#!/bin/sh
set -e

echo "▶ Pushing schema to database..."
node_modules/.bin/prisma migrate deploy

echo "▶ Starting Next.js server..."
exec node server.js
