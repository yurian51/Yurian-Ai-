# YURIAN AI OS Architecture

## Product Principle

YURIAN AI OS is an AI-native operating system, not a chatbot. The execution lifecycle is:

**Understand → Plan → Reason → Use Tools → Ask Approval When Needed → Execute → Verify → Learn → Remember**

Private chain-of-thought is never exposed. The product surfaces safe execution states such as planning, retrieval, tool execution, approval, verification, and completion.

## Repository Direction

The existing repository is a Vite + React prototype with a Gemini client in the browser. It is not suitable as the production architecture because provider credentials and AI orchestration must live behind a secure backend.

Target monorepo:

```text
apps/
  web/                 # Next.js application
  api/                 # NestJS API

packages/
  ui/                  # shared shadcn/ui primitives
  ai/                  # provider abstraction and AI contracts
  agents/              # agent runtime and orchestration
  memory/              # persistent memory engine
  knowledge/           # ingestion, embeddings, retrieval, citations
  workflows/           # workflow graph and execution contracts
  mcp/                 # MCP gateway, registry and permissions
  integrations/        # external provider adapters
  database/            # Prisma schema and database client
  auth/                # authentication and authorization contracts
  security/            # tenant guards, validation and security policies
  config/              # typed environment configuration
  types/               # shared domain contracts
  sdk/                 # TypeScript SDK; Python SDK generated/maintained separately

infrastructure/
  docker/
  deployment/
  monitoring/

docs/
  architecture/
  api/
  security/
  agents/
```

## Runtime Boundaries

### Web

Next.js owns presentation, routing, server-side rendering where useful, browser state, optimistic UX, streaming UI, command palette and accessibility. It never receives provider secrets, OAuth client secrets, database credentials or integration access tokens.

### API

NestJS is the authoritative application boundary. All requests resolve the authenticated principal and tenant context before accessing domain services.

### AI Core

The AI core depends on an `AIProvider` interface. Claude is the first implementation. Additional providers must be replaceable without changing agent business logic.

```text
AIProvider
├── ClaudeProvider
├── OpenAIProvider
├── GeminiProvider
├── LocalProvider
└── CustomProvider
```

Provider adapters normalize streaming, structured output, tool calls, token usage and provider errors into internal contracts.

### Agent Runtime

Agents are policy-constrained runtimes. The model proposes plans and tool calls; the application validates permissions, schemas, tenant boundaries, risk policies, budgets and approval requirements before execution.

```text
User Request
  ↓
Intent / Context
  ↓
Planner
  ↓
Agent Selector
  ↓
Tool Policy Gate
  ↓
Approval Gate (when required)
  ↓
Tool Executor
  ↓
Verifier
  ↓
Response Synthesizer
  ↓
Memory / Audit / Usage
```

## Multi-Tenancy

The mandatory hierarchy is:

`Organization → Workspace → Project → Resource`

Every tenant-owned table carries an organization/workspace scope as appropriate. Repository/service methods must require a tenant context. Authorization is enforced at the API guard, service/domain policy, persistence query and AI tool boundary.

Search indexes and vector retrieval must apply the same tenant filters before ranking or generation. Tool handlers receive an immutable execution context containing principal, organization, workspace and authorization claims.

## Security Model

- Passwords use a modern adaptive password hash.
- Access tokens are short-lived; refresh tokens rotate and are revocable.
- OAuth uses state/PKCE where applicable and encrypted server-side token storage.
- API keys are hashed or encrypted according to their use case and are never returned after creation.
- Input is validated with Zod at external boundaries and DTO validation in NestJS.
- Tool arguments are validated against server-owned schemas, never trusted merely because a model generated them.
- SSRF protections apply to URL ingestion and generic HTTP tools.
- Uploaded files are type/size checked and scanned before parsing.
- Webhooks require signature verification and replay protection.
- Rate limits and AI budgets are enforced per principal and tenant.
- Audit events are append-only from the application perspective.
- High-risk and critical actions require explicit approval unless a tenant policy explicitly permits an equivalent controlled automation.

## AI Safety

Treat retrieved documents, webpages, repository files, emails and tool results as untrusted content. Delimit untrusted content and prevent it from modifying system policy or tool permissions.

Agent execution has explicit limits for depth, tool calls, tokens, cost, time and retries. Context assembly only includes resources authorized for the active tenant and workspace.

## First Production Vertical Slice

Build and test this slice before expanding breadth:

1. Authentication and session management
2. Organization and workspace creation
3. Tenant-aware dashboard
4. Persistent AI conversations
5. Claude provider abstraction
6. Streaming AI responses
7. Safe tool calling
8. Persistent memory with user controls
9. Document upload and ingestion
10. Vector retrieval with citations
11. Agent creation and execution
12. Approval workflow for risky actions
13. Audit events and execution history

The first slice must be real functionality. No fake AI responses, fake tool executions or placeholder security controls.

## Domain Modules

NestJS modules should mirror bounded contexts: Auth, Users, Organizations, Memberships, Workspaces, Projects, Tasks, Goals, Conversations, Messages, Memory, Knowledge, Documents, Search, Agents, AgentRuns, Tools, MCP, Integrations, Automations, Workflows, Approvals, Actions, Notifications, Analytics, Billing, Subscriptions, AuditLogs, Usage and Admin.

Cross-domain orchestration belongs in application services, not UI components or Prisma models.

## Data Principles

PostgreSQL is the system of record. Prisma migrations are required. Foreign keys, unique constraints and indexes must reflect tenant boundaries and common query patterns. Soft deletion is used only where recovery/audit semantics require it.

Vector storage should remain behind the Knowledge/Search abstraction so the retrieval implementation can evolve without changing agent contracts.

## Observability

Every agent run and tool execution receives a trace/correlation identifier. Capture structured logs, latency, token counts, estimated cost, tool outcomes, retries, approval state and failure reason. Sensitive payloads must be redacted from logs.

## API

Public API version: `/api/v1`.

Use OpenAPI/Swagger for the HTTP contract. API keys and OAuth are separate authentication mechanisms from browser sessions. Rate limits and tenant authorization apply equally to public API requests.

## Definition of Done for New Capabilities

A feature is not complete until it has:

- domain/service implementation
- authorization and tenant checks
- validation
- audit behavior where applicable
- failure handling
- observability
- unit/integration tests
- API documentation where exposed
- no browser-held provider secrets
- no hard-coded user or AI output
