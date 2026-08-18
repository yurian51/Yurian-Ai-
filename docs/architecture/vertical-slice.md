# First Vertical Slice

## Scope

The first release proves the core operating-system loop rather than attempting every feature at once:

`Auth → Organization → Workspace → Conversation → Claude → Tool → Memory → Document → RAG → Agent → Approval → Audit`

## Core Contracts

### AIProvider

```ts
interface AIProvider {
  readonly id: string;
  stream(request: AIRequest): AsyncIterable<AIEvent>;
  complete(request: AIRequest): Promise<AIResponse>;
}
```

The normalized request includes system instructions, messages, tool definitions, structured-output schema, model settings and execution context. The normalized response includes content, tool calls, usage and provider metadata.

### Tool

```ts
interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: unknown;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredPermissions: string[];
  execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;
}
```

The executor validates the schema, tenant context, permissions, risk policy, limits and approval state before invoking `execute`.

### Agent

An agent references a provider model, instructions, allowed tools, knowledge sources, memory policy, approval policy and execution limits. Agent definitions are data, not hard-coded classes for every built-in agent.

### Approval

Approval is a first-class resource with a deterministic state transition:

`PENDING → APPROVED | REJECTED | EXPIRED | CANCELLED`

Approval payloads are immutable snapshots of the proposed action. Revalidation occurs at execution time so an approval cannot become a permanent bypass around authorization.

## Request Flow

1. Authenticate request.
2. Resolve organization and workspace membership.
3. Create or resume conversation.
4. Persist user message.
5. Build authorized context and memory.
6. Classify intent and decide whether an agent/tool is needed.
7. Invoke the provider through `AIProvider`.
8. Stream safe UI events to the client.
9. If a tool call is proposed, validate it server-side.
10. If risk policy requires approval, persist approval and pause execution.
11. Otherwise execute through the tool registry.
12. Persist tool result and audit event.
13. Verify the result where the operation requires verification.
14. Continue or synthesize the final answer.
15. Persist assistant message, usage and eligible memory updates.

## Safe Streaming Events

The UI may receive events such as:

- `run.started`
- `run.status`
- `message.delta`
- `retrieval.started`
- `retrieval.completed`
- `tool.requested`
- `approval.required`
- `tool.started`
- `tool.completed`
- `verification.started`
- `verification.completed`
- `run.completed`
- `run.failed`

These events describe execution state. Never stream hidden chain-of-thought or private reasoning traces.

## Tenant Rules

Every repository method accepts a tenant-scoped context. For example:

```ts
interface TenantContext {
  userId: string;
  organizationId: string;
  workspaceId: string;
  roles: string[];
}
```

A missing tenant context is a hard failure, not an invitation to query broadly.

## Document/RAG Flow

`Upload → Validate → Malware/File Scan → Parse → Chunk → Embed → Index → Retrieve → Rerank → Cite`

Retrieval is filtered by organization/workspace authorization before similarity ranking. Citations reference stable document/chunk identifiers and page/section metadata where available.

## Testing Gates

Before merging the vertical slice:

- Authentication tests cover invalid credentials, session rotation and revoked refresh tokens.
- Authorization tests prove a member cannot read another workspace.
- Tool tests prove invalid arguments and missing permissions are rejected.
- Approval tests prove high-risk actions pause and cannot execute before approval.
- RAG tests prove tenant filtering and citation metadata.
- Agent tests prove provider substitution does not change orchestration behavior.
- Audit tests prove important actions produce immutable audit events.
- API tests cover the critical `/api/v1` endpoints.
- End-to-end tests exercise account creation through a complete document question and approved tool execution.
