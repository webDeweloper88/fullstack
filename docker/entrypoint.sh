#!/usr/bin/env sh
set -e

# Ожидание БД, если нужно (необязательно, но полезно в первый запуск)
if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database..."
  # Простейший ожидатель: 30 попыток
  i=0
  until npx prisma db execute --schema=./prisma/schema.prisma --command "SELECT 1;" >/dev/null 2>&1; do
    i=$((i+1))
    if [ $i -gt 30 ]; then
      echo "Database not reachable, giving up."
      exit 1
    fi
    sleep 2
  done
fi

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Starting app..."
node dist/main.js
