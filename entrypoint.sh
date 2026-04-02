#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push --skip-generate

echo "Running seed..."
npx tsx lib/db/seed.ts --silent

echo "Starting application..."
exec node server.js
