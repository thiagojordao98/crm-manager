## ADDED Requirements

### Requirement: Refresh token storage in database

The system SHALL store refresh tokens in the database with user association, expiry timestamp, and metadata (IP address, user agent).

#### Scenario: Refresh token stored on login

- **WHEN** a user successfully logs in
- **THEN** the system generates a refresh token (UUID)
- **THEN** the system creates a record in refresh_tokens table with userId, token, expiresAt (7 days), ipAddress, and userAgent
- **THEN** the refresh token is returned as httpOnly cookie

#### Scenario: Refresh token metadata captured

- **WHEN** a user logs in from IP "192.168.1.1" with user agent "Mozilla/5.0..."
- **THEN** the refresh token record stores ipAddress = "192.168.1.1"
- **THEN** the refresh token record stores userAgent = "Mozilla/5.0..."

### Requirement: Refresh token in httpOnly cookie

The system SHALL return refresh tokens as httpOnly cookies with SameSite=Strict and Secure attributes (in production) to prevent XSS attacks.

#### Scenario: Refresh token set as httpOnly cookie

- **WHEN** a user logs in
- **THEN** the response includes Set-Cookie header with refresh token
- **THEN** the cookie has httpOnly flag set to true
- **THEN** the cookie has SameSite attribute set to "Strict"
- **THEN** in production, the cookie has Secure flag set to true

### Requirement: Access token renewal via refresh token

The system SHALL allow authenticated users to renew expired access tokens using a valid refresh token without requiring re-authentication.

#### Scenario: Successful token refresh

- **WHEN** a user sends POST /auth/refresh with valid refresh token in cookie
- **THEN** the system validates the refresh token exists in database
- **THEN** the system verifies the refresh token has not expired
- **THEN** the system generates a new access token with 15-minute expiry
- **THEN** the system generates a new refresh token (single-use policy)
- **THEN** the system invalidates the old refresh token
- **THEN** the system returns new access token and sets new refresh token cookie

#### Scenario: Refresh fails with expired token

- **WHEN** a user sends refresh request with token that expired 1 day ago
- **THEN** the system returns 401 Unauthorized error
- **THEN** the error message is "Refresh token has expired"
- **THEN** no new tokens are generated

#### Scenario: Refresh fails with invalid token

- **WHEN** a user sends refresh request with non-existent or malformed token
- **THEN** the system returns 401 Unauthorized error
- **THEN** the error message is "Invalid refresh token"
- **THEN** no new tokens are generated

### Requirement: Single-use refresh tokens (rotation)

The system SHALL implement refresh token rotation: when a refresh token is used, it MUST be invalidated and a new one issued.

#### Scenario: Old refresh token invalidated after use

- **WHEN** a user refreshes access token using refresh token "token-abc-123"
- **THEN** the system generates new tokens
- **THEN** the old token "token-abc-123" is deleted from database
- **WHEN** someone attempts to reuse "token-abc-123"
- **THEN** the system returns 401 Unauthorized error

### Requirement: Refresh token blacklist in Redis

The system SHALL maintain a blacklist of revoked refresh tokens in Redis for immediate invalidation (logout, security events).

#### Scenario: Logout adds token to Redis blacklist

- **WHEN** a user logs out with refresh token "token-xyz-789"
- **THEN** the system deletes the token from database
- **THEN** the system adds "token-xyz-789" to Redis with key "blacklist:token-xyz-789"
- **THEN** the Redis key TTL is set to remaining token lifetime
- **THEN** future refresh attempts check Redis blacklist first

#### Scenario: Blacklisted token rejected immediately

- **WHEN** a refresh token exists in Redis blacklist
- **WHEN** a user attempts to use this token
- **THEN** the system checks Redis before database query
- **THEN** the system returns 403 Forbidden error
- **THEN** the error message is "Refresh token has been revoked"

### Requirement: Session invalidation on password change

The system SHALL invalidate all refresh tokens for a user when their password is changed.

#### Scenario: All user sessions invalidated on password change

- **WHEN** a user changes their password
- **THEN** the system deletes all refresh_tokens records for this userId
- **THEN** the system adds all deleted tokens to Redis blacklist
- **THEN** all active sessions are logged out
- **THEN** the user must log in again with new password

### Requirement: Refresh token cleanup job

The system SHALL automatically delete expired refresh tokens from database to prevent table bloat.

#### Scenario: Expired tokens cleaned up daily

- **WHEN** a daily cleanup cron job runs
- **THEN** the system deletes all refresh_tokens where expiresAt < current timestamp
- **THEN** disk space is reclaimed

### Requirement: Rate limiting on refresh endpoint

The system SHALL limit refresh token requests to 20 per minute per user to prevent abuse.

#### Scenario: Refresh allowed within rate limit

- **WHEN** a user makes 10 refresh requests within one minute
- **THEN** all requests are processed normally
- **THEN** no rate limit error is returned

#### Scenario: Refresh blocked after exceeding rate limit

- **WHEN** a user makes 21 refresh requests within one minute
- **THEN** the 21st request returns 429 Too Many Requests error
- **THEN** the response includes "Retry-After" header
- **THEN** the error message is "Too many refresh attempts, please slow down"

### Requirement: Refresh token expiry of 7 days

The system SHALL set refresh token expiry to 7 days from issuance. Tokens MUST NOT be usable after expiry.

#### Scenario: Refresh token expires after 7 days

- **WHEN** a refresh token is created at timestamp T
- **THEN** the expiresAt is set to T + 7 days
- **WHEN** the token is used at T + 8 days
- **THEN** the system returns 401 Unauthorized error
- **THEN** the error message is "Refresh token has expired"

### Requirement: Concurrent refresh token limit per user

The system SHALL limit active refresh tokens to 5 per user. When a 6th session is created, the oldest token MUST be invalidated.

#### Scenario: User can have up to 5 active sessions

- **WHEN** a user logs in from 5 different devices
- **THEN** 5 refresh tokens exist in database for this userId
- **THEN** all 5 tokens remain valid

#### Scenario: Oldest session invalidated when limit exceeded

- **WHEN** a user has 5 active refresh tokens
- **WHEN** the user logs in from a 6th device
- **THEN** the system finds the oldest token (earliest createdAt)
- **THEN** the system deletes the oldest token
- **THEN** the new token is created
- **THEN** only 5 tokens remain active for this user

### Requirement: Session list for user (future enhancement placeholder)

The system SHALL store refresh token metadata to enable future session management UI (list active sessions, remote logout).

#### Scenario: Refresh token includes device information

- **WHEN** a refresh token is created
- **THEN** the record includes ipAddress for location approximation
- **THEN** the record includes userAgent for device/browser identification
- **THEN** the record includes createdAt timestamp for "Last active" display
- **THEN** this data can be exposed in a future GET /auth/sessions endpoint
