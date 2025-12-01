# Claude Agent SDK - MCP Integration

**Keywords:** MCP, Model Context Protocol, mcp_servers, external servers, in-process, subprocess, custom tools, SDK MCP

**Official Documentation:** https://platform.claude.com/docs/en/agent-sdk/mcp

---

## Overview

Model Context Protocol (MCP) servers extend Claude's capabilities with custom tools. The SDK supports three types of MCP servers:

| Type | Description | Performance |
|------|-------------|-------------|
| In-process SDK | Runs within your application | Fastest |
| External subprocess | Runs as separate process | Standard |
| HTTP/SSE | Connects via network | Remote capable |

---

## In-Process SDK MCP Servers

Run MCP tools directly in your application without subprocess overhead.

### TypeScript

```typescript
import { query, createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const myTool = tool({
  name: 'get_data',
  description: 'Fetch data from database',
  parameters: z.object({
    id: z.string()
  }),
  execute: async ({ id }) => {
    return await database.find(id);
  }
});

const server = createSdkMcpServer({
  name: 'my-server',
  tools: [myTool]
});

const result = await query({
  prompt: "Get data for user 123",
  options: {
    mcpServers: { 'my-server': server },
    allowedTools: ['mcp__my-server__get_data']
  }
});
```

### Python

```python
from claude_agent_sdk import (
    query,
    create_sdk_mcp_server,
    tool,
    ClaudeAgentOptions
)

@tool(name="get_data", description="Fetch data from database")
async def get_data(id: str) -> dict:
    return await database.find(id)

server = create_sdk_mcp_server(
    name="my-server",
    tools=[get_data]
)

options = ClaudeAgentOptions(
    mcp_servers={"my-server": server},
    allowed_tools=["mcp__my-server__get_data"]
)

result = await query(prompt="Get data for user 123", options=options)
```

---

## External Subprocess Servers

Run MCP servers as external processes.

### TypeScript

```typescript
const result = await query({
  prompt: "Take a screenshot",
  options: {
    mcpServers: {
      'puppeteer': {
        command: 'npx',
        args: ['-y', '@anthropic/mcp-puppeteer'],
        env: {
          PUPPETEER_HEADLESS: 'true'
        }
      }
    }
  }
});
```

### Python

```python
options = ClaudeAgentOptions(
    mcp_servers={
        "puppeteer": {
            "command": "npx",
            "args": ["-y", "@anthropic/mcp-puppeteer"],
            "env": {"PUPPETEER_HEADLESS": "true"}
        }
    }
)
```

---

## Hybrid Configuration

Combine SDK and external MCP servers:

```typescript
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';

// In-process custom tool
const customTool = tool({
  name: 'custom_action',
  description: 'Custom business logic',
  parameters: z.object({ input: z.string() }),
  execute: async ({ input }) => processInput(input)
});

const result = await query({
  prompt: "Use both tools",
  options: {
    mcpServers: {
      // In-process
      'custom': createSdkMcpServer({
        name: 'custom',
        tools: [customTool]
      }),
      // External
      'github': {
        command: 'npx',
        args: ['@anthropic/mcp-github']
      },
      // HTTP server
      'remote-api': {
        url: 'http://localhost:3000/mcp'
      }
    }
  }
});
```

---

## MCP Server Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `command` | `string` | Executable command |
| `args` | `string[]` | Command arguments |
| `env` | `object` | Environment variables |
| `cwd` | `string` | Working directory |
| `url` | `string` | HTTP endpoint (for remote) |

---

## Benefits of SDK MCP Servers

| Feature | SDK Server | External Server |
|---------|------------|-----------------|
| Startup time | Instant | Process spawn overhead |
| Memory | Shared with app | Separate process |
| IPC overhead | None | JSON serialization |
| Debugging | Direct access | Requires logging |
| Deployment | Single process | Multiple processes |

---

## Tool Naming Convention

All MCP tools follow this pattern:

```
mcp__<server-name>__<tool-name>
```

Examples:
- `mcp__puppeteer__screenshot`
- `mcp__github__create_issue`
- `mcp__custom__get_data`

---

## Discovering Available Tools

List tools from an MCP server:

```typescript
const result = await query({
  prompt: "What tools are available?",
  options: {
    mcpServers: { 'my-server': myServer },
    systemPrompt: "List all available MCP tools"
  }
});
```

---

## Error Handling

```typescript
try {
  const result = await query({
    prompt: "Use MCP tool",
    options: {
      mcpServers: {
        'my-server': {
          command: 'npx',
          args: ['my-mcp-server']
        }
      }
    }
  });
} catch (error) {
  if (error.message.includes('MCP')) {
    console.error('MCP server error:', error);
    // Handle server not found, connection failed, etc.
  }
}
```

---

## Related Files

- [020_sdk_overview.md](./020_sdk_overview.md) - SDK overview
- [023_sdk_tools.md](./023_sdk_tools.md) - Tools configuration
- [007_mcp_servers.md](./007_mcp_servers.md) - CLI MCP setup
- [008_mcp_configuration.md](./008_mcp_configuration.md) - .mcp.json

---

*Last updated: December 2025*
