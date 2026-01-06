#!/bin/bash

# Script to run Supabase migrations using CLI
# Prerequisites: You must run 'npx supabase login' first

echo "🔧 EarnQuest Database Migration"
echo ""

# Check if logged in (attempt to list projects)
echo "📋 Checking Supabase CLI authentication..."
if ! npx supabase projects list &>/dev/null; then
  echo "❌ Not logged in to Supabase CLI"
  echo ""
  echo "Please run: npx supabase login"
  echo "Then run this script again."
  exit 1
fi

echo "✅ Authenticated"
echo ""

# Link project
echo "🔗 Linking to project blstphkvdrrhtdxrllvx..."
npx supabase link --project-ref blstphkvdrrhtdxrllvx

if [ $? -ne 0 ]; then
  echo "❌ Failed to link project"
  echo "Make sure the project ref is correct and you have access to it."
  exit 1
fi

echo "✅ Project linked"
echo ""

# Push migrations
echo "📤 Pushing migrations to remote database..."
npx supabase db push

if [ $? -ne 0 ]; then
  echo "❌ Migration failed"
  echo "Check the error messages above."
  exit 1
fi

echo ""
echo "✅ All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify tables in Supabase Dashboard > Table Editor"
echo "2. Set up OAuth providers (Google, Apple)"
echo "3. Continue with Phase 2 implementation"
