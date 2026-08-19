#!/bin/sh
set -e
# Vercel often has DIRECT_URL defined but empty. Prisma then fails P1012.
if [ -z "$DIRECT_URL" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi
npx prisma generate
npx prisma migrate deploy
npx next build
