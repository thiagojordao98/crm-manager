## ADDED Requirements

### Requirement: Role-based permission hierarchy

The system SHALL enforce a hierarchical role structure: OWNER > ADMIN > AGENT > VIEWER, where higher roles inherit all permissions of lower roles.

#### Scenario: Role hierarchy permissions

- **WHEN** an endpoint requires AGENT role
- **THEN** users with OWNER role have access
- **THEN** users with ADMIN role have access
- **THEN** users with AGENT role have access
- **THEN** users with VIEWER role are denied (403 Forbidden)

### Requirement: Four role types with distinct permissions

The system SHALL support four role types: OWNER (full access including billing), ADMIN (all features except billing), AGENT (conversations and contacts), VIEWER (read-only).

#### Scenario: OWNER role permissions

- **WHEN** a user has OWNER role
- **THEN** the user can invite users
- **THEN** the user can manage billing and subscription
- **THEN** the user can delete organization
- **THEN** the user can access all conversations, contacts, and deals
- **THEN** the user can modify organization settings

#### Scenario: ADMIN role permissions

- **WHEN** a user has ADMIN role
- **THEN** the user can invite users (except as OWNER)
- **THEN** the user cannot access billing features
- **THEN** the user can access all conversations, contacts, and deals
- **THEN** the user can modify organization settings (except billing)

#### Scenario: AGENT role permissions

- **WHEN** a user has AGENT role
- **THEN** the user cannot invite other users
- **THEN** the user can access assigned conversations
- **THEN** the user can read/write contacts
- **THEN** the user can manage deals
- **THEN** the user cannot modify organization settings

#### Scenario: VIEWER role permissions

- **WHEN** a user has VIEWER role
- **THEN** the user has read-only access to conversations
- **THEN** the user has read-only access to contacts
- **THEN** the user has read-only access to deals
- **THEN** the user cannot create, update, or delete any resources
- **THEN** the user cannot invite users or modify settings

### Requirement: JWT role claim enforcement

The system SHALL include role claim in JWT access token and validate role against endpoint requirements in guards.

#### Scenario: JWT contains user role

- **WHEN** a user with ADMIN role logs in
- **THEN** the JWT payload includes "role": "admin"
- **THEN** subsequent requests include this role in the token

#### Scenario: Protected endpoint validates role

- **WHEN** a request is made to POST /auth/invite (requires OWNER or ADMIN)
- **THEN** the RolesGuard extracts role from JWT token
- **THEN** the guard checks if role is "owner" or "admin"
- **THEN** if role is "agent" or "viewer", the guard returns 403 Forbidden

### Requirement: Role guard for NestJS endpoints

The system SHALL provide a @Roles() decorator and RolesGuard to protect endpoints with role requirements.

#### Scenario: Roles decorator applied to invite endpoint

- **WHEN** POST /auth/invite endpoint is defined with @Roles('owner', 'admin')
- **THEN** only users with OWNER or ADMIN role can access this endpoint
- **THEN** users with insufficient roles receive 403 Forbidden error

#### Scenario: Multiple roles allowed on single endpoint

- **WHEN** an endpoint is decorated with @Roles('admin', 'agent')
- **THEN** users with OWNER role have access (hierarchy)
- **THEN** users with ADMIN role have access
- **THEN** users with AGENT role have access
- **THEN** users with VIEWER role are denied

### Requirement: Organization ownership validation

The system SHALL validate that users can only access resources belonging to their organization via organizationId claim in JWT.

#### Scenario: User accesses own organization resources

- **WHEN** a user with organizationId "org-abc-123" requests contacts
- **THEN** the system extracts organizationId from JWT
- **THEN** the query filters by organizationId = "org-abc-123"
- **THEN** only contacts from "org-abc-123" are returned

#### Scenario: Cross-organization access blocked

- **WHEN** a user with organizationId "org-abc-123" attempts to access contact from organizationId "org-xyz-789"
- **THEN** the query includes WHERE organizationId = "org-abc-123"
- **THEN** the contact is not found (404 Not Found)
- **THEN** no data from other organization is exposed

### Requirement: Authorization failure audit logging

The system SHALL log all authorization failures (insufficient permissions, cross-tenant access attempts) for security auditing.

#### Scenario: Insufficient permission logged

- **WHEN** a user with AGENT role attempts to access POST /auth/invite
- **THEN** the system logs an audit event with type "AUTHORIZATION_FAILED"
- **THEN** the log includes userId, role, attempted action, endpoint, timestamp, and IP address

#### Scenario: Cross-tenant access attempt logged

- **WHEN** a user attempts to access a resource from another organization
- **THEN** the system logs an audit event with type "CROSS_TENANT_ACCESS_ATTEMPT"
- **THEN** the log includes userId, requestedResourceId, userOrganizationId, resourceOrganizationId, timestamp

### Requirement: Permission check helper functions

The system SHALL provide helper functions to check role permissions programmatically: hasRole(), hasAnyRole(), hasAllRoles().

#### Scenario: hasRole checks single role

- **WHEN** code calls hasRole(userRole, 'admin')
- **WHEN** userRole is "admin"
- **THEN** the function returns true
- **WHEN** userRole is "agent"
- **THEN** the function returns false

#### Scenario: hasAnyRole checks multiple roles

- **WHEN** code calls hasAnyRole(userRole, ['owner', 'admin'])
- **WHEN** userRole is "admin"
- **THEN** the function returns true
- **WHEN** userRole is "agent"
- **THEN** the function returns false

### Requirement: Frontend role-based UI rendering

The system SHALL provide role information in auth context to allow frontend components to conditionally render features based on user permissions.

#### Scenario: Frontend hides invite button for AGENT

- **WHEN** a user with AGENT role views the team page
- **THEN** the frontend auth context includes role = "agent"
- **THEN** the "Invite User" button is hidden or disabled
- **THEN** the user cannot access invite form

#### Scenario: Frontend shows all features for OWNER

- **WHEN** a user with OWNER role views the dashboard
- **THEN** all features are visible (conversations, contacts, deals, billing, settings, team)
- **THEN** no features are hidden or disabled

### Requirement: Role change requires re-authentication

The system SHALL require users to log out and log back in for role changes to take effect (role is stored in JWT).

#### Scenario: Role change does not affect active session

- **WHEN** an OWNER changes a user's role from AGENT to ADMIN in database
- **THEN** the user's active JWT still contains "role": "agent"
- **THEN** the user continues to have AGENT permissions until token expires or they log out
- **WHEN** the user logs out and logs back in
- **THEN** the new JWT contains "role": "admin"
- **THEN** the user now has ADMIN permissions

### Requirement: Role assignment validation

The system SHALL validate that only OWNER and ADMIN roles can assign roles, and roles can only be assigned within valid options (owner, admin, agent, viewer).

#### Scenario: AGENT cannot change roles

- **WHEN** a user with AGENT role attempts to change another user's role
- **THEN** the system returns 403 Forbidden error
- **THEN** no role change occurs

#### Scenario: Invalid role rejected

- **WHEN** an OWNER attempts to assign role "superuser" (invalid)
- **THEN** the system returns 400 Bad Request error
- **THEN** the error message is "Invalid role. Must be one of: owner, admin, agent, viewer"

### Requirement: Organization guard for multi-tenant isolation

The system SHALL provide an OrganizationGuard that automatically injects organizationId filter into all tenant-scoped queries.

#### Scenario: Organization guard filters queries automatically

- **WHEN** a protected endpoint is called with JWT containing organizationId "org-abc-123"
- **THEN** the OrganizationGuard extracts organizationId from token
- **THEN** the guard attaches organizationId to request context
- **THEN** all database queries in this request automatically include WHERE organizationId = "org-abc-123"
