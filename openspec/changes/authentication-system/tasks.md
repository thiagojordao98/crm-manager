## 1. Database Schema & Migrations

- [ ] 1.1 Create Drizzle schema for `refresh_tokens` table with userId, token, expiresAt, ipAddress, userAgent fields
- [ ] 1.2 Create Drizzle schema for `invitations` table with email, organizationId, role, token, invitedBy, expiresAt, acceptedAt fields
- [ ] 1.3 Add indexes: `refresh_tokens(user_id)`, `refresh_tokens(token)`, `invitations(email)`, `invitations(token)`, `invitations(organization_id)`
- [ ] 1.4 Generate and run Drizzle migration for new tables
- [ ] 1.5 Test: Verify tables exist with correct schema using `npm run db:studio`
- [ ] 1.6 Add `emailVerified` (nullable boolean) and `emailVerificationToken` (nullable text) columns to `users` table for future email verification

## 2. Domain Layer - Entities & Value Objects

- [ ] 2.1 Create `User` entity in `apps/backend/src/modules/auth/domain/entities/user.entity.ts` with id, email, passwordHash, name, role, organizationId
- [ ] 2.2 Create `Organization` entity in `apps/backend/src/modules/auth/domain/entities/organization.entity.ts`
- [ ] 2.3 Create `RefreshToken` entity in `apps/backend/src/modules/auth/domain/entities/refresh-token.entity.ts`
- [ ] 2.4 Create `Invitation` entity in `apps/backend/src/modules/auth/domain/entities/invitation.entity.ts`
- [ ] 2.5 Create `Email` value object in `apps/backend/src/modules/auth/domain/value-objects/email.vo.ts` with format validation
- [ ] 2.6 Create `Password` value object in `apps/backend/src/modules/auth/domain/value-objects/password.vo.ts` with strength validation (8+ chars, uppercase, number)
- [ ] 2.7 Create `Role` enum in `apps/backend/src/modules/auth/domain/enums/role.enum.ts` with OWNER, ADMIN, AGENT, VIEWER
- [ ] 2.8 Test: Unit tests for Email and Password value objects covering validation rules

## 3. Infrastructure Layer - Repositories

- [ ] 3.1 Create `IUserRepository` interface in `apps/backend/src/modules/auth/domain/repositories/user-repository.interface.ts`
- [ ] 3.2 Implement `UserRepository` using Drizzle in `apps/backend/src/modules/auth/infrastructure/repositories/user.repository.ts`
- [ ] 3.3 Create `IOrganizationRepository` interface and implement `OrganizationRepository` with slug generation logic (kebab-case, collision handling)
- [ ] 3.4 Create `IRefreshTokenRepository` interface and implement `RefreshTokenRepository`
- [ ] 3.5 Create `IInvitationRepository` interface and implement `InvitationRepository`
- [ ] 3.6 Test: Integration tests for each repository (CRUD operations, unique constraints, cascading deletes)

## 4. Infrastructure Layer - External Services

- [ ] 4.1 Create `PasswordHashingService` in `apps/backend/src/modules/auth/infrastructure/services/password-hashing.service.ts` using bcrypt with 12 rounds
- [ ] 4.2 Create `TokenGenerationService` in `apps/backend/src/modules/auth/infrastructure/services/token-generation.service.ts` for generating random tokens (32 bytes)
- [ ] 4.3 Install and configure `@nestjs/jwt` and `@nestjs/passport` packages
- [ ] 4.4 Create `JwtStrategy` in `apps/backend/src/modules/auth/infrastructure/strategies/jwt.strategy.ts` to validate access tokens
- [ ] 4.5 Create `RefreshTokenStrategy` in `apps/backend/src/modules/auth/infrastructure/strategies/refresh-token.strategy.ts`
- [ ] 4.6 Configure JWT module with secrets (JWT_SECRET, JWT_REFRESH_SECRET) and expiry times (15min, 7 days) in `auth.module.ts`
- [ ] 4.7 Test: Unit tests for PasswordHashingService (hash, compare), TokenGenerationService (uniqueness, entropy)

## 5. Application Layer - DTOs

- [ ] 5.1 Create `RegisterDto` in `apps/backend/src/modules/auth/application/dtos/register.dto.ts` with class-validator decorators (@IsEmail, @MinLength, etc.)
- [ ] 5.2 Create `LoginDto` with email and password validation
- [ ] 5.3 Create `AuthResponseDto` returning accessToken, refreshToken (exclude from response), user, organization
- [ ] 5.4 Create `InviteUserDto` with email and role validation (role cannot be 'owner')
- [ ] 5.5 Create `AcceptInvitationDto` with password and name validation
- [ ] 5.6 Create `UserResponseDto` and `OrganizationResponseDto` for nested responses
- [ ] 5.7 Test: Unit tests for DTO validation (valid/invalid cases)

## 6. Application Layer - Use Cases (Registration & Authentication)

- [ ] 6.1 Create `RegisterUseCase` in `apps/backend/src/modules/auth/application/use-cases/register.use-case.ts` implementing self-service registration with auto-org creation
- [ ] 6.2 Implement transactional logic: create organization → generate slug → create user as OWNER → return tokens
- [ ] 6.3 Test: Unit tests for RegisterUseCase (successful registration, duplicate email, weak password, slug collision)
- [ ] 6.4 Create `LoginUseCase` implementing email/password authentication, JWT generation, refresh token storage
- [ ] 6.5 Implement generic error message "Invalid credentials" for both wrong password and non-existent user
- [ ] 6.6 Update user.lastLoginAt timestamp on successful login
- [ ] 6.7 Test: Unit tests for LoginUseCase (successful login, wrong password, non-existent user, rate limiting)

## 7. Application Layer - Use Cases (Session Management)

- [ ] 7.1 Create `RefreshTokenUseCase` implementing token rotation (validate old token, generate new tokens, invalidate old)
- [ ] 7.2 Check Redis blacklist before database lookup for revoked tokens
- [ ] 7.3 Test: Unit tests for RefreshTokenUseCase (successful refresh, expired token, blacklisted token, invalid token)
- [ ] 7.4 Create `LogoutUseCase` implementing token invalidation (delete from DB, add to Redis blacklist with TTL)
- [ ] 7.5 Test: Unit tests for LogoutUseCase (successful logout, logout prevents subsequent token use)

## 8. Application Layer - Use Cases (Invitations)

- [ ] 8.1 Create `InviteUserUseCase` validating permissions (OWNER/ADMIN only), checking for existing users/pending invitations
- [ ] 8.2 Generate 32-byte random invitation token, store with 7-day expiry
- [ ] 8.3 Return invitation link in format "https://app.crm.com/auth/invite/{token}"
- [ ] 8.4 Test: Unit tests for InviteUserUseCase (successful invite, AGENT cannot invite, duplicate email, invalid role)
- [ ] 8.5 Create `AcceptInvitationUseCase` validating token, checking expiry, creating user with assigned role and organizationId
- [ ] 8.6 Mark invitation as accepted (set acceptedAt timestamp), prevent token reuse
- [ ] 8.7 Test: Unit tests for AcceptInvitationUseCase (successful acceptance, expired token, already accepted, invalid token)

## 9. Presentation Layer - Guards & Decorators

- [ ] 9.1 Create `JwtAuthGuard` in `apps/backend/src/modules/auth/presentation/guards/jwt-auth.guard.ts` extending AuthGuard('jwt')
- [ ] 9.2 Create `RolesGuard` implementing role validation against @Roles() decorator metadata
- [ ] 9.3 Implement role hierarchy: OWNER > ADMIN > AGENT > VIEWER (higher roles inherit lower permissions)
- [ ] 9.4 Create `OrganizationGuard` extracting organizationId from JWT and injecting into request context
- [ ] 9.5 Create `@CurrentUser()` decorator to extract user from request
- [ ] 9.6 Create `@CurrentOrganization()` decorator to extract organizationId from JWT
- [ ] 9.7 Create `@Roles(...roles)` decorator for role-based access control
- [ ] 9.8 Test: Unit tests for guards (JWT validation, role checking, organization extraction)

## 10. Presentation Layer - Controllers

- [ ] 10.1 Create `AuthController` in `apps/backend/src/modules/auth/presentation/controllers/auth.controller.ts`
- [ ] 10.2 Implement POST `/auth/register` endpoint calling RegisterUseCase, returning 201 with tokens and user
- [ ] 10.3 Implement POST `/auth/login` endpoint calling LoginUseCase, setting refresh token as httpOnly cookie
- [ ] 10.4 Implement POST `/auth/refresh` endpoint calling RefreshTokenUseCase, reading refresh token from cookie
- [ ] 10.5 Implement POST `/auth/logout` endpoint with @UseGuards(JwtAuthGuard), calling LogoutUseCase
- [ ] 10.6 Implement POST `/auth/invite` endpoint with @Roles('owner', 'admin'), calling InviteUserUseCase
- [ ] 10.7 Implement POST `/auth/invite/:token/accept` endpoint calling AcceptInvitationUseCase
- [ ] 10.8 Implement GET `/auth/invitations` endpoint with @Roles('owner', 'admin') listing pending invitations for organization
- [ ] 10.9 Test: E2E tests for all endpoints (success cases, error cases, authentication required)

## 11. Rate Limiting & Security

- [ ] 11.1 Install `@nestjs/throttler` package
- [ ] 11.2 Configure rate limiting: POST `/auth/register` (10/hour per IP), POST `/auth/login` (5/min per IP)
- [ ] 11.3 Configure rate limiting: POST `/auth/refresh` (20/min per user), POST `/auth/invite` (10/hour per org)
- [ ] 11.4 Configure Redis as rate limit storage for consistency across replicas
- [ ] 11.5 Install `helmet` for security headers (XSS, CSP, etc.)
- [ ] 11.6 Configure CORS to allow frontend origin with credentials
- [ ] 11.7 Test: Verify rate limiting triggers 429 response after threshold exceeded

## 12. Redis Integration for Token Blacklist

- [ ] 12.1 Create `RedisService` in `apps/backend/src/modules/auth/infrastructure/services/redis.service.ts`
- [ ] 12.2 Implement `addToBlacklist(token, ttl)` method
- [ ] 12.3 Implement `isBlacklisted(token)` method for fast lookup
- [ ] 12.4 Configure Redis connection in auth module using REDIS_URL from env
- [ ] 12.5 Test: Verify blacklisted tokens are rejected, TTL expires correctly

## 13. Audit Logging

- [ ] 13.1 Create `AuditLogService` in `apps/backend/src/shared/services/audit-log.service.ts`
- [ ] 13.2 Create `audit_logs` table schema with type, userId, metadata JSONB, ipAddress, timestamp
- [ ] 13.3 Log USER_REGISTERED events (userId, organizationId, email, IP, user agent)
- [ ] 13.4 Log USER_LOGGED_IN and LOGIN_FAILED events
- [ ] 13.5 Log AUTHORIZATION_FAILED and CROSS_TENANT_ACCESS_ATTEMPT events
- [ ] 13.6 Test: Verify audit logs are created for registration, login, failed attempts

## 14. Environment Configuration

- [ ] 14.1 Add JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN (15m), JWT_REFRESH_EXPIRES_IN (7d) to `.env.example`
- [ ] 14.2 Add FRONTEND_URL for CORS configuration
- [ ] 14.3 Generate strong random secrets for JWT_SECRET and JWT_REFRESH_SECRET (32+ bytes)
- [ ] 14.4 Update ConfigModule validation schema to require JWT environment variables

## 15. Frontend - Auth Store (Zustand)

- [ ] 15.1 Create auth store in `apps/frontend/src/stores/auth.store.ts` with user, organization, accessToken, isAuthenticated state
- [ ] 15.2 Implement `setAuth(data)` action storing user, organization, accessToken
- [ ] 15.3 Implement `clearAuth()` action resetting state on logout
- [ ] 15.4 Implement `updateUser(user)` action for partial user updates
- [ ] 15.5 Persist accessToken in localStorage for page reload persistence
- [ ] 15.6 Test: Verify state updates correctly on auth actions

## 16. Frontend - API Client & Interceptors

- [ ] 16.1 Create Axios client in `apps/frontend/src/lib/api-client.ts` with baseURL from env
- [ ] 16.2 Add request interceptor to inject access token in Authorization header
- [ ] 16.3 Add response interceptor to handle 401 errors by calling POST `/auth/refresh`
- [ ] 16.4 Implement automatic retry with new access token after successful refresh
- [ ] 16.5 Redirect to `/auth/login` if refresh fails (refresh token expired/invalid)
- [ ] 16.6 Test: Mock API responses, verify interceptor retries with refreshed token

## 17. Frontend - Registration Form

- [ ] 17.1 Create registration page at `apps/frontend/src/features/auth/pages/RegisterPage.tsx`
- [ ] 17.2 Create `RegistrationForm` component using React Hook Form
- [ ] 17.3 Create Zod schema validating email format, password strength (8+ chars, uppercase, number), name, organizationName
- [ ] 17.4 Implement form submission calling POST `/auth/register`, storing tokens, redirecting to dashboard
- [ ] 17.5 Display validation errors from backend (409 duplicate email, 400 weak password)
- [ ] 17.6 Show loading state during submission, disable submit button
- [ ] 17.7 Test: Component tests for validation, submission, error handling

## 18. Frontend - Login Form

- [ ] 18.1 Create login page at `apps/frontend/src/features/auth/pages/LoginPage.tsx`
- [ ] 18.2 Create `LoginForm` component with email and password fields
- [ ] 18.3 Create Zod schema for login validation
- [ ] 18.4 Implement form submission calling POST `/auth/login`, storing tokens, redirecting to dashboard
- [ ] 18.5 Display generic error "Invalid credentials" for 401 responses
- [ ] 18.6 Show rate limit error (429) with message to try again later
- [ ] 18.7 Test: Component tests for successful login, invalid credentials, rate limiting

## 19. Frontend - Invitation Acceptance Flow

- [ ] 19.1 Create invitation acceptance page at `apps/frontend/src/features/auth/pages/InviteAcceptPage.tsx`
- [ ] 19.2 Extract invitation token from URL params
- [ ] 19.3 Create form with password and name fields (email from invitation, read-only)
- [ ] 19.4 Implement form submission calling POST `/auth/invite/:token/accept`
- [ ] 19.5 Handle errors: expired token, invalid token, weak password
- [ ] 19.6 Redirect to dashboard on successful acceptance
- [ ] 19.7 Test: Component tests for token validation, acceptance flow, error cases

## 20. Frontend - Protected Routes

- [ ] 20.1 Create `ProtectedRoute` component in `apps/frontend/src/components/ProtectedRoute.tsx`
- [ ] 20.2 Check `isAuthenticated` from auth store, redirect to `/auth/login` if false
- [ ] 20.3 Implement optional `requiredRole` prop for role-based access control
- [ ] 20.4 Show loading spinner while checking auth state
- [ ] 20.5 Redirect to `/403` for insufficient permissions
- [ ] 20.6 Wrap dashboard routes with ProtectedRoute
- [ ] 20.7 Test: Verify redirection for unauthenticated users, role restrictions

## 21. Frontend - Logout Functionality

- [ ] 21.1 Create `useLogout` hook in `apps/frontend/src/features/auth/hooks/useLogout.ts`
- [ ] 21.2 Implement logout calling POST `/auth/logout`, clearing auth store, redirecting to `/auth/login`
- [ ] 21.3 Add logout button to app header/navbar
- [ ] 21.4 Handle logout errors gracefully (clear local state even if API fails)
- [ ] 21.5 Test: Verify state cleared, redirect works, API called

## 22. Frontend - User Invitation UI

- [ ] 22.1 Create invitation page at `apps/frontend/src/features/auth/pages/InvitePage.tsx` (OWNER/ADMIN only)
- [ ] 22.2 Create invitation form with email and role selection (admin, agent, viewer)
- [ ] 22.3 Implement form submission calling POST `/auth/invite`, showing success message with invite link
- [ ] 22.4 Create list of pending invitations calling GET `/auth/invitations`
- [ ] 22.5 Show invitation status (pending, expired, accepted) with visual indicators
- [ ] 22.6 Add copy-to-clipboard button for invitation links
- [ ] 22.7 Test: Component tests for form submission, invitation list, role-based visibility

## 23. Testing - Backend Unit Tests

- [ ] 23.1 Write unit tests for all use cases achieving 80%+ coverage
- [ ] 23.2 Mock repositories and external services in use case tests
- [ ] 23.3 Test edge cases: expired tokens, duplicate emails, weak passwords, role violations
- [ ] 23.4 Test transactional rollback scenarios (user creation fails → organization rolled back)
- [ ] 23.5 Run tests with `npm run test` and verify coverage meets threshold

## 24. Testing - Backend Integration Tests

- [ ] 24.1 Write integration tests for repositories with real database (test container)
- [ ] 24.2 Test cascade deletes (delete organization → users deleted, refresh tokens deleted)
- [ ] 24.3 Test unique constraints (duplicate emails, duplicate slugs)
- [ ] 24.4 Test indexes improve query performance
- [ ] 24.5 Run integration tests with `npm run test:integration`

## 25. Testing - Backend E2E Tests

- [ ] 25.1 Write E2E test for complete registration flow: POST `/auth/register` → verify user/org created → verify JWT valid
- [ ] 25.2 Write E2E test for login → refresh → logout flow
- [ ] 25.3 Write E2E test for invitation flow: invite user → accept invitation → verify user joins org with correct role
- [ ] 25.4 Write E2E test for cross-tenant isolation: user from org A cannot access org B data
- [ ] 25.5 Write E2E test for rate limiting: exceed limit → receive 429
- [ ] 25.6 Run E2E tests with `npm run test:e2e`

## 26. Testing - Frontend Component Tests

- [ ] 26.1 Write component tests for RegistrationForm using Vitest + React Testing Library
- [ ] 26.2 Write component tests for LoginForm
- [ ] 26.3 Write component tests for InviteAcceptForm
- [ ] 26.4 Write component tests for ProtectedRoute
- [ ] 26.5 Mock API responses using MSW (Mock Service Worker)
- [ ] 26.6 Run frontend tests with `npm run test -w frontend`

## 27. Documentation & Cleanup

- [ ] 27.1 Add JSDoc comments to all public methods in use cases and services
- [ ] 27.2 Update README.md with authentication flow diagrams
- [ ] 27.3 Document environment variables in .env.example with descriptions
- [ ] 27.4 Create API documentation for auth endpoints (request/response examples)
- [ ] 27.5 Add migration guide for running database migrations
- [ ] 27.6 Remove any console.log statements, use proper logging (Winston)

## 28. Security Review & Hardening

- [ ] 28.1 Verify all passwords are hashed with bcrypt (no plaintext storage)
- [ ] 28.2 Verify JWT secrets are strong random values (32+ bytes)
- [ ] 28.3 Verify refresh tokens are httpOnly cookies with SameSite=Strict
- [ ] 28.4 Verify rate limiting is active on all auth endpoints
- [ ] 28.5 Verify CORS is configured to allow only frontend origin
- [ ] 28.6 Verify helmet security headers are applied
- [ ] 28.7 Run OWASP dependency check for vulnerable packages
- [ ] 28.8 Verify SQL injection is prevented (Drizzle parameterized queries)

## 29. Deployment Preparation

- [ ] 29.1 Add health check endpoint including database and Redis connectivity
- [ ] 29.2 Configure Docker secrets for JWT_SECRET and JWT_REFRESH_SECRET in production
- [ ] 29.3 Update docker-compose.prod.yml with environment variables
- [ ] 29.4 Test production build: `npm run build -w backend` and `npm run build -w frontend`
- [ ] 29.5 Verify migrations run successfully in production-like environment
- [ ] 29.6 Document deployment steps for Docker Swarm

## 30. Final Verification

- [ ] 30.1 Manual testing: Register new account → verify organization created → login → invite user → logout
- [ ] 30.2 Manual testing: Accept invitation → verify user joins correct org with assigned role → login
- [ ] 30.3 Manual testing: Refresh token rotation → verify old token invalid, new token works
- [ ] 30.4 Manual testing: Rate limiting → exceed limits → verify 429 responses
- [ ] 30.5 Manual testing: Cross-tenant isolation → verify user cannot access other org data
- [ ] 30.6 Performance testing: Measure login/registration response times (target < 200ms p95)
- [ ] 30.7 Load testing: Verify system handles 100+ concurrent registrations
- [ ] 30.8 Security testing: Attempt token manipulation, expired tokens, cross-tenant access
