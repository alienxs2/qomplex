# Claude Agent SDK Overview

**Keywords:** SDK, Agent SDK, Claude Code SDK, installation, npm, pip, features, authentication, API key, Bedrock, Vertex

**Official Documentation:** https://docs.claude.com/en/api/agent-sdk/overview

---

## What is Claude Agent SDK

The Claude Agent SDK (formerly Claude Code SDK) enables you to programmatically build AI agents with Claude Code's capabilities. It provides all the building blocks needed to build production-ready agents that can:

- Understand codebases
- Edit files
- Run commands
- Execute complex workflows autonomously

Built on top of the agent harness that powers Claude Code, it exposes all of Claude Code's functionality through a programmatic interface.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Context Management** | Automatic compaction and context management |
| **Rich Tool Ecosystem** | File operations, code execution, web search, MCP extensibility |
| **Advanced Permissions** | Fine-grained control over agent capabilities |
| **Production Essentials** | Built-in error handling, session management, monitoring |
| **Optimized Claude Integration** | Automatic prompt caching and performance optimizations |

---

## Available SDKs

| Language | Package | Repository |
|----------|---------|------------|
| TypeScript/Node | `@anthropic-ai/claude-agent-sdk` | [GitHub](https://github.com/anthropics/claude-agent-sdk-typescript) |
| Python | `claude-agent-sdk` | [GitHub](https://github.com/anthropics/claude-agent-sdk-python) |

---

## Installation

### TypeScript/Node.js

```bash
npm install @anthropic-ai/claude-agent-sdk
```

### Python

```bash
pip install claude-agent-sdk
```

**Requirements:**
- Python 3.10+
- Node.js (required for some features)

---

## Authentication

### Option 1: API Key (Recommended)

Set the `ANTHROPIC_API_KEY` environment variable:

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

Get your API key from the [Claude Console](https://console.anthropic.com/).

### Option 2: Amazon Bedrock

```bash
export CLAUDE_CODE_USE_BEDROCK=1
```

### Option 3: Google Vertex AI

```bash
export CLAUDE_CODE_USE_VERTEX=1
```

---

## Quick Start Example

### TypeScript

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = await query({
  prompt: "What files are in this directory?",
  options: {
    maxTurns: 10
  }
});

console.log(result);
```

### Python

```python
from claude_agent_sdk import query

result = await query(
    prompt="What files are in this directory?",
    max_turns=10
)

print(result)
```

---

## Related Files

- [021_sdk_typescript.md](./021_sdk_typescript.md) - TypeScript SDK reference
- [022_sdk_python.md](./022_sdk_python.md) - Python SDK reference
- [023_sdk_tools.md](./023_sdk_tools.md) - Tools configuration
- [024_sdk_permissions.md](./024_sdk_permissions.md) - Permissions system

---

*Last updated: December 2025*
