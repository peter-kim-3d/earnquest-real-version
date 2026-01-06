#!/bin/bash

# Script to run Supabase migrations
# Make sure your .env.local file has the correct SUPABASE credentials

# Load environment variables
set -a
source .env.local
set +a

# Check if variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ "$NEXT_PUBLIC_SUPABASE_URL" == "https://your-project.supabase.co" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
    echo "Please update .env.local with your actual Supabase project URL"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" == "your-service-role-key" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set in .env.local"
    echo "Please update .env.local with your actual Supabase service role key"
    exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')

echo "🔧 Running migrations for project: $PROJECT_REF"
echo ""

# Run migrations using npx supabase
npx supabase db push \
  --db-url "postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --include-all

echo ""
echo "✅ Migrations complete!"
