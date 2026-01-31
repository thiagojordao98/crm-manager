#!/bin/bash

# Deploy to Docker Swarm

set -e

echo "🚀 Deploying CRM Manager to Docker Swarm..."

# Check if Docker Swarm is initialized
if ! docker info | grep -q "Swarm: active"; then
    echo "❌ Docker Swarm is not active. Initialize it first:"
    echo "   docker swarm init"
    exit 1
fi

# Load environment variables
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found"
    exit 1
fi

source .env.production

# Create Docker secrets if they don't exist
echo "🔐 Creating Docker secrets..."

echo "$DATABASE_URL" | docker secret create database_url - 2>/dev/null || echo "Secret 'database_url' already exists"
echo "$JWT_SECRET" | docker secret create jwt_secret - 2>/dev/null || echo "Secret 'jwt_secret' already exists"
echo "$POSTGRES_PASSWORD" | docker secret create postgres_password - 2>/dev/null || echo "Secret 'postgres_password' already exists"

# Deploy stack
echo "📦 Deploying Docker stack..."
docker stack deploy -c docker-compose.prod.yml crm

echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service status:"
docker stack services crm

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Services:"
echo "  - Backend: https://api.${DOMAIN}"
echo "  - Frontend: https://app.${DOMAIN}"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker service logs -f crm_backend"
echo "  - Scale backend: docker service scale crm_backend=5"
echo "  - Remove stack: docker stack rm crm"
