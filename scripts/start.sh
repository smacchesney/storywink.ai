echo "DEBUG DATABASE_URL=$DATABASE_URL"
echo "DEBUG DIRECT_URL=$DIRECT_URL"

#!/usr/bin/env bash
set -e

echo "🟢 Running Prisma migrations"
export PRISMA_MIGRATION_DATABASE_URL="$DIRECT_URL"   # ← add this
npx prisma migrate deploy                            # now uses 5432

echo "🟢 Starting Next.js on $PORT"
exec npx next start -p "$PORT"
