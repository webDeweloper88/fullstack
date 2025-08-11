#!/usr/bin/env sh
set -e

PRISMA="./node_modules/.bin/prisma"

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database..."
  i=0
  until $PRISMA db execute --schema=./prisma/schema.prisma --command "SELECT 1;" >/dev/null 2>&1; do
    i=$((i+1))
    if [ $i -gt 30 ]; then
      echo "Database not reachable, giving up." >&2
      # Покажем попытку подключения (без пароля) для дебага:
      echo "Tried DATABASE_URL host: $(echo "$DATABASE_URL" | sed -E 's#.+@([^:/]+).*#\1#')" >&2
      exit 1
    fi
    sleep 2
  done
fi

echo "Running prisma migrate deploy..."
$PRISMA migrate deploy

echo "Starting app..."
node dist/main.js
