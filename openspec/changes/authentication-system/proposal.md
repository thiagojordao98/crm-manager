## Why

The CRM Manager is a multi-tenant SaaS platform targeting Brazilian SMEs. Without authentication and authorization, we cannot isolate customer data, enforce access control, or enable team collaboration. Authentication is the foundation that enables all other bounded contexts (Contacts, Conversations, Deals, Payments) to operate securely with proper tenant isolation. Given our self-service business model (targeting 10+ companies in 3 months), we need frictionless signup with auto-organization creation to minimize sales friction and enable immediate trial access.

## What Changes

- **Self-service registration flow**: Users sign up with email, password, name, and organization name. System automatically creates organization and assigns user as OWNER.
- **JWT-based authentication**: Access tokens (15min TTL) and refresh tokens (7 days TTL) for stateless authentication across backend replicas.
- **Organization-first model**: Every user belongs to exactly one organization (defined by `organizationId NOT NULL` in database). Organization is created during registration and becomes the tenant boundary for all data.
- **Team collaboration via invitations**: Organization OWNER/ADMIN can invite users via email. Invited users complete registration and join existing organization with assigned role (ADMIN, AGENT, VIEWER).
- **Role-based access control (RBAC)**: Four roles with hierarchical permissions - OWNER (billing + all features), ADMIN (all features except billing), AGENT (conversations, contacts), VIEWER (read-only).
- **Multi-tenant isolation**: JWT payload includes `organizationId` claim. All queries automatically filtered by organization to prevent cross-tenant data access.
- **Session management**: Refresh token stored in httpOnly cookie, access token in memory. Logout invalidates refresh tokens.
- **Security hardening**: Bcrypt password hashing (12 rounds), rate limiting on auth endpoints (5 req/min per IP), email verification optional for MVP but database-ready.

## Capabilities

### New Capabilities

- `user-registration`: Self-service signup with auto-organization creation, validation rules (email format, password strength), duplicate prevention, OWNER role assignment
- `user-authentication`: Login with email/password, JWT token generation with organizationId claim, refresh token flow, logout with token invalidation
- `organization-management`: Organization creation during signup, organization context in all requests, slug generation for friendly URLs
- `user-invitations`: Email-based invitation system, invite token generation/validation, role assignment during invitation, pending invitations tracking
- `session-management`: Refresh token storage and rotation, access token renewal, session invalidation on logout/password-change
- `rbac-enforcement`: Permission checks in guards, role-based route protection, organization ownership validation, audit logging for authorization failures

### Modified Capabilities

- None (this is the first bounded context being implemented)

## Impact

**Database Schema:**
- Tables already exist: `users`, `organizations`
- New tables needed: `refresh_tokens`, `invitations`
- Indexes needed: `users.email`, `organizations.slug`, `refresh_tokens.token`, `invitations.email`

**Backend Modules:**
- New module: `src/modules/auth/` following Clean Architecture layers (domain, application, infrastructure, presentation)
- Use cases: RegisterUseCase, LoginUseCase, RefreshTokenUseCase, LogoutUseCase, InviteUserUseCase, AcceptInvitationUseCase
- Guards: JwtAuthGuard, RolesGuard, OrganizationGuard
- Strategies: JwtStrategy, RefreshTokenStrategy
- DTOs: RegisterDto, LoginDto, AuthResponseDto, InviteUserDto

**Frontend Components:**
- New pages: `/auth/register`, `/auth/login`, `/auth/invite/:token`
- Forms: RegistrationForm, LoginForm, InviteAcceptForm (React Hook Form + Zod)
- Auth context: Zustand store for user state, token management, organization context
- API client: Axios interceptors for token refresh, automatic retry on 401

**Infrastructure:**
- Passport JWT middleware configuration
- Rate limiting middleware (express-rate-limit) on POST `/auth/*` endpoints
- CORS configuration allowing frontend origin with credentials
- Redis for refresh token blacklist (logout/security events)

**Security Considerations:**
- Password hashing: bcrypt 12 rounds (balance between security and performance)
- JWT secrets: Strong random secrets stored in environment variables (separate for access/refresh)
- Token rotation: Refresh tokens are single-use (invalidated after generating new access token)
- HTTPS only: Secure cookies require HTTPS in production
- Rate limiting: 5 login attempts per minute per IP, 10 registration attempts per hour per IP
- SQL injection prevention: Drizzle ORM parameterized queries
- XSS protection: Helmet.js security headers
- CSRF protection: SameSite cookies + token validation

**Dependencies:**
- Backend: `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`
- Frontend: `react-hook-form`, `zod`, `@tanstack/react-query`, `zustand`
- Both: TypeScript types for DTOs shared via monorepo workspace

**Testing Requirements:**
- Unit tests: Use cases (80%+ coverage), domain logic, validators
- Integration tests: Auth endpoints, JWT validation, refresh flow
- E2E tests: Complete registration → login → protected route → logout flow
- Security tests: Rate limiting, token expiration, cross-tenant isolation
