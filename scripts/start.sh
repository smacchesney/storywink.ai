#!/usr/bin/env bash
set -e       # exit on first error

echo "🟢 Running Prisma migrations…"
npx prisma migrate deploy

echo "🟢 Starting Next.js on $PORT"
exec npx next start -p "$PORT"   # replace with your real start cmd
