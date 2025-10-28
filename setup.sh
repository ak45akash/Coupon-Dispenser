#!/bin/bash

# Coupon Dispenser Setup Script
# This script helps you get started with the Coupon Dispenser application

set -e

echo "🎟️  Welcome to Coupon Dispenser Setup!"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. You have $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and fill in your credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "   - DATABASE_URL"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check
echo "✅ Type check passed"
echo ""

# Run linting
echo "🔍 Running linter..."
npm run lint
echo "✅ Linting passed"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test -- --passWithNoTests
echo "✅ Tests passed"
echo ""

echo "========================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Supabase credentials"
echo "2. Create a Supabase project at https://supabase.com"
echo "3. Run the SQL schema from supabase/schema.sql"
echo "4. Start the dev server: npm run dev"
echo "5. Open http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Getting started"
echo "   - DEPLOYMENT.md - Deploy to production"
echo "   - WIDGET_INTEGRATION.md - Embed widget"
echo "   - API.md - API reference"
echo "   - TESTING.md - Testing guide"
echo ""
echo "Happy coding! 🚀"

