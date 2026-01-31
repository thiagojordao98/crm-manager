# System Architecture

## Overview

CRM Manager uses a **Domain-Driven Design (DDD)** approach with **Clean Architecture** principles, organized as a monorepo with separate frontend and backend applications.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │    Mobile    │  │   Desktop    │          │
│  │   (React)    │  │   (Future)   │  │   (Future)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                         CDN LAYER                                │
│              Cloudflare Pages / Vercel                           │
│              (Static Assets + Edge Caching)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER / PROXY                         │
│                     Traefik / Nginx                              │
│              (SSL Termination, Rate Limiting)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│  ┌────────────────────────────────────────────────────┐         │
│  │           NestJS Backend (Docker Swarm)            │         │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │         │
│  │  │ Replica 1│ │ Replica 2│ │ Replica 3│          │         │
│  │  └──────────┘ └──────────┘ └──────────┘          │         │
│  │        REST API + GraphQL (future)                │         │
│  │        WebSocket Gateway                          │         │
│  │        Webhook Receivers                          │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
              ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL 16  │  │    Redis 7       │  │   Bull Queues    │
│   (Primary DB)   │  │  (Cache + Pub)   │  │   (Async Jobs)   │
│                  │  │                  │  │                  │
│  - Contacts      │  │  - Sessions      │  │  - Webhooks      │
│  - Conversations │  │  - Rate Limits   │  │  - Notifications │
│  - Messages      │  │  - Socket Rooms  │  │  - Email         │
│  - Deals         │  │  - Query Cache   │  │  - Cleanup       │
│  - Payments      │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ WhatsApp │ │ Telegram │ │ Discord  │ │  Slack   │       │
│  │   API    │ │   Bot    │ │   Bot    │ │   API    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐                                  │
│  │  Trello  │ │ Mercado  │ ┌──────────┐                    │
│  │   API    │ │   Pago   │ │  Stripe  │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Domain-Driven Design Structure

### Bounded Contexts

```
┌────────────────────────────────────────────────────────────────┐
│                      CRM MANAGER SYSTEM                         │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   CONTACTS       │  │  CONVERSATIONS   │                   │
│  │   CONTEXT        │  │    CONTEXT       │                   │
│  │                  │  │                  │                   │
│  │  - Contact       │  │  - Conversation  │                   │
│  │  - Organization  │  │  - Message       │                   │
│  │  - Tag           │  │  - Participant   │                   │
│  │  - CustomField   │  │  - Thread        │                   │
│  └──────────────────┘  └──────────────────┘                   │
│           ↓                      ↓                              │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │     DEALS        │  │   INTEGRATIONS   │                   │
│  │    CONTEXT       │  │     CONTEXT      │                   │
│  │                  │  │                  │                   │
│  │  - Deal          │  │  - Channel       │                   │
│  │  - Pipeline      │  │  - Integration   │                   │
│  │  - Stage         │  │  - Webhook       │                   │
│  │  - Activity      │  │  - Credential    │                   │
│  └──────────────────┘  └──────────────────┘                   │
│           ↓                      ↓                              │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │    PAYMENTS      │  │       AUTH       │                   │
│  │     CONTEXT      │  │     CONTEXT      │                   │
│  │                  │  │                  │                   │
│  │  - Payment       │  │  - User          │                   │
│  │  - Transaction   │  │  - Role          │                   │
│  │  - PaymentLink   │  │  - Permission    │                   │
│  │  - Refund        │  │  - Session       │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              SHARED KERNEL                            │     │
│  │  - Common interfaces                                  │     │
│  │  - Value objects (Email, Phone, Money, etc.)         │     │
│  │  - Domain events                                      │     │
│  │  - Error types                                        │     │
│  └──────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

### Context Relationships

```
Contacts ──(provides contact data)──> Conversations
Contacts ──(provides lead info)────> Deals
Conversations ──(triggers deal)───> Deals
Deals ──(requests payment)────────> Payments
Integrations ──(receives messages)> Conversations
Auth ──(secures access)───────────> All Contexts
```

---

## Clean Architecture Layers

### Layer Structure (per Bounded Context)

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                     │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │  Controllers   │  │   Gateways     │               │
│  │  (REST API)    │  │  (WebSocket)   │               │
│  └────────────────┘  └────────────────┘               │
│          ↓                    ↓                         │
│  ┌──────────────────────────────────────────┐         │
│  │            DTOs (Request/Response)        │         │
│  └──────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                      │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │   Use Cases    │  │   Services     │               │
│  │  (Business     │  │  (Orchestr.)   │               │
│  │   Flows)       │  │                │               │
│  └────────────────┘  └────────────────┘               │
│          ↓                    ↓                         │
│  ┌──────────────────────────────────────────┐         │
│  │         Application Services              │         │
│  │  (Ports/Interfaces for Infrastructure)    │         │
│  └──────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                         │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │   Entities     │  │  Value Objects │               │
│  │  (Aggregates)  │  │   (Email,      │               │
│  │                │  │    Phone, $)   │               │
│  └────────────────┘  └────────────────┘               │
│          ↓                    ↓                         │
│  ┌──────────────────────────────────────────┐         │
│  │         Domain Services                   │         │
│  │         Business Rules                    │         │
│  │         Domain Events                     │         │
│  └──────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                INFRASTRUCTURE LAYER                     │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │  Repositories  │  │    Adapters    │               │
│  │  (DB Access)   │  │  (External     │               │
│  │                │  │   APIs)        │               │
│  └────────────────┘  └────────────────┘               │
│          ↓                    ↓                         │
│  ┌────────────────┐  ┌────────────────┐               │
│  │   Drizzle ORM  │  │   HTTP Clients │               │
│  │   (Postgres)   │  │   (WhatsApp,   │               │
│  │                │  │    Telegram)   │               │
│  └────────────────┘  └────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema (Simplified)

```sql
-- Core Entities

organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  data_retention_days INT DEFAULT 730,
  created_at TIMESTAMP DEFAULT NOW()
)

users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT, -- 'owner', 'admin', 'agent'
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Contacts Bounded Context

contacts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  metadata JSONB, -- Custom fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
)

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_phone ON contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;

-- Conversations Bounded Context

conversations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  channel TEXT NOT NULL, -- 'whatsapp', 'telegram', 'discord', 'slack'
  channel_thread_id TEXT, -- External thread/chat ID
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'snoozed'
  assigned_to UUID REFERENCES users(id),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
)

CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned ON conversations(assigned_to);

messages (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  sender_type TEXT NOT NULL, -- 'contact', 'agent', 'bot'
  sender_id UUID, -- NULL for contact, user_id for agent
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'audio', 'file'
  media_url TEXT,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  channel_message_id TEXT, -- External message ID
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
)

CREATE INDEX idx_messages_org ON messages(organization_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_content_search ON messages USING GIN (to_tsvector('portuguese', content));

-- Deals Bounded Context

pipelines (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  stages JSONB NOT NULL, -- [{ name, order, color }]
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
)

deals (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  pipeline_id UUID REFERENCES pipelines(id),
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  value DECIMAL(15,2),
  currency TEXT DEFAULT 'BRL',
  expected_close_date DATE,
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'open', -- 'open', 'won', 'lost'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
)

CREATE INDEX idx_deals_org ON deals(organization_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_status ON deals(status);

-- Payments Bounded Context

payments (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  deal_id UUID REFERENCES deals(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  provider TEXT NOT NULL, -- 'mercadopago', 'stripe'
  provider_payment_id TEXT,
  payment_link TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
)

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_deal ON payments(deal_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Integrations Bounded Context

integrations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  channel TEXT NOT NULL, -- 'whatsapp', 'telegram', etc.
  config JSONB NOT NULL, -- Encrypted credentials
  is_active BOOLEAN DEFAULT true,
  webhook_secret TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
)

webhook_logs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  integration_id UUID REFERENCES integrations(id),
  channel TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'retrying'
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
)

CREATE INDEX idx_webhook_logs_org ON webhook_logs(organization_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);
```

---

## API Design

### REST API Endpoints

```typescript
// Authentication
POST   /auth/register          - Create account
POST   /auth/login             - Login (returns JWT)
POST   /auth/refresh           - Refresh access token
POST   /auth/logout            - Logout (invalidate token)
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Reset password

// Contacts
GET    /contacts               - List contacts (paginated, filtered)
POST   /contacts               - Create contact
GET    /contacts/:id           - Get contact details
PATCH  /contacts/:id           - Update contact
DELETE /contacts/:id           - Delete contact
GET    /contacts/:id/conversations - Get contact's conversations
GET    /contacts/:id/deals     - Get contact's deals

// Conversations
GET    /conversations          - List conversations (paginated, filtered)
POST   /conversations          - Create conversation
GET    /conversations/:id      - Get conversation details
PATCH  /conversations/:id      - Update conversation (status, assignment)
DELETE /conversations/:id      - Delete conversation
GET    /conversations/:id/messages - Get conversation messages
POST   /conversations/:id/messages - Send message

// Messages
GET    /messages               - Search messages
GET    /messages/:id           - Get message details
DELETE /messages/:id           - Delete message

// Deals
GET    /deals                  - List deals (paginated, filtered)
POST   /deals                  - Create deal
GET    /deals/:id              - Get deal details
PATCH  /deals/:id              - Update deal (stage, value, etc.)
DELETE /deals/:id              - Delete deal
GET    /deals/:id/activities   - Get deal activities
POST   /deals/:id/activities   - Add activity

// Pipelines
GET    /pipelines              - List pipelines
POST   /pipelines              - Create pipeline
GET    /pipelines/:id          - Get pipeline details
PATCH  /pipelines/:id          - Update pipeline
DELETE /pipelines/:id          - Delete pipeline

// Payments
GET    /payments               - List payments
POST   /payments               - Create payment link
GET    /payments/:id           - Get payment details
POST   /payments/:id/refund    - Request refund

// Integrations
GET    /integrations           - List integrations
POST   /integrations           - Create integration
GET    /integrations/:id       - Get integration details
PATCH  /integrations/:id       - Update integration
DELETE /integrations/:id       - Delete integration
POST   /integrations/:id/test  - Test integration

// Webhooks (external)
POST   /webhooks/whatsapp      - Receive WhatsApp webhooks
POST   /webhooks/telegram      - Receive Telegram webhooks
POST   /webhooks/discord       - Receive Discord webhooks
POST   /webhooks/slack         - Receive Slack webhooks
POST   /webhooks/trello        - Receive Trello webhooks
POST   /webhooks/mercadopago   - Receive Mercado Pago webhooks
POST   /webhooks/stripe        - Receive Stripe webhooks

// Users & Organizations
GET    /users                  - List organization users
POST   /users                  - Invite user
GET    /users/:id              - Get user details
PATCH  /users/:id              - Update user
DELETE /users/:id              - Remove user
GET    /organizations/current  - Get current organization
PATCH  /organizations/current  - Update organization settings

// Analytics (future)
GET    /analytics/overview     - Dashboard metrics
GET    /analytics/conversations - Conversation metrics
GET    /analytics/deals        - Sales metrics
GET    /analytics/performance  - Team performance
```

### WebSocket Events

```typescript
// Client -> Server
'authenticate'              - Authenticate WebSocket connection
'join_conversation'         - Join conversation room
'leave_conversation'        - Leave conversation room
'typing_start'              - User started typing
'typing_stop'               - User stopped typing
'mark_as_read'              - Mark messages as read

// Server -> Client
'authenticated'             - Authentication successful
'new_message'               - New message in conversation
'message_updated'           - Message edited/deleted
'message_status'            - Message delivery status
'conversation_updated'      - Conversation status changed
'conversation_assigned'     - Conversation assigned to agent
'deal_updated'              - Deal stage/status changed
'payment_status'            - Payment status changed
'user_typing'               - Another user is typing
'notification'              - General notification
'error'                     - Error occurred
```

---

## Integration Architecture

### Strategy Pattern Implementation

```typescript
// Domain interface
interface IChannelStrategy {
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
  receiveWebhook(payload: unknown): Promise<IncomingMessage>;
  validateWebhook(request: Request): boolean;
}

// Concrete implementations
class WhatsAppStrategy implements IChannelStrategy {
  async sendMessage(params) {
    // Use WhatsApp Cloud API
    const response = await this.httpClient.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      { to: params.recipient, text: { body: params.content } },
    );
    return { externalId: response.messages[0].id };
  }

  async receiveWebhook(payload) {
    // Parse WhatsApp webhook format
    const message = payload.entry[0].changes[0].value.messages[0];
    return {
      from: message.from,
      content: message.text.body,
      timestamp: new Date(message.timestamp * 1000),
    };
  }

  validateWebhook(request) {
    // Verify HMAC signature
    const signature = request.headers["x-hub-signature-256"];
    const hash = crypto
      .createHmac("sha256", this.secret)
      .update(request.body)
      .digest("hex");
    return signature === `sha256=${hash}`;
  }
}

class TelegramStrategy implements IChannelStrategy {
  async sendMessage(params) {
    const response = await this.httpClient.post(
      `https://api.telegram.org/bot${this.botToken}/sendMessage`,
      { chat_id: params.recipient, text: params.content },
    );
    return { externalId: response.result.message_id };
  }

  // ... similar implementation
}

// Factory
class ChannelStrategyFactory {
  create(channel: ChannelType): IChannelStrategy {
    switch (channel) {
      case "whatsapp":
        return new WhatsAppStrategy(config);
      case "telegram":
        return new TelegramStrategy(config);
      case "discord":
        return new DiscordStrategy(config);
      case "slack":
        return new SlackStrategy(config);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }
}

// Usage in use case
class SendMessageUseCase {
  async execute(command: SendMessageCommand) {
    const strategy = this.strategyFactory.create(command.channel);
    const result = await strategy.sendMessage(command);
    await this.messageRepository.save({
      ...command,
      externalId: result.externalId,
    });
  }
}
```

---

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   POST /auth/login { email, password }

2. Backend validates credentials
   - Check email exists
   - Verify password hash (bcrypt)
   - Check account status (active, locked, etc.)

3. Generate tokens
   - Access Token (JWT, 15min expiry)
     Payload: { userId, organizationId, role, exp }
   - Refresh Token (UUID, 7 days expiry)
     Stored in Redis with user metadata

4. Return tokens
   { accessToken, refreshToken, user: { id, name, email, role } }

5. Client stores tokens
   - Access token in memory (React state)
   - Refresh token in httpOnly cookie (secure, sameSite)

6. Subsequent requests
   - Include access token in Authorization header
   - Backend validates JWT signature and expiry
   - Extract userId and organizationId from token

7. Token refresh (when access token expires)
   POST /auth/refresh (with refresh token cookie)
   - Validate refresh token in Redis
   - Generate new access token
   - Rotate refresh token (optional)
```

### Authorization (RBAC)

```typescript
// Roles
enum Role {
  OWNER = 'owner',       // Full access, billing
  ADMIN = 'admin',       // All features except billing
  AGENT = 'agent',       // Conversations, contacts (assigned)
  VIEWER = 'viewer',     // Read-only access
}

// Permissions matrix
const PERMISSIONS = {
  'contacts:read': [Role.OWNER, Role.ADMIN, Role.AGENT, Role.VIEWER],
  'contacts:write': [Role.OWNER, Role.ADMIN, Role.AGENT],
  'contacts:delete': [Role.OWNER, Role.ADMIN],

  'conversations:read': [Role.OWNER, Role.ADMIN, Role.AGENT, Role.VIEWER],
  'conversations:write': [Role.OWNER, Role.ADMIN, Role.AGENT],
  'conversations:assign': [Role.OWNER, Role.ADMIN],

  'deals:read': [Role.OWNER, Role.ADMIN, Role.AGENT, Role.VIEWER],
  'deals:write': [Role.OWNER, Role.ADMIN, Role.AGENT],
  'deals:delete': [Role.OWNER, Role.ADMIN],

  'integrations:read': [Role.OWNER, Role.ADMIN],
  'integrations:write': [Role.OWNER, Role.ADMIN],

  'users:invite': [Role.OWNER, Role.ADMIN],
  'users:remove': [Role.OWNER],

  'billing:manage': [Role.OWNER],
};

// Guard decorator
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('contacts:write')
@Patch('/contacts/:id')
async updateContact(@Param('id') id: string, @Body() dto: UpdateContactDto) {
  // Only users with 'contacts:write' permission can access
}
```

### Multi-Tenancy Isolation

```typescript
// Middleware: Extract organization from JWT
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = this.jwtService.verify(token);
      req["organizationId"] = decoded.organizationId;
      req["userId"] = decoded.userId;
      req["role"] = decoded.role;
    }
    next();
  }
}

// Repository: Auto-filter by organization
class ContactRepository {
  async findAll(organizationId: string, filters: ContactFilters) {
    return db
      .select()
      .from(contacts)
      .where(eq(contacts.organizationId, organizationId)) // Always filtered
      .where(/* additional filters */);
  }

  async findById(id: string, organizationId: string) {
    const contact = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.organizationId, organizationId), // Prevent cross-tenant access
        ),
      )
      .limit(1);

    if (!contact) throw new NotFoundException();
    return contact;
  }
}

// Test: Verify tenant isolation
describe("Tenant Isolation", () => {
  it("should not allow access to other tenant data", async () => {
    const org1Contact = await createContact({ organizationId: "org1" });
    const org2Token = await getAuthToken("org2");

    const response = await request(app)
      .get(`/contacts/${org1Contact.id}`)
      .set("Authorization", `Bearer ${org2Token}`)
      .expect(404); // Should not find contact from org1
  });
});
```

---

## Scalability Considerations

### Horizontal Scaling

```yaml
# docker-stack.yml
services:
  backend:
    image: crm-backend:latest
    deploy:
      replicas: 3 # Start with 3, scale to 10+
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 5s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
    networks:
      - backend
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL_FILE=/run/secrets/database_url
    secrets:
      - database_url
```

### Database Optimization

```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_messages_org_conversation_created
  ON messages(organization_id, conversation_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_conversations_org_status_updated
  ON conversations(organization_id, status, last_message_at DESC);

CREATE INDEX CONCURRENTLY idx_deals_org_pipeline_stage
  ON deals(organization_id, pipeline_id, stage);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_conversations_open
  ON conversations(organization_id, assigned_to)
  WHERE status = 'open';

CREATE INDEX CONCURRENTLY idx_payments_pending
  ON payments(organization_id, created_at DESC)
  WHERE status = 'pending';

-- Connection pooling configuration
-- In NestJS config
TypeOrmModule.forRoot({
  type: 'postgres',
  max: 20, // Max connections per backend instance
  min: 5,  // Min connections maintained
  acquire: 30000, // Max time to acquire connection
  idle: 10000, // Max idle time before release
})
```

### Caching Strategy

```typescript
// Cache frequently accessed data
class CacheService {
  private readonly TTL = {
    ORGANIZATION: 3600, // 1 hour
    USER: 1800, // 30 minutes
    CONTACT: 300, // 5 minutes
    INTEGRATION_CONFIG: 600, // 10 minutes
  };

  async getOrganization(id: string): Promise<Organization> {
    const cached = await this.redis.get(`org:${id}`);
    if (cached) return JSON.parse(cached);

    const org = await this.db.findOrganization(id);
    await this.redis.setex(
      `org:${id}`,
      this.TTL.ORGANIZATION,
      JSON.stringify(org),
    );
    return org;
  }

  async invalidateOrganization(id: string): Promise<void> {
    await this.redis.del(`org:${id}`);
  }
}

// Cache query results
@Injectable()
export class ConversationService {
  @Cacheable({ ttl: 60 }) // Cache for 60 seconds
  async getOpenConversations(organizationId: string) {
    return this.repository.findOpen(organizationId);
  }
}
```

---

## Deployment Architecture

### Docker Swarm Stack

```yaml
version: "3.8"

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=false"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@crm.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certificates:/letsencrypt
    deploy:
      placement:
        constraints:
          - node.role == manager
    networks:
      - proxy

  backend:
    image: ghcr.io/username/crm-backend:latest
    deploy:
      replicas: 3
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.backend.rule=Host(`api.crm.com`)"
        - "traefik.http.routers.backend.entrypoints=websecure"
        - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
        - "traefik.http.services.backend.loadbalancer.server.port=3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      REDIS_URL: redis://redis:6379
    secrets:
      - database_url
      - jwt_secret
      - whatsapp_token
    networks:
      - backend
      - proxy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: crm_db
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.database == true
    secrets:
      - postgres_password
    networks:
      - backend

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass_file /run/secrets/redis_password
    volumes:
      - redis-data:/data
    deploy:
      replicas: 1
    secrets:
      - redis_password
    networks:
      - backend

volumes:
  postgres-data:
  redis-data:
  traefik-certificates:

networks:
  proxy:
    driver: overlay
  backend:
    driver: overlay

secrets:
  database_url:
    external: true
  postgres_password:
    external: true
  redis_password:
    external: true
  jwt_secret:
    external: true
  whatsapp_token:
    external: true
```

---

This architecture provides a solid foundation for building a scalable, maintainable multi-channel CRM system that can grow from a startup MVP to an enterprise-grade solution.
