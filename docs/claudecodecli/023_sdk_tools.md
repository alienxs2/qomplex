# Claude Agent SDK - Tools Configuration

**Keywords:** tools, MCP, custom tools, allowedTools, built-in tools, createSdkMcpServer, tool decorator, file operations

**Official Documentation:** https://docs.claude.com/en/api/agent-sdk/custom-tools

---

## Built-in Tools

The SDK includes these built-in tools:

| Tool | Description |
|------|-------------|
| `Read` | Read file contents |
| `Write` | Create/overwrite files |
| `Edit` | Edit existing files |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `Bash` | Execute shell commands |
| `WebSearch` | Search the web |
| `WebFetch` | Fetch URL content |

---

## Controlling Tool Access

### Allow Specific Tools

```typescript
// TypeScript
const result = await query({
  prompt: "Analyze code",
  options: {
    allowedTools: ["Read", "Glob", "Grep"]  // Read-only access
  }
});
```

```python
# Python
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep"]
)
```

### Add Tools to Defaults

```typescript
// TypeScript
options: {
  appendAllowedTools: ["mcp__my-server__my_tool"]
}
```

```python
# Python
options = ClaudeAgentOptions(
    append_allowed_tools=["mcp__my-server__my_tool"]
)
```

### Block Specific Tools

```typescript
options: {
  disallowedTools: ["Bash", "Write"]
}
```

### Allow All Tools

```typescript
options: {
  allowAllTools: true
}
```

---

## Tool Naming Pattern

MCP tools follow this naming pattern:

```
mcp__<server-name>__<tool-name>
```

Example: A tool named `get_weather` in server `weather-service` becomes:
```
mcp__weather-service__get_weather
```

---

## Creating Custom Tools (TypeScript)

### Using createSdkMcpServer

```typescript
import { query, createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

// Define custom tool
const weatherTool = tool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: z.object({
    city: z.string().describe('City name'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius')
  }),
  execute: async ({ city, units }) => {
    // Your implementation
    return { temperature: 22, condition: 'sunny' };
  }
});

// Create SDK MCP server
const server = createSdkMcpServer({
  name: 'my-tools',
  tools: [weatherTool]
});

// Use in query
const result = await query({
  prompt: "What's the weather in Paris?",
  options: {
    mcpServers: { 'my-tools': server },
    allowedTools: ['mcp__my-tools__get_weather']
  }
});
```

---

## Creating Custom Tools (Python)

### Using @tool Decorator

```python
from claude_agent_sdk import (
    query,
    create_sdk_mcp_server,
    tool,
    ClaudeAgentOptions
)

@tool(
    name="get_weather",
    description="Get current weather for a location"
)
async def get_weather(city: str, units: str = "celsius") -> dict:
    """
    Args:
        city: City name
        units: Temperature units (celsius or fahrenheit)
    """
    # Your implementation
    return {"temperature": 22, "condition": "sunny"}

# Create SDK MCP server
server = create_sdk_mcp_server(
    name="my-tools",
    tools=[get_weather]
)

# Use in query
options = ClaudeAgentOptions(
    mcp_servers={"my-tools": server},
    allowed_tools=["mcp__my-tools__get_weather"]
)

result = await query(
    prompt="What's the weather in Paris?",
    options=options
)
```

---

## SDK vs External MCP Servers

### In-Process SDK Servers

**Benefits:**
- No subprocess management
- Better performance (no IPC overhead)
- Simpler deployment (single process)

```typescript
// Runs in same process
const server = createSdkMcpServer({ name: 'my-tools', tools: [...] });
```

### External Process Servers

```typescript
// Runs as subprocess
options: {
  mcpServers: {
    'external-server': {
      command: 'npx',
      args: ['-y', '@example/mcp-server'],
      env: { API_KEY: 'xxx' }
    }
  }
}
```

### Hybrid Configuration

Use both together:

```typescript
const result = await query({
  prompt: "Do something",
  options: {
    mcpServers: {
      // In-process
      'sdk-tools': createSdkMcpServer({ tools: [myTool] }),
      // External
      'puppeteer': {
        command: 'npx',
        args: ['@anthropic/mcp-puppeteer']
      }
    }
  }
});
```

---

## Tool Configuration Options

| Option | Description |
|--------|-------------|
| `allowedTools` | Replace default tools entirely |
| `appendAllowedTools` | Add tools to defaults |
| `disallowedTools` | Block specific tools |
| `allowAllTools` | Allow all available tools |

---

## Related Files

- [020_sdk_overview.md](./020_sdk_overview.md) - SDK overview
- [024_sdk_permissions.md](./024_sdk_permissions.md) - Permissions
- [026_sdk_mcp.md](./026_sdk_mcp.md) - MCP in SDK
- [007_mcp_servers.md](./007_mcp_servers.md) - CLI MCP servers

---

*Last updated: December 2025*
