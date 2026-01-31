# CRM Manager

Multi-channel CRM for unified customer communication management via WhatsApp, Telegram, Discord, Slack, and Trello, with integrated payment processing.

## 🚀 Features

- **Multi-Channel Communication**: Unified inbox for WhatsApp, Telegram, Discord, Slack
- **Real-time Messaging**: WebSocket-based instant updates
- **Sales Pipeline**: Visual Kanban board for deal management
- **Payment Integration**: Mercado Pago and Stripe support
- **Task Management**: Trello synchronization
- **Contact Management**: Complete customer profiles and history
- **Team Collaboration**: User roles and conversation assignment

## 🏗️ Architecture

- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4
- **Backend**: NestJS 10 + TypeScript
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Cache/Queue**: Redis 7 + Bull MQ
- **Real-time**: Socket.io with Redis adapter
- **Infrastructure**: Docker + Docker Swarm

## 📋 Prerequisites

- Node.js >= 20.0.0
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

## 🛠️ Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd crm-manager
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Development Environment

```bash
# Start all services (PostgreSQL, Redis, pgAdmin)
npm run docker:dev

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed

# Start development servers
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- pgAdmin: http://localhost:5050

### 4. Development Workflow

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## 📦 Project Structure

```
crm-manager/
├── apps/
│   ├── frontend/          # React application
│   └── backend/           # NestJS application
├── docs/                  # Documentation
├── scripts/               # Build and deployment scripts
├── docker-compose.yml     # Development environment
└── package.json           # Root package.json (monorepo)
```

## 🔧 Available Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `npm run dev`        | Start both frontend and backend |
| `npm run build`      | Build both applications         |
| `npm run test`       | Run all tests                   |
| `npm run lint`       | Lint all code                   |
| `npm run format`     | Format all code                 |
| `npm run docker:dev` | Start Docker services           |
| `npm run migrate`    | Run database migrations         |
| `npm run seed`       | Seed database with sample data  |

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild services
docker-compose up -d --build
```

## 📚 Documentation

- [Project Proposal](./PROJECT_PROPOSAL.md)
- [Technical Decisions](./TECHNICAL_DECISIONS.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [File Structure](./FILE_STRUCTURE.md)
- [API Documentation](./docs/api/)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Frontend tests only
npm run test:frontend

# Backend tests only
npm run test:backend

# Test coverage
npm run test:cov
```

## 🚀 Deployment

See [Deployment Guide](./docs/guides/deployment.md) for production deployment instructions.

## 📝 License

MIT

## 👥 Team

CRM Manager Team

## 🤝 Contributing

See [Contributing Guide](./docs/guides/contributing.md) for details.
