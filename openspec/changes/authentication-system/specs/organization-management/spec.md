## ADDED Requirements

### Requirement: Organization creation during user registration

The system SHALL automatically create an organization when a new user registers. The organization MUST be created in the same database transaction as the user to ensure data consistency.

#### Scenario: Organization created with user registration

- **WHEN** a user registers with organizationName "ACME Corp"
- **THEN** the system creates a new organization record with name "ACME Corp"
- **THEN** the organization has a generated slug "acme-corp"
- **THEN** the organization has default settings (dataRetentionDays: 730, retentionEnabled: true)
- **THEN** the user's organizationId references this new organization

#### Scenario: Organization not created if user creation fails

- **WHEN** user creation fails during registration (e.g., validation error)
- **THEN** the organization creation is rolled back
- **THEN** no organization record exists in the database

### Requirement: Organization context in JWT token

The system SHALL include organizationId claim in every JWT access token to establish tenant context for all requests.

#### Scenario: Access token includes organizationId

- **WHEN** a user logs in
- **THEN** the generated JWT access token includes "organizationId" claim
- **THEN** the organizationId is the UUID of the user's organization
- **THEN** subsequent API requests use this claim to filter data by tenant

### Requirement: Organization slug uniqueness enforcement

The system SHALL enforce unique slugs across all organizations. If a collision occurs, the system MUST automatically append a numeric suffix.

#### Scenario: Unique slug validation

- **WHEN** a new organization is created with slug "acme-corp"
- **THEN** the system checks if slug "acme-corp" already exists
- **THEN** if unique, the slug is assigned to the organization
- **THEN** if collision detected, the system tries "acme-corp-2", "acme-corp-3", etc. until a unique slug is found

#### Scenario: Multiple organizations can have similar names with different slugs

- **WHEN** organization "ACME Corp" exists with slug "acme-corp"
- **WHEN** another user registers with organization name "ACME Corp"
- **THEN** the new organization gets slug "acme-corp-2"
- **THEN** both organizations coexist without conflict

### Requirement: Organization ID in all tenant-scoped queries

The system SHALL automatically filter all database queries by organizationId based on the JWT token claim to enforce multi-tenant data isolation.

#### Scenario: Data queries filtered by organization

- **WHEN** a user with organizationId "org-abc-123" requests contacts list
- **THEN** the system extracts organizationId from JWT token
- **THEN** the database query includes WHERE organizationId = 'org-abc-123'
- **THEN** only contacts belonging to "org-abc-123" are returned

#### Scenario: Cross-tenant access is prevented

- **WHEN** a user with organizationId "org-abc-123" attempts to access a contact with organizationId "org-xyz-789"
- **THEN** the system filters by the user's organizationId from JWT
- **THEN** the contact is not found (404 Not Found)
- **THEN** no data from "org-xyz-789" is exposed

### Requirement: Organization settings with defaults

The system SHALL create organizations with default settings: dataRetentionDays (730), retentionEnabled (true), and empty settings JSONB object.

#### Scenario: Organization created with default settings

- **WHEN** an organization is created during registration
- **THEN** the dataRetentionDays is set to 730 (2 years)
- **THEN** the retentionEnabled is set to true
- **THEN** the settings JSONB field is initialized to empty object {}
- **THEN** timestamps createdAt and updatedAt are set to current time

### Requirement: Organization slug format validation

The system SHALL generate slugs in kebab-case format: lowercase letters, numbers, and hyphens only. Leading/trailing hyphens MUST be removed.

#### Scenario: Slug formatting rules applied

- **WHEN** organization name is "ACME Corp & Co.!"
- **THEN** the system converts to lowercase: "acme corp & co.!"
- **THEN** special characters are removed: "acme corp  co"
- **THEN** spaces are replaced with hyphens: "acme-corp-co"
- **THEN** multiple consecutive hyphens are collapsed: "acme-corp-co"
- **THEN** leading/trailing hyphens are trimmed
- **THEN** final slug is "acme-corp-co"

### Requirement: Organization name length constraints

The system SHALL enforce organization name between 1 and 100 characters. Empty names or names exceeding 100 characters MUST be rejected.

#### Scenario: Organization name within valid length

- **WHEN** a user registers with organization name of 50 characters
- **THEN** the organization is created successfully
- **THEN** no validation error is returned

#### Scenario: Organization name too long rejected

- **WHEN** a user registers with organization name of 150 characters
- **THEN** the system returns 400 Bad Request error
- **THEN** the error message is "Organization name must not exceed 100 characters"
- **THEN** no organization is created

### Requirement: Organization context extraction from JWT

The system SHALL provide middleware/guard that extracts organizationId from JWT token and makes it available to all downstream handlers.

#### Scenario: Organization ID available in request context

- **WHEN** an authenticated request is made with valid JWT token
- **THEN** the authentication middleware extracts the organizationId claim from token
- **THEN** the organizationId is attached to the request object (e.g., req.organizationId)
- **THEN** all subsequent handlers can access req.organizationId without re-parsing JWT

### Requirement: Organization metadata in authentication response

The system SHALL return organization details (id, name, slug) in the response to registration and login requests.

#### Scenario: Registration response includes organization

- **WHEN** a user successfully registers
- **THEN** the response includes an "organization" object
- **THEN** the organization object contains "id", "name", and "slug" fields
- **THEN** frontend can immediately display organization context

#### Scenario: Login response includes organization

- **WHEN** a user successfully logs in
- **THEN** the response includes the user's organization details
- **THEN** the organization details match the user's organizationId from database
