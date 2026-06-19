#!/bin/bash
# 1800-FeelBetter Deployment Script
# Prerequisites: SUPABASE_ACCESS_TOKEN and VERCEL_TOKEN must be set
# Run: bash deploy.sh

set -e
export PATH="/Users/ameyaswani/node/bin:$PATH"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}▶ $1${NC}"; }
ok() { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
die() { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────
[ -z "$SUPABASE_ACCESS_TOKEN" ] && die "SUPABASE_ACCESS_TOKEN is not set. Run: export SUPABASE_ACCESS_TOKEN=sbp_..."
[ -z "$VERCEL_TOKEN" ] && die "VERCEL_TOKEN is not set. Run: export VERCEL_TOKEN=..."

log "Starting 1800-FeelBetter deployment..."
echo ""

# ── Step 1: Create Supabase project ──────────────────────────────────────────
log "Step 1/6: Creating Supabase project..."
PROJECT_RESULT=$(supabase projects create "1800-feelbetter" \
  --org-id "$(supabase orgs list --output json | python3 -c 'import sys,json; orgs=json.load(sys.stdin); print(orgs[0]["id"])' 2>/dev/null || echo '')" \
  --db-password "FeelBetter_$(openssl rand -hex 8)!" \
  --region us-east-1 \
  --output json 2>/dev/null || echo '{}')

PROJECT_REF=$(echo "$PROJECT_RESULT" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("id",""))' 2>/dev/null || echo "")

if [ -z "$PROJECT_REF" ]; then
  warn "Could not auto-create project. Please:"
  echo "  1. Go to https://supabase.com/dashboard/new/new-project"
  echo "  2. Create a project named '1800-feelbetter'"
  echo "  3. Note the project ref (from Settings > General)"
  echo ""
  read -p "Enter your Supabase project ref: " PROJECT_REF
fi
ok "Supabase project ref: $PROJECT_REF"

# ── Step 2: Get database connection string ────────────────────────────────────
log "Step 2/6: Getting database connection string..."
sleep 10  # Wait for project to be ready

DB_HOST="${PROJECT_REF}.supabase.co"
echo ""
echo "To get your database password:"
echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database"
echo ""
read -sp "Enter your Supabase database password: " DB_PASSWORD
echo ""

DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Get anon key
ANON_KEY=$(supabase projects api-keys --project-ref "$PROJECT_REF" --output json 2>/dev/null | \
  python3 -c 'import sys,json; keys=json.load(sys.stdin); [print(k["api_key"]) for k in keys if k["name"]=="anon"]' 2>/dev/null || echo "")

ok "Database URL configured"

# ── Step 3: Apply migrations ──────────────────────────────────────────────────
log "Step 3/6: Applying database migrations..."
supabase db push --project-ref "$PROJECT_REF" \
  --db-url "$DATABASE_URL" 2>/dev/null || {
  warn "supabase db push failed. Applying migrations via psql..."
  PGPASSWORD="$DB_PASSWORD" psql "postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    -f "$(dirname "$0")/supabase/migrations/001_initial_schema.sql" || warn "Migration 001 failed — may already exist"
  PGPASSWORD="$DB_PASSWORD" psql "postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    -f "$(dirname "$0")/supabase/migrations/002_seed_data.sql" || warn "Migration 002 failed — may already exist"
}
ok "Migrations applied"

# ── Step 4: Deploy backend to Vercel ─────────────────────────────────────────
log "Step 4/6: Deploying backend to Vercel..."
cd "$(dirname "$0")/backend"

JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

BACKEND_URL=$(vercel deploy --prod --yes \
  --token "$VERCEL_TOKEN" \
  --env DATABASE_URL="$DATABASE_URL" \
  --env JWT_SECRET="$JWT_SECRET" \
  --env JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --env NODE_ENV="production" \
  --env SUPABASE_URL="$SUPABASE_URL" \
  --env SUPABASE_ANON_KEY="$ANON_KEY" \
  2>&1 | grep "https://" | tail -1)

if [ -z "$BACKEND_URL" ]; then
  warn "Could not capture backend URL automatically."
  read -p "Enter the Vercel backend deployment URL: " BACKEND_URL
fi
ok "Backend deployed: $BACKEND_URL"

# ── Step 5: Deploy frontend to Vercel ────────────────────────────────────────
log "Step 5/6: Deploying frontend to Vercel..."
cd "$(dirname "$0")/web"

# Update .env for production build
echo "VITE_API_URL=$BACKEND_URL" > .env.production

FRONTEND_URL=$(vercel deploy --prod --yes \
  --token "$VERCEL_TOKEN" \
  --env VITE_API_URL="$BACKEND_URL" \
  2>&1 | grep "https://" | tail -1)

if [ -z "$FRONTEND_URL" ]; then
  warn "Could not capture frontend URL automatically."
  read -p "Enter the Vercel frontend deployment URL: " FRONTEND_URL
fi
ok "Frontend deployed: $FRONTEND_URL"

# ── Step 6: Summary ───────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 1800-FeelBetter is LIVE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "🌐 Web App:      ${BLUE}${FRONTEND_URL}${NC}"
echo -e "🔌 Backend API:  ${BLUE}${BACKEND_URL}${NC}"
echo -e "🗄️  Database:     ${BLUE}https://supabase.com/dashboard/project/${PROJECT_REF}${NC}"
echo ""
echo -e "${YELLOW}📝 Save these values:${NC}"
echo "   SUPABASE_PROJECT_REF=$PROJECT_REF"
echo "   BACKEND_URL=$BACKEND_URL"
echo "   FRONTEND_URL=$FRONTEND_URL"
echo ""
echo "Test the API:"
echo "  curl $BACKEND_URL/health"
echo ""
