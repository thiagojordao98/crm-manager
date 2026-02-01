## ADDED Requirements

### Requirement: User login with email and password

The system SHALL allow registered users to authenticate using their email address and password. Upon successful authentication, the system MUST return JWT access token and refresh token.

#### Scenario: Successful login with valid credentials

- **WHEN** a user submits valid email "user@example.com" and correct password
- **THEN** the system verifies the password against the stored bcrypt hash
- **THEN** the system generates a new JWT access token with 15-minute expiry
- **THEN** the system generates a new refresh token with 7-day expiry
- **THEN** the system returns both tokens and user details (id, email, name, role, organizationId)

#### Scenario: Login fails with incorrect password

- **WHEN** a user submits valid email but incorrect password
- **THEN** the system returns 401 Unauthorized error
- **THEN** the system includes generic error message "Invalid credentials"
- **THEN** no tokens are generated

#### Scenario: Login fails with non-existent email

- **WHEN** a user submits an email that does not exist in the system
- **THEN** the system returns 401 Unauthorized error
- **THEN** the system includes generic error message "Invalid credentials"
- **THEN** no tokens are generated

### Requirement: JWT access token generation

The system SHALL generate JWT access tokens containing user claims: userId (sub), email, organizationId, and role. Tokens MUST expire after 15 minutes.

#### Scenario: Access token contains required claims

- **WHEN** a user successfully logs in
- **THEN** the generated access token payload includes "sub" (userId as UUID)
- **THEN** the payload includes "email" (user's email address)
- **THEN** the payload includes "organizationId" (UUID of user's organization)
- **THEN** the payload includes "role" (one of: "owner", "admin", "agent", "viewer")
- **THEN** the payload includes "iat" (issued at timestamp)
- **THEN** the payload includes "exp" (expiry timestamp = iat + 15 minutes)

#### Scenario: Access token expires after 15 minutes

- **WHEN** a user logs in at timestamp T
- **THEN** the access token "exp" claim is set to T + 900 seconds (15 minutes)
- **THEN** requests using this token after expiry return 401 Unauthorized

### Requirement: Refresh token generation and storage

The system SHALL generate refresh tokens, store them in the database with expiry date, and return them as httpOnly cookies. Refresh tokens MUST expire after 7 days.

#### Scenario: Refresh token stored in database

- **WHEN** a user logs in
- **THEN** the system generates a random refresh token (UUID)
- **THEN** the system stores the token in refresh_tokens table with userId, token value, expiry (7 days), IP address, and user agent
- **THEN** the system returns the token as httpOnly cookie with SameSite=Strict

#### Scenario: Refresh token expires after 7 days

- **WHEN** a user logs in at timestamp T
- **THEN** the refresh token database record has expiresAt = T + 7 days
- **THEN** refresh requests using this token after expiry return 401 Unauthorized

### Requirement: Rate limiting on login endpoint

The system SHALL limit login attempts to 5 requests per minute per IP address to prevent brute force attacks.

#### Scenario: Login allowed within rate limit

- **WHEN** an IP address makes 3 login attempts within one minute
- **THEN** all requests are processed normally
- **THEN** no rate limit error is returned

#### Scenario: Login blocked after exceeding rate limit

- **WHEN** an IP address makes 6 login attempts within one minute
- **THEN** the 6th request returns 429 Too Many Requests error
- **THEN** the response includes "Retry-After" header with seconds until reset
- **THEN** the response includes error message "Too many login attempts, please try again later"

### Requirement: Password comparison using bcrypt

The system SHALL use bcrypt.compare() to verify submitted passwords against stored hashes. Timing attacks MUST be mitigated by using constant-time comparison.

#### Scenario: Password verification uses bcrypt comparison

- **WHEN** a user submits password "SecurePass123" during login
- **THEN** the system retrieves the stored bcrypt hash from database
- **THEN** the system calls bcrypt.compare("SecurePass123", storedHash)
- **THEN** authentication succeeds only if comparison returns true

### Requirement: Last login timestamp update

The system SHALL update the user's lastLoginAt timestamp on successful authentication.

#### Scenario: Last login timestamp recorded

- **WHEN** a user successfully logs in at timestamp T
- **THEN** the system updates users.lastLoginAt to T
- **THEN** subsequent queries for this user return the updated lastLoginAt value

### Requirement: Audit logging for authentication events

The system SHALL log all login attempts (successful and failed) with timestamp, IP address, email, and outcome for security auditing.

#### Scenario: Successful login is logged

- **WHEN** a user successfully logs in
- **THEN** the system logs an audit event with type "USER_LOGGED_IN"
- **THEN** the log includes userId, organizationId, email, IP address, timestamp, and user agent

#### Scenario: Failed login is logged

- **WHEN** a login attempt fails (incorrect password, non-existent user)
- **THEN** the system logs an audit event with type "LOGIN_FAILED"
- **THEN** the log includes email (if provided), IP address, timestamp, failure reason, and user agent

### Requirement: Generic error messages for security

The system SHALL return generic "Invalid credentials" error for both incorrect password and non-existent email to prevent user enumeration attacks.

#### Scenario: Same error message for incorrect password and non-existent email

- **WHEN** a user submits non-existent email "fake@example.com"
- **THEN** the system returns 401 with message "Invalid credentials"
- **WHEN** a user submits existing email with wrong password
- **THEN** the system returns 401 with message "Invalid credentials"
- **THEN** response time is similar for both cases (mitigate timing attacks)

### Requirement: User logout with token invalidation

The system SHALL allow authenticated users to logout, invalidating their refresh token and adding it to a Redis blacklist.

#### Scenario: Logout invalidates refresh token

- **WHEN** an authenticated user calls POST /auth/logout
- **THEN** the system deletes the refresh token from database
- **THEN** the system adds the refresh token to Redis blacklist with TTL equal to remaining token lifetime
- **THEN** the system clears the refresh token httpOnly cookie
- **THEN** the system returns 204 No Content

#### Scenario: Logout prevents subsequent refresh token use

- **WHEN** a user logs out
- **THEN** attempts to use the invalidated refresh token return 401 Unauthorized
- **THEN** the error message is "Refresh token has been revoked"
