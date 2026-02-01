## ADDED Requirements

### Requirement: Organization owner can invite users

The system SHALL allow users with OWNER or ADMIN role to invite new users to their organization via email. Invitations MUST include the role to be assigned and a unique invitation token.

#### Scenario: OWNER invites user as AGENT

- **WHEN** a user with OWNER role sends invitation to "newuser@example.com" with role "agent"
- **THEN** the system creates an invitation record with unique token (32-byte random)
- **THEN** the invitation expires in 7 days
- **THEN** the invitation is linked to the OWNER's organizationId
- **THEN** the system returns invitation details including invite link

#### Scenario: ADMIN invites user as VIEWER

- **WHEN** a user with ADMIN role sends invitation to "viewer@example.com" with role "viewer"
- **THEN** the system creates an invitation record
- **THEN** the invitation role is set to "viewer"
- **THEN** the system returns invitation details

#### Scenario: AGENT cannot invite users

- **WHEN** a user with AGENT role attempts to invite another user
- **THEN** the system returns 403 Forbidden error
- **THEN** the error message is "Insufficient permissions to invite users"
- **THEN** no invitation is created

### Requirement: Invitation token generation

The system SHALL generate secure random invitation tokens with 256-bit entropy (32 bytes base64url encoded) for each invitation.

#### Scenario: Invitation token is cryptographically secure

- **WHEN** an invitation is created
- **THEN** the system generates a random token using crypto.randomBytes(32)
- **THEN** the token is base64url encoded (URL-safe)
- **THEN** the token is stored in invitations table
- **THEN** the token is included in the invitation link

### Requirement: Invitation email validation

The system SHALL validate invitation email format and check for existing users or pending invitations before creating invitation.

#### Scenario: Cannot invite existing user

- **WHEN** an OWNER attempts to invite "existing@example.com" which already exists as a user
- **THEN** the system returns 409 Conflict error
- **THEN** the error message is "User with this email already exists"
- **THEN** no invitation is created

#### Scenario: Cannot create duplicate pending invitation

- **WHEN** an OWNER attempts to invite "pending@example.com" which already has a pending invitation
- **THEN** the system returns 409 Conflict error
- **THEN** the error message is "Invitation already sent to this email"
- **THEN** no new invitation is created

#### Scenario: Invalid email format rejected

- **WHEN** an OWNER attempts to invite with email "notanemail"
- **THEN** the system returns 400 Bad Request error
- **THEN** the error message is "Invalid email format"
- **THEN** no invitation is created

### Requirement: Invitation role restrictions

The system SHALL restrict invitation roles to "admin", "agent", or "viewer". Users cannot invite someone as "owner" role.

#### Scenario: Cannot invite as OWNER role

- **WHEN** a user attempts to invite someone with role "owner"
- **THEN** the system returns 400 Bad Request error
- **THEN** the error message is "Cannot invite users as OWNER role"
- **THEN** no invitation is created

#### Scenario: Valid roles accepted

- **WHEN** a user invites with role "admin", "agent", or "viewer"
- **THEN** the invitation is created successfully
- **THEN** the invited role is stored in the invitation record

### Requirement: Invitation expiry after 7 days

The system SHALL set invitation expiry to 7 days from creation. Expired invitations MUST be rejected during acceptance.

#### Scenario: Invitation created with 7-day expiry

- **WHEN** an invitation is created at timestamp T
- **THEN** the expiresAt field is set to T + 7 days
- **THEN** the invitation link remains valid for 7 days

#### Scenario: Expired invitation cannot be accepted

- **WHEN** a user attempts to accept an invitation after 7 days
- **THEN** the system returns 400 Bad Request error
- **THEN** the error message is "Invitation has expired"
- **THEN** no user account is created

### Requirement: Invitation acceptance flow

The system SHALL allow invited users to accept invitations by providing password and name. The user is created and assigned to the inviter's organization with the specified role.

#### Scenario: Successful invitation acceptance

- **WHEN** a user accesses invitation link with valid token
- **WHEN** the user submits password "SecurePass123" and name "Jane Doe"
- **THEN** the system validates the invitation token and checks expiry
- **THEN** the system creates new user with email from invitation
- **THEN** the user is assigned the organizationId from invitation
- **THEN** the user is assigned the role from invitation (e.g., "agent")
- **THEN** the invitation acceptedAt timestamp is set to current time
- **THEN** the system generates JWT tokens and returns authentication response

#### Scenario: Invitation acceptance validates password strength

- **WHEN** a user accepts invitation with weak password "pass"
- **THEN** the system returns 400 Bad Request error
- **THEN** the error message includes password requirements
- **THEN** no user is created

#### Scenario: Invalid invitation token rejected

- **WHEN** a user attempts to access invitation link with invalid/non-existent token
- **THEN** the system returns 400 Bad Request error
- **THEN** the error message is "Invalid invitation token"
- **THEN** no user is created

### Requirement: Single-use invitation tokens

The system SHALL mark invitation as accepted (acceptedAt timestamp) and prevent reuse of the same token.

#### Scenario: Accepted invitation cannot be reused

- **WHEN** a user successfully accepts an invitation with token "abc123"
- **WHEN** someone attempts to accept the same invitation token "abc123" again
- **THEN** the system returns 400 Bad Request error
- **THEN** the error message is "Invitation has already been accepted"
- **THEN** no additional user is created

### Requirement: Rate limiting on invitation creation

The system SHALL limit invitation creation to 10 requests per hour per organization to prevent spam.

#### Scenario: Invitations allowed within rate limit

- **WHEN** an organization sends 5 invitations within one hour
- **THEN** all invitations are created successfully
- **THEN** no rate limit error is returned

#### Scenario: Invitations blocked after exceeding rate limit

- **WHEN** an organization sends 11 invitations within one hour
- **THEN** the 11th request returns 429 Too Many Requests error
- **THEN** the response includes "Retry-After" header
- **THEN** the error message is "Too many invitations sent, please try again later"

### Requirement: Invitation tracking metadata

The system SHALL store invitation metadata including invitedBy (userId of inviter), createdAt, acceptedAt, and expiresAt for auditing.

#### Scenario: Invitation stores inviter information

- **WHEN** user "owner@example.com" (userId: "owner-123") invites "agent@example.com"
- **THEN** the invitation record has invitedBy field set to "owner-123"
- **THEN** the createdAt timestamp is set to current time
- **THEN** the acceptedAt is initially null
- **THEN** the expiresAt is set to createdAt + 7 days

### Requirement: Invitation link generation

The system SHALL generate invitation links in format "https://app.crm.com/auth/invite/{token}" and return them in the invitation creation response.

#### Scenario: Invitation link returned to inviter

- **WHEN** an OWNER creates an invitation
- **THEN** the response includes "inviteLink" field
- **THEN** the invite link is in format "https://app.crm.com/auth/invite/{token}"
- **THEN** the {token} is the generated invitation token
- **THEN** the link can be copied and sent to the invitee

### Requirement: Pending invitation list for organization

The system SHALL allow OWNER and ADMIN users to list all pending invitations for their organization.

#### Scenario: List pending invitations

- **WHEN** an OWNER requests list of pending invitations
- **THEN** the system returns all invitations for the user's organization
- **THEN** only invitations with acceptedAt = null are included
- **THEN** expired invitations (expiresAt < now) are excluded or marked as expired
- **THEN** each invitation includes email, role, createdAt, expiresAt, and invitedBy information
