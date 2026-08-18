# AI Provider Package

The AI package owns vendor-neutral contracts only.

## Required adapters

- ClaudeProvider
- OpenAIProvider
- GeminiProvider
- LocalProvider
- CustomProvider

The agent runtime depends on `AIProvider`, never on a vendor SDK. Provider adapters normalize streaming events, structured outputs, tool calls, usage, cost metadata and errors.

Private chain-of-thought must not be represented as a product UI event or persisted as message content.
