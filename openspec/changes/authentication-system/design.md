## Context

The CRM Manager authentication system is the first bounded context being implemented. Currently, the database schemas for `users` and `organizations` exist with a hard constraint: `users.organizationId NOT NULL` referencing `organizations.id`. This enforces a strict organization-first model where users cannot exist without an organization.

The system will support self-service registration targeting Brazilian SMEs, requiring minimal friction to achieve the goal of 10+ companies in 3 months. The backend is NestJS with Passport JWT, and the frontend is React 19 with Zustand for state management. The platform runs on Docker Swarm with horizontal scaling, requiring stateless authentication.

**Current State:**
- Database schemas exist but no migrations run
- No auth module implemented
- No frontend auth pages
- No JWT configuration

**Constraints:**
- Multi-tenant architecture with row-level isolation via `organizationId`
- Stateless backend for horizontal scaling
- Self-service signup (no sales team involvement)
- LGPD compliance requirements
- 80%+ test coverage mandate

## Goals / Non-Goals

**Goals:**

- Enable self-service user registration with automatic organization creation
- Implement secure JWT-based authentication with refresh token flow
- Enforce multi-tenant isolation through JWT claims and query filtering
- Support team collaboration via email invitations
- Implement RBAC with 4 roles (OWNER, ADMIN, AGENT, VIEWER)
- Secure sessions with httpOnly cookies and token rotation
- Provide frontend auth flows (register, login, invite acceptance)
- Rate limit auth endpoints to prevent abuse
- Achieve 80%+ test coverage

**Non-Goals:**

- OAuth/SSO integration (Google, Microsoft) - Phase 2
- Email verification enforcement - optional for MVP, schema supports it
- Password reset via email - Phase 1.5
- Multi-organization support per user - simplified to one-org-per-user
- Magic link authentication
- Two-factor authentication (2FA)
- Session management UI (active sessions, remote logout)

## Decisions

### Decision 1: Self-Service Registration with Auto-Organization Creation

**Choice:** User provides organization name during signup, system creates organization automatically and assigns user as OWNER.

**Alternatives Considered:**
- Invite-only model: Rejected due to high friction for self-service business model
- Post-registration organization setup: Rejected because user cannot exist without organization (`organizationId NOT NULL`)
- Manual organization approval: Rejected due to lack of sales team and need for volume

**Rationale:** 
- Brazilian SME market requires immediate trial access
- Target of 10+ companies in 3 months needs frictionless signup
- Database constraint enforces organization-first model
- User becomes OWNER immediately, can invite team later

### Decision 2: JWT Access Token (15min) + Refresh Token (7 days)

**Choice:** Short-lived access tokens stored in memory/localStorage, long-lived refresh tokens in httpOnly cookies.

**Alternatives Considered:**
- Session-based auth with Redis: Rejected due to stateful nature conflicting with horizontal scaling
- Long-lived JWT only: Rejected due to security risk (cannot invalidate compromised tokens)
- Access token in httpOnly cookie: Rejected due to CSRF complexity with CORS

**Rationale:**
- Access token in memory/localStorage allows easy API calls without cookie complexity
- 15min TTL limits exposure if access token is compromised
- Refresh token in httpOnly cookie prevents XSS attacks
- 7-day TTL balances security and UX (user stays logged in for a week)
- Refresh token rotation (single-use) prevents token replay attacks
- Redis blacklist for logout/security events allows immediate invalidation

### Decision 3: Organization Slug Generation from Name

**Choice:** Generate URL-friendly slug from organization name (e.g., "ACME Corp" → "acme-corp"), add numeric suffix on collision.

**Alternatives Considered:**
- UUID-based URLs: Rejected due to poor UX and memorability
- Manual slug entry: Rejected to reduce signup friction
- Email domain as slug: Rejected due to multiple orgs potentially sharing domain

**Rationale:**
- Friendly URLs improve UX and branding (e.g., `app.crm.com/acme-corp`)
- Automatic generation removes signup friction
- Collision handling with numeric suffix ("acme-corp-2") is acceptable for rare cases
- Can be changed later by OWNER in organization settings

### Decision 4: Bcrypt 12 Rounds for Password Hashing

**Choice:** Use bcrypt with 12 rounds (cost factor).

**Alternatives Considered:**
- Bcrypt 10 rounds: Rejected as too fast for modern hardware
- Bcrypt 14+ rounds: Rejected due to performance impact (>200ms per hash on target hardware)
- Argon2: Rejected due to lower ecosystem maturity in Node.js

**Rationale:**
- 12 rounds balances security (~250ms hash time) and UX
- Bcrypt is battle-tested and widely supported in Node.js
- Future: Can migrate to Argon2 with password rehashing on login

### Decision 5: Invitation Token Strategy

**Choice:** Generate random 32-byte token, store in `invitations` table with expiry (7 days), send via email with accept link.

**Alternatives Considered:**
- JWT invitation tokens: Rejected because cannot invalidate if user cancels
- Short numeric codes: Rejected due to brute-force risk
- Magic link (no password): Rejected for MVP complexity

**Rationale:**
- Database-stored tokens allow manual invalidation
- 32-byte random token (base64url) has 256-bit entropy (secure against brute force)
- 7-day expiry balances convenience and security
- Email link with token allows direct navigation to accept page

### Decision 6: Rate Limiting Strategy

**Choice:** Use express-rate-limit with Redis store.
- POST `/auth/register`: 10 requests per hour per IP
- POST `/auth/login`: 5 requests per minute per IP
- POST `/auth/refresh`: 20 requests per minute per user
- POST `/auth/invite`: 10 requests per hour per organization

**Alternatives Considered:**
- Per-user rate limiting only: Rejected because unauthenticated endpoints need IP-based protection
- Stricter limits: Rejected due to legitimate retry scenarios (typos, password managers)
- CAPTCHA on failures: Deferred to Phase 2

**Rationale:**
- Protects against credential stuffing, brute force, and enumeration attacks
- Redis store allows rate limiting across multiple backend replicas
- Different limits per endpoint match threat model and UX expectations
- 429 Too Many Requests with Retry-After header provides clear feedback

## Architecture

### Clean Architecture Layers

```
Presentation Layer (Controllers/DTOs)
    ↓
Application Layer (Use Cases)
    ↓
Domain Layer (Entities/Value Objects)
    ↓
Infrastructure Layer (Repositories/External Services)
```

**Domain Layer:**
- Entities: `User`, `Organization`, `RefreshToken`, `Invitation`
- Value Objects: `Email`, `Password` (with validation rules), `Role` (enum)
- Domain Services: `PasswordHashingService`, `TokenGenerationService`

**Application Layer:**
- Use Cases: `RegisterUseCase`, `LoginUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`, `InviteUserUseCase`, `AcceptInvitationUseCase`
- DTOs: Request/Response DTOs with validation decorators
- Interfaces: Repository interfaces for dependency inversion

**Infrastructure Layer:**
- Repositories: `UserRepository`, `OrganizationRepository`, `RefreshTokenRepository`, `InvitationRepository` (Drizzle ORM)
- Services: `EmailService` (Bull Queue), `RedisService` (token blacklist)
- Strategies: `JwtStrategy`, `RefreshTokenStrategy` (Passport)

**Presentation Layer:**
- Controllers: `AuthController` (REST endpoints)
- Guards: `JwtAuthGuard`, `RolesGuard`, `OrganizationGuard`
- Decorators: `@CurrentUser()`, `@CurrentOrganization()`, `@Roles()`

### Database Schema

```typescript
// New tables (add to Drizzle schemas)

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'admin', 'agent', 'viewer'
  token: text('token').unique().notNull(),
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Indexes
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);
```

### API Endpoints

**POST /auth/register**
```typescript
Request:
{
  email: string;          // "user@example.com"
  password: string;       // Min 8 chars, 1 uppercase, 1 number
  name: string;           // "John Doe"
  organizationName: string; // "ACME Corp"
}

Response (201):
{
  accessToken: string;
  refreshToken: string;  // Set as httpOnly cookie
  user: {
    id: string;
    email: string;
    name: string;
    role: "owner";
    organizationId: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

Errors:
- 400: Validation errors (invalid email, weak password)
- 409: Email already exists
- 429: Too many registration attempts
```

**POST /auth/login**
```typescript
Request:
{
  email: string;
  password: string;
}

Response (200):
{
  accessToken: string;
  refreshToken: string;  // Set as httpOnly cookie
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
  };
}

Errors:
- 401: Invalid credentials
- 429: Too many login attempts (5/min)
```

**POST /auth/refresh**
```typescript
Request: (refreshToken from httpOnly cookie)

Response (200):
{
  accessToken: string;
  refreshToken: string;  // New token, old one invalidated
}

Errors:
- 401: Invalid or expired refresh token
- 403: Refresh token has been revoked
```

**POST /auth/logout**
```typescript
Request: (Authorization: Bearer <accessToken>)

Response (204): No content

Side effects:
- Refresh token invalidated in database
- Refresh token added to Redis blacklist (TTL = remaining time)
```

**POST /auth/invite**
```typescript
Request: (Requires OWNER or ADMIN role)
{
  email: string;
  role: "admin" | "agent" | "viewer";  // Cannot invite as OWNER
}

Response (201):
{
  invitation: {
    id: string;
    email: string;
    role: string;
    expiresAt: string;
    inviteLink: string;  // "https://app.crm.com/auth/invite/{token}"
  };
}

Errors:
- 400: Invalid email or role
- 403: Insufficient permissions (not OWNER/ADMIN)
- 409: User already exists or pending invitation
- 429: Too many invitations (10/hour per org)
```

**POST /auth/invite/:token/accept**
```typescript
Request:
{
  password: string;
  name: string;
}

Response (200):
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
  };
}

Errors:
- 400: Invalid or expired invitation token
- 409: User already accepted invitation
```

### JWT Payload Structure

```typescript
// Access Token (15min)
{
  sub: string;           // userId
  email: string;
  organizationId: string;
  role: "owner" | "admin" | "agent" | "viewer";
  iat: number;
  exp: number;
}

// Refresh Token (7 days)
{
  sub: string;           // userId
  tokenId: string;       // UUID of refresh_tokens record
  iat: number;
  exp: number;
}
```

### Frontend Architecture

**Auth Store (Zustand):**
```typescript
interface AuthState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (data: AuthResponse) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}
```

**API Client (Axios):**
```typescript
// Request interceptor: Add access token to headers
axios.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 with refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data } = await axios.post('/auth/refresh');
        authStore.getState().setAuth(data);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        authStore.getState().clearAuth();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

**Protected Route Component:**
```typescript
function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/auth/login" />;
  
  if (requiredRole && !hasRole(user.role, requiredRole)) {
    return <Navigate to="/403" />;
  }
  
  return <>{children}</>;
}
```

## Risks / Trade-offs

**[Risk] Refresh token stored in browser cookie vulnerable to CSRF** 
→ **Mitigation:** Use SameSite=Strict cookie attribute + Origin header validation on refresh endpoint + Short-lived access tokens limit damage window

**[Risk] Access token in localStorage vulnerable to XSS**
→ **Mitigation:** Strict CSP headers + XSS protection middleware + Regular security audits + Consider moving to httpOnly cookie in future (requires CSRF strategy)

**[Risk] Bcrypt blocking event loop during password hashing**
→ **Mitigation:** Use bcrypt async methods (bcrypt.hash, not hashSync) + Consider worker threads for high load + Benchmark shows <250ms acceptable for auth endpoints

**[Risk] Rate limiting shared state across replicas may allow bypass**
→ **Mitigation:** Use Redis as centralized rate limit store + Atomic increment operations + Consider progressive backoff for repeat offenders

**[Risk] Organization slug collisions on high volume**
→ **Mitigation:** Append incremental suffix ("acme-corp-2") + Manual slug editing in settings + Monitor collision rate in metrics

**[Risk] Invitation token enumeration if not rate limited**
→ **Mitigation:** 32-byte random token (256-bit entropy) + Rate limit token acceptance attempts + Short expiry (7 days) + Email notification on acceptance

**[Risk] Refresh token database growth over time**
→ **Mitigation:** Cron job to delete expired tokens (7 days old) + Automatic cleanup on user logout + Index on expires_at for efficient queries

**[Trade-off] One organization per user simplifies auth but limits use cases**
→ **Impact:** Agencies or consultants managing multiple clients cannot switch contexts. **Future:** Add `user_organizations` join table for many-to-many relationship

**[Trade-off] No email verification reduces security but improves onboarding**
→ **Impact:** Fake emails can create accounts. **Mitigation:** Monitor signup patterns + Rate limiting + CAPTCHA on abuse detection + Phase 2: Optional verification

**[Trade-off] 15min access token requires frequent refresh calls**
→ **Impact:** More network requests, potential UX hiccups on poor connections. **Benefit:** Shorter exposure window for compromised tokens. **Mitigation:** Transparent refresh in Axios interceptor

## Migration Plan

**Phase 1: Database Setup**
1. Create Drizzle migration for `refresh_tokens` and `invitations` tables
2. Add indexes for performance
3. Run migration in development environment
4. Verify foreign key constraints and cascading deletes

**Phase 2: Backend Implementation**
1. Implement domain entities and value objects
2. Create repository interfaces and implementations
3. Implement use cases with unit tests (80%+ coverage)
4. Create DTOs with validation
5. Implement Passport strategies (JWT, Refresh)
6. Create guards and decorators
7. Implement auth controller endpoints
8. Add rate limiting middleware
9. Integration tests for all endpoints
10. E2E test for complete registration → login → protected resource flow

**Phase 3: Frontend Implementation**
1. Create Zustand auth store
2. Implement Axios interceptors for token management
3. Build registration form with validation (React Hook Form + Zod)
4. Build login form
5. Build invitation acceptance page
6. Create protected route component
7. Add logout functionality
8. Handle token refresh errors gracefully

**Phase 4: Testing & Security**
1. Security audit: OWASP Top 10 checklist
2. Load testing: Verify rate limiting under concurrent requests
3. Penetration testing: Token vulnerabilities, enumeration attacks
4. Cross-tenant isolation testing: Verify organizationId filtering prevents data leaks

**Rollback Strategy:**
- Database migration rollback: Drop new tables, no data loss (fresh system)
- Backend deployment: Blue-green deployment with health checks
- Frontend deployment: CDN rollback to previous version
- Redis flush: Clear rate limit data if needed

## Open Questions

1. **Email service for invitations:** Use Bull Queue with SendGrid/SES, or defer to Phase 2 and log invitation links for manual sending in MVP?
   - **Recommendation:** Log to console for MVP, add Bull Queue + SendGrid in Phase 1.5

2. **Password reset flow:** Include in Phase 1 or defer to Phase 1.5?
   - **Recommendation:** Defer to Phase 1.5 (forgot password endpoint + email with reset token)

3. **Session management UI:** Should users see active sessions and remote logout capability?
   - **Recommendation:** Phase 2 feature (requires tracking all refresh tokens per user)

4. **Organization deletion:** What happens to users when organization is deleted? Soft delete or hard delete?
   - **Recommendation:** Soft delete with `deletedAt` timestamp + data retention policy (LGPD compliance)

5. **Audit logging:** Log all authentication events (login, logout, invitation) to separate audit table?
   - **Recommendation:** Yes, add `audit_logs` table with structured JSON events for compliance

6. **CAPTCHA integration:** Add reCAPTCHA to registration/login after N failed attempts?
   - **Recommendation:** Phase 2, use rate limiting for MVP
