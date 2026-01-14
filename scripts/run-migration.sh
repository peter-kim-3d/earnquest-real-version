#!/bin/bash

# EarnQuest Task System v2 - Migration Runner
# This script helps you run migrations safely

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   EarnQuest Task System v2 - Migration Runner             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Supabase CLI is installed
print_step "Checking for Supabase CLI..."
if command -v supabase &> /dev/null; then
    print_success "Supabase CLI found: $(supabase --version)"
    HAS_CLI=true
else
    print_warning "Supabase CLI not found"
    HAS_CLI=false
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "PRE-MIGRATION CHECKLIST"
echo "════════════════════════════════════════════════════════════"
echo ""

# Pre-migration checklist
read -p "❓ Have you backed up your database? (y/n): " backup
if [ "$backup" != "y" ]; then
    print_error "Please backup your database first!"
    echo "   Go to: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/settings/backups"
    exit 1
fi

read -p "❓ Are you running this on a test/staging database first? (y/n): " staging
if [ "$staging" != "y" ]; then
    print_warning "CAUTION: You're about to modify production database!"
    read -p "   Are you ABSOLUTELY sure? Type 'YES' to continue: " confirm
    if [ "$confirm" != "YES" ]; then
        print_error "Migration cancelled. Test on staging first!"
        exit 1
    fi
fi

echo ""
print_success "Pre-flight checks passed!"
echo ""

# Choose migration method
echo "════════════════════════════════════════════════════════════"
echo "MIGRATION METHOD"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Choose how to run migrations:"
echo ""
echo "1) Supabase CLI (Recommended - Automatic)"
echo "2) Manual SQL (Copy/paste in Supabase Studio)"
echo "3) Show migration files (I'll run them myself)"
echo ""
read -p "Enter choice (1-3): " method

case $method in
    1)
        if [ "$HAS_CLI" = false ]; then
            print_error "Supabase CLI not installed!"
            echo ""
            echo "Install with:"
            echo "  brew install supabase/tap/supabase"
            echo "  OR"
            echo "  npm install -g supabase"
            exit 1
        fi

        print_step "Running migrations with Supabase CLI..."
        echo ""

        # Check if already linked
        if [ -f ".git/config" ]; then
            print_step "Linking to Supabase project..."
            supabase link --project-ref blstphkvdrrhtdxrllvx || true
        fi

        print_step "Applying migrations..."
        supabase db push

        print_success "Migrations applied!"
        ;;

    2)
        echo ""
        print_step "Manual SQL Migration Instructions:"
        echo ""
        echo "1. Open Supabase SQL Editor:"
        echo "   https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql"
        echo ""
        echo "2. Run these files IN ORDER:"
        echo ""
        echo "   📄 Migration 1: supabase/migrations/020_task_system_v2_enums.sql"
        echo "      (Adds v2 columns, migrates data)"
        echo ""
        echo "   📄 Migration 2: supabase/migrations/021_task_system_v2_templates.sql"
        echo "      (Inserts 13 v2 templates)"
        echo ""
        echo "   📄 Migration 3: supabase/migrations/022_task_completions_v2.sql"
        echo "      (Updates task_completions table)"
        echo ""
        echo "3. After each file, click 'Run' and verify no errors"
        echo ""
        read -p "Press Enter when done..."
        ;;

    3)
        echo ""
        print_step "Migration files location:"
        echo ""
        ls -lh supabase/migrations/02*.sql
        echo ""
        echo "Run them in this order:"
        echo "  1. 020_task_system_v2_enums.sql"
        echo "  2. 021_task_system_v2_templates.sql"
        echo "  3. 022_task_completions_v2.sql"
        echo ""
        ;;

    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════"
echo "VERIFICATION"
echo "════════════════════════════════════════════════════════════"
echo ""
print_step "Next steps:"
echo ""
echo "1. Run verification script in Supabase SQL Editor:"
echo "   File: scripts/verify-migration.sql"
echo "   URL: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql"
echo ""
echo "2. Check for these key metrics:"
echo "   • Task Templates: Should be 13"
echo "   • Invalid Categories: Should be 0"
echo "   • Invalid Approval Types: Should be 0"
echo ""
echo "3. Test the application:"
echo "   • Create new family"
echo "   • Select 'Balanced' preset"
echo "   • Verify 7 tasks created"
echo "   • Test timer task"
echo "   • Test checklist task"
echo ""
print_success "Migration process complete!"
echo ""
echo "📖 Full guide: MIGRATION_GUIDE.md"
echo "🆘 Issues? Check troubleshooting section in guide"
echo ""
