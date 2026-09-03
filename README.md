# YURIAN AI OS

**AI-native operating system for personal, professional and business work.**

YURIAN AI OS combines an executive assistant, knowledge engine, agent platform, automation system, business intelligence layer and developer platform into one secure multi-tenant workspace.

It is intentionally not a generic chatbot.

## Core Loop

**Understand → Plan → Reason → Use Tools → Ask Approval When Needed → Execute → Verify → Learn → Remember**

Private chain-of-thought is never exposed. Users see useful execution state such as planning, retrieval, tool activity, approvals and verification.

## Production Architecture

- Next.js + TypeScript + React
- Tailwind CSS + shadcn/ui + Framer Motion
- React Query + Zustand + Zod
- NestJS + TypeScript
- PostgreSQL + Prisma
- Redis + BullMQ
- REST + WebSockets + Webhooks
- Claude-first provider abstraction
- RAG, embeddings and persistent memory
- MCP-compatible tool architecture
- Docker and GitHub Actions

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`docs/architecture/vertical-slice.md`](./docs/architecture/vertical-slice.md).

## Provider Agnostic

AI business logic depends on an internal `AIProvider` contract rather than a vendor SDK. Claude is the initial production provider; OpenAI, Gemini, local and custom providers can be added without rewriting the agent runtime.

## Security First

The platform is multi-tenant from day one. Authorization and tenant scope are enforced across API, service, persistence, retrieval and tool execution. High-risk actions require approval, and important actions produce audit events.

Provider credentials and integration secrets are server-side only.

## First Vertical Slice

The initial production slice is deliberately narrow:

1. Authentication and sessions
2. Organization and workspace
3. Persistent AI chat
4. Claude provider abstraction
5. Safe tool calling
6. Persistent memory
7. Document upload
8. RAG with citations
9. Agent execution
10. Approval gates
11. Audit history

Only after this slice is production-quality should the broader agent, workflow, integration, research, business and enterprise modules expand.

## Development

The current `main` branch contains the original browser-based prototype. Production work is being migrated into the target monorepo architecture on the feature branch before merging.

Environment configuration is documented in [`.env.example`](./.env.example). Never commit real API keys, OAuth secrets, database passwords or access tokens.
