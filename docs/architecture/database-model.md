# YURIAN AI OS Database Model

PostgreSQL is the system of record. Prisma owns migrations and generated types.

## Identity and Tenancy

### User
- id
- email
- passwordHash (nullable for OAuth-only accounts)
- displayName
- locale
- timezone
- createdAt
- updatedAt
- deletedAt

### Organization
- id
- name
- slug
- createdAt
- updatedAt
- deletedAt

### Membership
- id
- organizationId
- userId
- role
- status
- createdAt
- updatedAt

Unique: `(organizationId, userId)`.

### Workspace
- id
- organizationId
- name
- slug
- createdAt
- updatedAt
- deletedAt

Unique: `(organizationId, slug)`.

### WorkspaceMembership
- id
- workspaceId
- userId
- role
- createdAt
- updatedAt

Unique: `(workspaceId, userId)`.

## Work Management

Project belongs to workspace. Task belongs to project and workspace. Goal belongs to workspace. Use explicit workspace IDs on child records when query performance and authorization clarity benefit from denormalized scope. Database constraints and service validation must keep those scopes consistent.

## Conversations

Conversation belongs to workspace and creator. Message belongs to conversation and records role/content plus safe metadata. Tool calls and execution events should be stored separately from message text so execution history remains queryable and auditable.

## Memory

Memory fields:

- id
- organizationId
- workspaceId nullable
- userId nullable
- type
- content
- source
- confidence
- importance
- metadata JSON
- createdAt
- updatedAt
- expiresAt nullable
- deletedAt nullable

Memory scope determines visibility. Retrieval must never expand scope beyond the requesting principal's authorization.

## Knowledge

KnowledgeSource belongs to workspace. Document belongs to a source. DocumentChunk belongs to a document. Embeddings remain behind the search abstraction and can be stored using PostgreSQL vector support or another implementation later.

Recommended indexes:

- workspaceId + createdAt
- workspaceId + updatedAt
- documentId + chunk index
- sourceId + createdAt

## Agents and Execution

Agent belongs to workspace and has versioned configuration. AgentRun belongs to an agent, conversation/workspace and initiating user. ToolExecution belongs to an agent run. Store status, timestamps, usage, error category and safe metadata. Do not persist private chain-of-thought.

## Tools and Permissions

Tool definitions may be global or workspace-scoped. ToolPermission binds a tool to an agent/workspace/role/policy as appropriate. Risk level is stored with the executable definition and evaluated again at runtime.

## Approvals and Actions

Approval belongs to workspace and references the proposed action/run. Action records the execution attempt and result metadata. Approval is not a substitute for authorization. At execution time, the current tenant and permission checks run again.

## Integrations

Integration is a provider definition. OAuthConnection belongs to a user/workspace and stores encrypted credential material or a reference to a secrets manager. Never expose refresh tokens to the browser.

## Audit and Usage

AuditLog is append-oriented and includes:

- id
- organizationId
- workspaceId nullable
- userId nullable
- actorType
- action
- resourceType
- resourceId
- outcome
- requestId
- metadata redacted JSON
- createdAt

Usage records provider, model, input/output tokens, estimated cost, duration and tenant scope. Billing aggregates usage without making pricing constants part of business logic.

## Critical Indexing Rule

Every tenant-scoped query must be indexable through its organization/workspace scope. Never implement a service method that accepts only a resource ID when that resource can be resolved across tenants. Prefer `(workspaceId, resourceId)` or an equivalent scoped lookup.
