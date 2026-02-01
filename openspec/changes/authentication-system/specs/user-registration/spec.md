## ADDED Requirements

### Requirement: User registration with email and password

The system SHALL allow new users to register with email, password, full name, and organization name. Upon successful registration, the system MUST create a new organization and assign the user as OWNER role.

#### Scenario: Successful registration creates user and organization

- **WHEN** a new user submits valid registration data (email: "user@example.com", password: "SecurePass123", name: "John Doe", organizationName: "ACME Corp")
- **THEN** the system creates a new user with OWNER role
- **THEN** the system creates a new organization with name "ACME Corp" and slug "acme-corp"
- **THEN** the system links the user to the organization via organizationId
- **THEN** the system returns JWT access token (15min TTL) and refresh token (7 days TTL)
- **THEN** the system returns user and organization details

#### Scenario: Registration fails with existing email

- **WHEN** a user attempts to register with an email that already exists in the system
- **THEN** the system returns 409 Conflict error
- **THEN** the system includes error message "Email already registered"
- **THEN** no new user or organization is created

#### Scenario: Registration fails with weak password

- **WHEN** a user submits a password that does not meet requirements (less than 8 characters, no uppercase, or no number)
- **THEN** the system returns 400 Bad Request error
- **THEN** the system includes validation error details for password field
- **THEN** no user or organization is created

### Requirement: Email validation

The system SHALL validate email format during registration and reject invalid emails.

#### Scenario: Registration rejects invalid email format

- **WHEN** a user submits an email with invalid format (e.g., "notanemail", "user@", "@example.com")
- **THEN** the system returns 400 Bad Request error
- **THEN** the system includes validation error "Invalid email format"
- **THEN** no user or organization is created

### Requirement: Password strength validation

The system SHALL enforce password requirements: minimum 8 characters, at least one uppercase letter, at least one number.

#### Scenario: Password must have minimum 8 characters

- **WHEN** a user submits a password with less than 8 characters (e.g., "Pass12")
- **THEN** the system returns 400 Bad Request error
- **THEN** the system includes validation error "Password must be at least 8 characters"

#### Scenario: Password must contain uppercase letter

- **WHEN** a user submits a password without uppercase letters (e.g., "password123")
- **THEN** the system returns 400 Bad Request error
- **THEN** the system includes validation error "Password must contain at least one uppercase letter"

#### Scenario: Password must contain number

- **WHEN** a user submits a password without numbers (e.g., "Password")
- **THEN** the system returns 400 Bad Request error
- **THEN** the system includes validation error "Password must contain at least one number"

### Requirement: Organization name validation

The system SHALL validate organization name is not empty and does not exceed 100 characters.

#### Scenario: Organization name cannot be empty

- **WHEN** a user submits registration with empty organization name
- **THEN** the system returns 400 Bad Request error
- **THEN** the system includes validation error "Organization name is required"

#### Scenario: Organization name cannot exceed 100 characters

- **WHEN** a user submits an organization name with more than 100 characters
- **THEN** the system returns 400 Bad Request error
- **THEN** the system includes validation error "Organization name must not exceed 100 characters"

### Requirement: Organization slug generation

The system SHALL automatically generate a URL-friendly slug from the organization name. If a collision occurs, the system MUST append a numeric suffix (e.g., "acme-corp-2").

#### Scenario: Slug generated from organization name

- **WHEN** a user registers with organization name "ACME Corp"
- **THEN** the system generates slug "acme-corp" (lowercase, spaces replaced with hyphens, special characters removed)
- **THEN** the organization is created with this slug

#### Scenario: Slug collision handling with numeric suffix

- **WHEN** a user registers with organization name "ACME Corp" and slug "acme-corp" already exists
- **THEN** the system generates slug "acme-corp-2"
- **THEN** if "acme-corp-2" also exists, the system tries "acme-corp-3" and increments until unique slug is found

### Requirement: Password hashing with bcrypt

The system SHALL hash passwords using bcrypt with 12 rounds before storing in database. Plaintext passwords MUST NOT be stored.

#### Scenario: Password is hashed before storage

- **WHEN** a user registers with password "SecurePass123"
- **THEN** the system hashes the password using bcrypt with cost factor 12
- **THEN** the system stores only the bcrypt hash in the database
- **THEN** the plaintext password is never persisted

### Requirement: Rate limiting on registration endpoint

The system SHALL limit registration attempts to 10 requests per hour per IP address to prevent abuse and automated signups.

#### Scenario: Registration allowed within rate limit

- **WHEN** an IP address makes 5 registration attempts within one hour
- **THEN** all requests are processed normally
- **THEN** no rate limit error is returned

#### Scenario: Registration blocked after exceeding rate limit

- **WHEN** an IP address makes 11 registration attempts within one hour
- **THEN** the 11th request returns 429 Too Many Requests error
- **THEN** the response includes "Retry-After" header indicating when to retry
- **THEN** the response includes error message "Too many registration attempts, please try again later"

### Requirement: Transactional consistency for user and organization creation

The system SHALL create user and organization in a single database transaction. If either creation fails, both MUST be rolled back.

#### Scenario: Rollback on organization creation failure

- **WHEN** user creation succeeds but organization creation fails (e.g., database constraint violation)
- **THEN** the system rolls back the user creation
- **THEN** no user or organization is persisted
- **THEN** the system returns 500 Internal Server Error

#### Scenario: Rollback on user creation failure

- **WHEN** organization creation succeeds but user creation fails
- **THEN** the system rolls back the organization creation
- **THEN** no user or organization is persisted
- **THEN** the system returns 500 Internal Server Error

### Requirement: OWNER role assignment on registration

The system SHALL assign the OWNER role to the user who creates the organization during registration. The OWNER role has full access including billing and team management.

#### Scenario: Registered user has OWNER role

- **WHEN** a user completes registration
- **THEN** the user record has role set to "owner"
- **THEN** the user has permission to all OWNER-level actions (invite users, manage billing, delete organization)

### Requirement: Audit logging for registration events

The system SHALL log all registration attempts (successful and failed) with timestamp, IP address, email, and outcome for security auditing.

#### Scenario: Successful registration is logged

- **WHEN** a user successfully registers
- **THEN** the system logs an audit event with type "USER_REGISTERED"
- **THEN** the log includes userId, organizationId, email, IP address, timestamp, and user agent

#### Scenario: Failed registration is logged

- **WHEN** a registration attempt fails (e.g., duplicate email, weak password)
- **THEN** the system logs an audit event with type "REGISTRATION_FAILED"
- **THEN** the log includes email, IP address, timestamp, failure reason, and user agent
