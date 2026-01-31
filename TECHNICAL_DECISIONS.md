# Technical Decisions & Recommendations

## Open Questions - Answered

### 1. Authentication: SSO vs Local Credentials

**Question:** Implementar SSO (Google/Microsoft) além de email/senha, ou apenas credenciais locais inicialmente?

**Recommendation:** **Start with local credentials, add SSO in Phase 2**

**Rationale:**

- Start with email/password + JWT for MVP (faster time to market)
- Implement Passport local strategy first
- Add Google OAuth as next priority (widely used in Brazil)
- Microsoft OAuth for enterprise clients (Phase 3)
- Allows focusing on core CRM features first

**Implementation:**

```typescript
// Phase 1: Local authentication
- Email/password with bcrypt hashing
- JWT access tokens (15min expiry)
- Refresh tokens (7 days expiry)
- Password reset via email

// Phase 2: Add Google SSO
- Passport Google OAuth strategy
- Account linking for existing users
- Option to set password after SSO signup

// Phase 3: Microsoft SSO (enterprise)
- Azure AD integration
- SAML 2.0 support for enterprise clients
```

---

### 2. Multi-tenancy: Shared vs Dedicated Database

**Question:** Sistema será multi-tenant (um banco para múltiplas empresas) ou single-tenant (instância por cliente)?

**Recommendation:** **Multi-tenant with row-level isolation**

**Rationale:**

- Lower infrastructure costs for early stage
- Easier maintenance and updates
- Single codebase deployment
- Suitable for SME market
- Can migrate large clients to dedicated instances later

**Implementation Strategy:**

```typescript
// Database Schema
- Add `organizationId` (UUID) to all tenant-specific tables
- PostgreSQL Row Level Security (RLS) policies
- Application-level tenant isolation in all queries
- Shared tables: users, organizations, subscriptions
- Isolated tables: contacts, conversations, messages, deals

// Drizzle Schema Example
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // ... other fields
});

// Middleware
- Request context includes organizationId from JWT
- All queries automatically filtered by organizationId
- Prevent cross-tenant data leaks with automated tests
```

**Security Measures:**

- JWT contains organizationId claim
- All API endpoints validate organization ownership
- Database indexes include organizationId
- Automated tests for tenant isolation
- Audit logs for cross-tenant access attempts

---

### 3. WhatsApp: Cloud API vs On-Premise

**Question:** Usar WhatsApp Cloud API (oficial, pago por conversação) ou WhatsApp Business API on-premise?

**Recommendation:** **WhatsApp Cloud API (Official)**

**Rationale:**

- Much simpler setup (no dedicated server needed)
- Meta-managed infrastructure (99.9% uptime SLA)
- Faster time to market (no verification delays)
- Predictable costs: ~$0.01-0.05 per conversation
- Automatic updates and security patches
- Better for SME target market

**Cost Analysis:**

```
Cloud API Pricing (Brazil - 2026):
- Business-initiated: ~R$0.15-0.25 per message
- User-initiated (24h window): Free
- Template messages: ~R$0.15 per message

Monthly estimate for SME:
- 5,000 conversations/month
- 70% user-initiated (free)
- 30% business-initiated (R$0.20 each)
- Total: ~R$300/month per client

Revenue model:
- Pass through cost + 50% markup
- Or include in subscription tier
```

**Implementation:**

- Use Meta Cloud API via Graph API
- Webhook signature validation (SHA256)
- Message template management
- Media upload/download handling
- 24-hour conversation window tracking

**On-Premise Comparison (not recommended):**

- Requires dedicated server ($200+/month)
- Manual Meta verification (2-4 weeks)
- Complex setup and maintenance
- Suitable only for very high-volume clients (50k+ messages/month)

---

### 4. Message Encryption: Plaintext vs Encrypted Storage

**Question:** Armazenar mensagens em plaintext ou implementar criptografia at-rest?

**Recommendation:** **Start plaintext, add encryption in Phase 6**

**Rationale:**

- WhatsApp/Telegram already use end-to-end encryption in transit
- Database-level encryption (PostgreSQL) protects disk access
- Application-level encryption adds complexity and performance overhead
- LGPD requires protection but doesn't mandate encryption specifically
- Can be added later without schema changes

**Implementation Roadmap:**

**Phase 1-5 (MVP):**

```sql
-- Store messages in plaintext
messages (
  id UUID,
  content TEXT, -- plaintext content
  organization_id UUID,
  created_at TIMESTAMP
)
```

**Phase 6 (Post-MVP Enhancement):**

```typescript
// Add application-level encryption
import { createCipheriv, createDecipheriv } from 'crypto';

class MessageEncryptionService {
  private algorithm = 'aes-256-gcm';

  encrypt(plaintext: string, organizationKey: Buffer): EncryptedData {
    // Encrypt per-organization key
    // Store IV and auth tag with encrypted data
  }

  decrypt(encrypted: EncryptedData, organizationKey: Buffer): string {
    // Decrypt using organization-specific key
  }
}

// Database schema update
ALTER TABLE messages ADD COLUMN encrypted_content BYTEA;
ALTER TABLE messages ADD COLUMN encryption_iv BYTEA;
ALTER TABLE messages ADD COLUMN encryption_tag BYTEA;
```

**LGPD Compliance (without encryption):**

- Access control (RBAC)
- Audit logs for message access
- Data retention policies
- Right to deletion
- Data export functionality
- Encrypted backups
- SSL/TLS for all connections

---

### 5. Data Retention: Automatic Deletion Policy

**Question:** Política de exclusão automática de mensagens antigas (ex: após 2 anos)?

**Recommendation:** **Configurable retention with default 2 years**

**Rationale:**

- Legal compliance (LGPD Article 15)
- Storage cost optimization
- Performance improvement (smaller tables)
- Flexible per-organization settings

**Implementation:**

```typescript
// Organization settings
organizations (
  id UUID,
  data_retention_days INT DEFAULT 730, -- 2 years
  retention_enabled BOOLEAN DEFAULT true
)

// Automated cleanup job (Bull Queue)
@Cron('0 2 * * *') // Daily at 2 AM
async cleanupOldMessages() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - organization.data_retention_days);

  // Soft delete first (30-day grace period)
  await db.update(messages)
    .set({ deleted_at: new Date() })
    .where(and(
      eq(messages.organization_id, orgId),
      lt(messages.created_at, cutoffDate),
      isNull(messages.deleted_at)
    ));

  // Hard delete after grace period
  await db.delete(messages)
    .where(and(
      eq(messages.organization_id, orgId),
      lt(messages.deleted_at, thirtyDaysAgo)
    ));
}

// Audit log for deletions
audit_logs (
  action: 'MESSAGE_PURGED',
  organization_id: UUID,
  affected_count: INT,
  retention_policy: JSON,
  executed_at: TIMESTAMP
)
```

**Retention Options:**

- 90 days (basic tier)
- 1 year (standard tier)
- 2 years (professional tier - default)
- 5 years (enterprise tier)
- Custom (enterprise only)

**Exclusions:**

- Messages marked as "important"
- Messages linked to open deals
- Messages with legal hold flag
- Exported archives (permanent storage)

---

### 6. WebSockets: Socket.io Rooms vs Redis Pub/Sub

**Question:** Usar Socket.io rooms por tenant/conversação ou pub/sub Redis para escalar melhor em múltiplas replicas Swarm?

**Recommendation:** **Redis Adapter for Socket.io**

**Rationale:**

- Best of both worlds: Socket.io API + Redis scaling
- Horizontal scaling across Swarm replicas
- Maintains room-based organization (per conversation/user)
- Battle-tested solution for distributed systems

**Implementation:**

```typescript
// app.module.ts
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://redis:6379" });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL },
  adapter: createAdapter(pubClient, subClient),
});

// Usage in gateway
@WebSocketGateway()
export class ConversationsGateway {
  @SubscribeMessage("join_conversation")
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Room is automatically synced across all Swarm replicas via Redis
    client.join(`conversation:${data.conversationId}`);
  }

  async sendMessageToConversation(conversationId: string, message: any) {
    // Emits to all clients in room across ALL server instances
    this.server
      .to(`conversation:${conversationId}`)
      .emit("new_message", message);
  }
}
```

**Room Structure:**

```typescript
// Per-user rooms (notifications, typing indicators)
`user:{userId}`
// Per-conversation rooms (messages, status updates)
`conversation:{conversationId}`
// Per-organization rooms (team notifications, deal updates)
`organization:{organizationId}`
// Per-deal rooms (deal activity, payment status)
`deal:{dealId}`;
```

**Scaling Benefits:**

- Client connects to any Swarm replica
- Messages broadcast across all replicas via Redis
- Automatic failover if a replica dies
- No session stickiness required
- Horizontal scaling to 10+ replicas

---

### 7. Search: PostgreSQL Full-Text vs Elasticsearch

**Question:** Implementar busca full-text apenas com PostgreSQL ou adicionar Elasticsearch?

**Recommendation:** **PostgreSQL only for MVP, Elasticsearch for Phase 6+**

**Rationale:**

- PostgreSQL `pg_trgm` + GIN indexes cover 90% of use cases
- Simpler infrastructure (one less service)
- Lower operational complexity
- Sufficient for 10k-100k messages
- Elasticsearch adds value at 1M+ messages or complex analytics

**PostgreSQL Implementation (MVP):**

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create search indexes
CREATE INDEX idx_messages_content_search ON messages
  USING GIN (to_tsvector('portuguese', content));

CREATE INDEX idx_contacts_name_trigram ON contacts
  USING GIN (name gin_trgm_ops);

-- Search query example
SELECT * FROM messages
WHERE
  to_tsvector('portuguese', content) @@ to_tsquery('portuguese', 'pagamento & pendente')
  AND organization_id = :orgId
ORDER BY created_at DESC
LIMIT 20;

-- Fuzzy search (typo tolerance)
SELECT * FROM contacts
WHERE
  name % 'João Silva' -- similarity operator from pg_trgm
  AND organization_id = :orgId
ORDER BY similarity(name, 'João Silva') DESC;
```

**Elasticsearch Migration (Phase 6+):**

- Trigger when: >1M messages or >10k contacts per organization
- Use cases: Advanced filters, aggregations, analytics
- Implementation: Keep PostgreSQL as source of truth, Elasticsearch as read replica
- Sync: CDC (Change Data Capture) or event-driven indexing

---

### 8. Monitoring: Self-Hosted vs SaaS

**Question:** Stack de observabilidade será Prometheus + Grafana ou usar SaaS tipo Datadog/New Relic?

**Recommendation:** **Start with built-in health checks, add Prometheus + Grafana in Phase 3**

**Rationale:**

- Minimal setup for MVP
- Cost-effective for early stage
- Full control over data
- Can migrate to SaaS if needed (export metrics)

**Implementation Phases:**

**Phase 1 (MVP):**

```typescript
// Basic health check endpoint
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };
  }
}

// Docker health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

**Phase 3 (Production):**

```yaml
# docker-compose.prod.yml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"

# NestJS metrics with @willsoto/nestjs-prometheus
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
  ],
})
```

**Metrics to Track:**

- Request rate, latency, error rate (RED metrics)
- Database connection pool usage
- Redis hit/miss ratio
- WebSocket connections count
- Message queue length (Bull)
- Webhook processing time
- API rate limit hits
- Memory and CPU usage

**Alerting:**

- Slack/Discord notifications for critical alerts
- Email for non-urgent alerts
- PagerDuty for on-call rotation (Phase 6+)

**SaaS Migration Path:**
If budget allows (>$100/month), consider:

- **Datadog:** Best overall (APM + logs + metrics)
- **New Relic:** Good for application performance
- **Grafana Cloud:** Free tier, easy migration

---

### 9. Backup: pg_dump vs Streaming Replication

**Question:** Estratégia de backup PostgreSQL - pg_dump diário via cronjob ou replicação contínua?

**Recommendation:** **pg_dump daily + Write-Ahead Log (WAL) archiving**

**Rationale:**

- Simple, reliable, proven approach
- Point-in-time recovery (PITR) capability
- Lower cost than streaming replication
- Sufficient for SME market

**Implementation:**

```bash
# Backup script (backup.sh)
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup
docker exec postgres pg_dump -U postgres -Fc crm_db > \
  "$BACKUP_DIR/crm_db_$DATE.dump"

# Compress
gzip "$BACKUP_DIR/crm_db_$DATE.dump"

# Upload to S3/DigitalOcean Spaces
aws s3 cp "$BACKUP_DIR/crm_db_$DATE.dump.gz" \
  s3://crm-backups/postgres/ --storage-class GLACIER

# Delete old local backups
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
pg_restore --list "$BACKUP_DIR/crm_db_$DATE.dump.gz" > /dev/null
```

```yaml
# docker-compose.prod.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
      # Enable WAL archiving for PITR
      POSTGRES_INITDB_ARGS: "-c wal_level=replica -c archive_mode=on"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
      - ./postgres-archive:/var/lib/postgresql/archive

  # Backup service
  postgres-backup:
    image: postgres:16-alpine
    depends_on:
      - postgres
    volumes:
      - ./backup.sh:/backup.sh
    entrypoint:
      ["/bin/bash", "-c", "while true; do /backup.sh; sleep 86400; done"]
```

**Backup Schedule:**

- **Full backup:** Daily at 2 AM (low traffic)
- **WAL archiving:** Continuous (every 16MB or 5 minutes)
- **Retention:** 30 days local, 1 year in S3 Glacier
- **Testing:** Monthly restore test to validate backups

**Recovery Scenarios:**

- **Disaster recovery:** Restore latest full backup (~1 day data loss)
- **Point-in-time:** Restore full backup + replay WAL to specific timestamp
- **Logical corruption:** Restore specific tables with pg_restore

**Streaming Replication (Phase 6+):**
Consider for high-availability requirements:

- Standby replica for failover
- Read replica for analytics queries
- Near-zero data loss (RPO < 1 second)
- Cost: Additional server + storage

---

### 10. Load Testing: Target Throughput

**Question:** Quantas mensagens/segundo o sistema deve suportar? Meta inicial: 100 msg/s ou 1000 msg/s?

**Recommendation:** **Target 100 msg/s for MVP, design for 1000 msg/s**

**Rationale:**

- 100 msg/s = 8.6M messages/day (sufficient for 50-100 SME clients)
- Architecture supports 1000 msg/s with proper scaling
- Load test to 10x capacity (1000 msg/s) for safety margin

**Capacity Planning:**

```
Single Organization:
- Average: 5-10 messages/minute (light usage)
- Peak: 50-100 messages/minute (campaign blast)
- Daily: 2,000-5,000 messages

100 Organizations:
- Average: 500-1,000 msg/min (~10-15 msg/s)
- Peak: 5,000-10,000 msg/min (~100-150 msg/s)
- Daily: 200k-500k messages

Design Target (with 10x safety):
- Sustained: 100 msg/s
- Burst: 1,000 msg/s for 1 minute
- Daily: 8.6M messages
```

**Load Testing Strategy:**

```typescript
// k6 load test script (load-test.js)
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "2m", target: 50 }, // Ramp up to 50 msg/s
    { duration: "5m", target: 100 }, // Sustain 100 msg/s
    { duration: "2m", target: 200 }, // Spike to 200 msg/s
    { duration: "1m", target: 1000 }, // Max burst 1000 msg/s
    { duration: "5m", target: 100 }, // Back to sustained
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"], // 95% < 200ms, 99% < 500ms
    http_req_failed: ["rate<0.01"], // Error rate < 1%
    errors: ["rate<0.01"],
  },
};

export default function () {
  // Simulate webhook from WhatsApp
  const payload = JSON.stringify({
    from: `55119${Math.floor(Math.random() * 100000000)}`,
    message: "Load test message " + Date.now(),
  });

  const res = http.post("https://api.crm.com/webhooks/whatsapp", payload, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 200ms": (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(0.1); // 100ms between messages per VU
}
```

**Infrastructure Sizing (100 msg/s):**

```yaml
# docker-stack.yml
services:
  backend:
    image: crm-backend:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M

  postgres:
    image: postgres:16
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 4G
        reservations:
          cpus: "1"
          memory: 2G

  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
```

**Performance Optimizations:**

- Database connection pooling: 20 connections × 3 replicas = 60 total
- Redis caching for frequently accessed data (contacts, organization settings)
- Bull MQ for async webhook processing (queue workers = 5 per replica)
- WebSocket horizontal scaling via Redis adapter
- Database indexes on all foreign keys and timestamp columns

**Scaling Path:**

- **100 msg/s:** 3 backend replicas, 1 PostgreSQL, 1 Redis
- **500 msg/s:** 5 backend replicas, PostgreSQL read replica, Redis cluster
- **1000 msg/s:** 10 backend replicas, PostgreSQL primary + 2 read replicas, Redis cluster (3 nodes)

---

### 11. CI/CD: Pipeline Choice

**Question:** Pipeline será GitHub Actions, GitLab CI ou Jenkins?

**Recommendation:** **GitHub Actions**

**Rationale:**

- Free for public repos, generous limits for private (2000 min/month)
- Native GitHub integration
- Huge marketplace of actions
- YAML-based configuration
- Built-in secrets management
- Matrix builds for testing multiple Node versions

**Pipeline Implementation:**

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Backend tests
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: apps/backend/package-lock.json

      - name: Install dependencies
        working-directory: apps/backend
        run: npm ci

      - name: Run linter
        working-directory: apps/backend
        run: npm run lint

      - name: Run unit tests
        working-directory: apps/backend
        run: npm run test:cov

      - name: Run e2e tests
        working-directory: apps/backend
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: apps/backend/coverage/lcov.info

  # Frontend tests
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: apps/frontend/package-lock.json

      - name: Install dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Run linter
        working-directory: apps/frontend
        run: npm run lint

      - name: Run tests
        working-directory: apps/frontend
        run: npm run test

      - name: Build
        working-directory: apps/frontend
        run: npm run build

  # Build and push Docker images
  build-push:
    needs: [backend-test, frontend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    strategy:
      matrix:
        app: [backend, frontend]

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.app }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: apps/${{ matrix.app }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy to production
  deploy:
    needs: build-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Docker Swarm
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SWARM_HOST }}
          username: ${{ secrets.SWARM_USER }}
          key: ${{ secrets.SWARM_SSH_KEY }}
          script: |
            cd /opt/crm-manager
            git pull origin main
            docker stack deploy -c docker-stack.yml crm
            docker service update --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:main crm_backend
            docker service update --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:main crm_frontend
```

**Branch Strategy:**

- `main` - Production (auto-deploy on push)
- `develop` - Staging (auto-deploy to staging environment)
- `feature/*` - Feature branches (run tests only)
- `hotfix/*` - Emergency fixes (fast-track to main)

**Pre-deployment Checks:**

- All tests pass (unit + integration + e2e)
- Code coverage > 80%
- Linting passes
- Security scan (Snyk or Dependabot)
- Docker image builds successfully

---

### 12. Frontend Deployment: Monolithic vs Separate

**Question:** SPA servido pelo NestJS (mesmo container) ou separado em CDN (Vercel/Cloudflare)?

**Recommendation:** **Separate frontend on CDN for production, monolithic for development**

**Rationale:**

- Better performance (CDN edge caching)
- Independent scaling (frontend doesn't need backend resources)
- Cheaper (static hosting is nearly free)
- Better DX (fast dev server with HMR)
- Easier rollbacks (frontend/backend deployed independently)

**Implementation:**

**Development (Monolithic):**

```yaml
# docker-compose.yml
services:
  backend:
    build: ./apps/backend
    ports:
      - "3000:3000"
    environment:
      - FRONTEND_URL=http://localhost:5173

  frontend:
    build: ./apps/frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
```

**Production (Separate):**

```yaml
# Cloudflare Pages configuration
# apps/frontend/wrangler.toml
name = "crm-manager-frontend"
compatibility_date = "2026-01-31"

[build]
command = "npm run build"
output_directory = "dist"

[[redirects]]
from = "/api/*"
to = "https://api.crm-manager.com/:splat"
status = 200

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
```

**Deployment Options:**

| Platform                | Cost                        | Pros                                       | Cons                  |
| ----------------------- | --------------------------- | ------------------------------------------ | --------------------- |
| **Vercel**              | Free tier (100GB bandwidth) | Zero config, instant deploys, preview URLs | Vendor lock-in        |
| **Cloudflare Pages**    | Free (unlimited bandwidth)  | Global CDN, R2 storage, zero cold start    | Limited build minutes |
| **Netlify**             | Free tier (100GB bandwidth) | Easy setup, split testing, forms           | Build limits          |
| **AWS S3 + CloudFront** | ~$5-10/month                | Full control, scalable                     | More setup required   |
| **Self-hosted Nginx**   | Infrastructure cost only    | Complete control, no limits                | Manual setup, no CDN  |

**Recommendation:** Start with **Cloudflare Pages** (free + unlimited bandwidth)

**CORS Configuration:**

```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: [
    "http://localhost:5173", // Development
    "https://crm-manager.pages.dev", // Cloudflare Pages preview
    "https://app.crm-manager.com", // Production domain
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

**Build Process:**

```bash
# Frontend build
cd apps/frontend
npm run build
# Output: dist/ (static files)
# Deploy to Cloudflare Pages via Git push or CLI

# Backend build
cd apps/backend
docker build -t crm-backend:latest .
docker push ghcr.io/username/crm-backend:latest
```

---

## Summary of Decisions

| Decision            | Choice                                         | Phase     |
| ------------------- | ---------------------------------------------- | --------- |
| Authentication      | Local credentials → Google SSO → Microsoft SSO | 1 → 2 → 3 |
| Multi-tenancy       | Multi-tenant with row-level isolation          | 1         |
| WhatsApp API        | Cloud API (official)                           | 2         |
| Message Encryption  | Plaintext → Application-level encryption       | 1 → 6     |
| Data Retention      | 2 years default (configurable)                 | 3         |
| WebSockets          | Socket.io + Redis adapter                      | 2         |
| Search              | PostgreSQL pg_trgm → Elasticsearch             | 1 → 6     |
| Monitoring          | Health checks → Prometheus + Grafana           | 1 → 3     |
| Backup              | pg_dump daily + WAL archiving                  | 1         |
| Load Target         | 100 msg/s sustained, 1000 msg/s burst          | 1         |
| CI/CD               | GitHub Actions                                 | 1         |
| Frontend Deployment | CDN (Cloudflare Pages)                         | 1         |

---

## Architecture Decisions Records (ADRs)

Detailed ADRs will be created for each major decision to document:

- Context and problem statement
- Considered options
- Decision outcome
- Consequences (positive and negative)
- References

These will be stored in `/docs/adr/` directory following the MADR template.
