# Security Package

Centralize reusable security policies:

- tenant context
- RBAC/permission evaluation
- tool risk policies
- input/output validation helpers
- SSRF protections
- upload constraints
- webhook verification
- rate-limit policies
- secret redaction
- audit event contracts

Security checks must be defense in depth. A model-generated tool call is untrusted input and must pass the same authorization and validation path as a human/API request.
