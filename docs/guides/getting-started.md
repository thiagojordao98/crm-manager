# Getting Started with CRM Manager

## Quick Start Guide

This guide will help you set up and run the CRM Manager development environment.

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **Docker** and **Docker Compose**
- **Git**

### 1. Initial Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd crm-manager

# Run the automated setup script
./scripts/setup-dev.sh
```

The setup script will:

- Verify prerequisites
- Create `.env` file from template
- Install all dependencies
- Start Docker services (PostgreSQL, Redis, pgAdmin)

### 2. Configure Environment

Edit the `.env` file with your configuration:

```bash
# Open .env in your editor
nano .env  # or use your preferred editor
```

**Required configurations:**

- `JWT_SECRET`: Change to a secure random string (minimum 32 characters)
- Database credentials (if you changed them in docker-compose.yml)

### 3. Initialize Database

```bash
# Run database migrations
npm run migrate

# (Optional) Seed sample data
npm run seed
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start them individually:
npm run dev:frontend  # Frontend only (http://localhost:5173)
npm run dev:backend   # Backend only (http://localhost:3000)
```

### 5. Access the Application

Once started, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **pgAdmin**: http://localhost:5050
  - Email: `admin@crm-manager.com`
  - Password: `admin`

## Project Structure

```
crm-manager/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # React + Vite application
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── docker-compose.yml    # Development environment
└── package.json          # Root workspace configuration
```

## Common Commands

### Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Docker

```bash
# Start Docker services
npm run docker:dev

# View logs
npm run docker:dev:logs

# Stop Docker services
npm run docker:dev:down

# Rebuild containers
docker-compose up -d --build
```

### Database

```bash
# Create a new migration
npm run migrate:create

# Run migrations
npm run migrate

# Seed database
npm run seed

# Backup database
./scripts/backup.sh
```

## Development Workflow

### 1. Backend Development

```bash
cd apps/backend

# Watch mode (auto-reload)
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

### 2. Frontend Development

```bash
cd apps/frontend

# Start dev server
npm run dev

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Build for production
npm run build
```

## Troubleshooting

### Docker Services Won't Start

```bash
# Check if ports are already in use
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :6379  # Redis
sudo lsof -i :5050  # pgAdmin

# Stop all containers and restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs crm-postgres

# Connect to database manually
docker exec -it crm-postgres psql -U crm_user -d crm_db
```

### Node Module Issues

```bash
# Clean install
rm -rf node_modules apps/*/node_modules
npm install

# Clear npm cache if needed
npm cache clean --force
```

### Port Already in Use

```bash
# Find process using port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Find process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

## Testing

### Backend Tests

```bash
cd apps/backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
cd apps/frontend

# Run tests
npm run test

# Run with UI
npm run test:ui

# Coverage
npm run test:coverage
```

## Code Quality

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format all files
npm run format

# Check formatting
npm run format:check
```

## Environment Variables

### Development (.env)

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://crm_user:crm_password@localhost:5432/crm_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### Production

For production, create `.env.production` with:

- Secure JWT_SECRET
- Production database URL
- Production API keys
- HTTPS URLs

## Next Steps

1. **Explore the codebase**: Familiarize yourself with the project structure
2. **Read the documentation**: Check `/docs` for detailed information
3. **Setup integrations**: Configure WhatsApp, Telegram, etc. (see `TECHNICAL_DECISIONS.md`)
4. **Start developing**: Pick a feature from the roadmap and start coding!

## Useful Resources

- [Project Proposal](../PROJECT_PROPOSAL.md) - Complete project overview
- [Technical Decisions](../TECHNICAL_DECISIONS.md) - Architecture decisions and rationale
- [Architecture](../ARCHITECTURE.md) - Detailed system architecture
- [File Structure](../FILE_STRUCTURE.md) - Complete file organization
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the documentation in `/docs`
3. Open an issue on GitHub
4. Contact the development team

---

**Happy coding! 🚀**
