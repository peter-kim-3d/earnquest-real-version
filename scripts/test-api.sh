#!/bin/bash

# Load env vars
export $(grep -v '^#' .env.local | xargs)

echo "Testing Supabase API access..."
echo ""
echo "URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Test with service role key
echo "Testing families table with service role key..."
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/families?select=*&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.' || echo "jq not installed, showing raw output"

echo ""
echo "Testing task_templates table..."
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/task_templates?select=name&limit=3" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
