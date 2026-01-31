#!/bin/bash

# Setup development environment script

set -e

echo "🚀 Setting up CRM Manager development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 20.0.0"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be >= 20.0.0 (current: $(node -v))"
    exit 1
fi

echo "✅ Docker, Docker Compose, and Node.js are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL, Redis, pgAdmin)..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker services are running"
else
    echo "❌ Failed to start Docker services"
    exit 1
fi

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update .env file with your configuration"
echo "  2. Run 'npm run migrate' to set up the database"
echo "  3. Run 'npm run seed' to seed sample data (optional)"
echo "  4. Run 'npm run dev' to start development servers"
echo ""
echo "🌐 Services:"
echo "  - Frontend:  http://localhost:5173"
echo "  - Backend:   http://localhost:3000"
echo "  - pgAdmin:   http://localhost:5050 (admin@crm-manager.com / admin)"
echo ""
