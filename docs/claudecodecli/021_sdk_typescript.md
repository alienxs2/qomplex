# Claude Agent SDK - TypeScript Reference

**Keywords:** TypeScript, Node.js, npm, query, ClaudeAgentOptions, streaming, async iterator, JavaScript

**Official Documentation:** https://code.claude.com/docs/en/sdk/sdk-typescript

---

## Installation

```bash
npm install @anthropic-ai/claude-agent-sdk
```

---

## Basic Usage

### Simple Query

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = await query({
  prompt: "Analyze this codebase and suggest improvements",
  options: {
    maxTurns: 10
  }
});

console.log(result.text);
```

### With Options

```typescript
import { query, ClaudeAgentOptions } from '@anthropic-ai/claude-agent-sdk';

const options: ClaudeAgentOptions = {
  maxTurns: 20,
  systemPrompt: "You are a code review assistant",
  allowedTools: ["Read", "Glob", "Grep"],
  workingDirectory: "/path/to/project"
};

const result = await query({
  prompt: "Review the authentication module",
  options
});
```

---

## ClaudeAgentOptions Interface

| Option | Type | Description |
|--------|------|-------------|
| `maxTurns` | `number` | Maximum conversation turns |
| `systemPrompt` | `string` | Custom system prompt |
| `allowedTools` | `string[]` | Tools Claude can use |
| `disallowedTools` | `string[]` | Tools to block |
| `workingDirectory` | `string` | Working directory path |
| `settingSources` | `string[]` | Settings to load (e.g., `['project']`) |
| `permissionMode` | `string` | Permission behavior mode |
| `mcpServers` | `object` | MCP server configuration |

---

## Streaming Mode

Process events as they arrive:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const event of query({
  prompt: "Generate a utility function",
  options: { maxTurns: 5 }
})) {
  switch (event.type) {
    case 'assistant_message':
      console.log('Assistant:', event.content);
      break;
    case 'tool_use':
      console.log('Tool:', event.name, event.input);
      break;
    case 'tool_result':
      console.log('Result:', event.output);
      break;
  }
}
```

---

## Event Types

| Event Type | Description |
|------------|-------------|
| `assistant_message` | Text response from Claude |
| `tool_use` | Claude is calling a tool |
| `tool_result` | Tool execution result |
| `system_message` | System information (includes session ID) |
| `error` | Error occurred |

---

## Loading Project Settings

By default, project settings are NOT loaded. To enable:

```typescript
const result = await query({
  prompt: "Analyze this project",
  options: {
    settingSources: ['project']  // Load .claude/settings.json and CLAUDE.md
  }
});
```

---

## Session Management

### Capture Session ID

```typescript
let sessionId: string;

for await (const event of query({ prompt: "Start task" })) {
  if (event.type === 'system_message' && event.sessionId) {
    sessionId = event.sessionId;
  }
}
```

### Resume Session

```typescript
const result = await query({
  prompt: "Continue the previous task",
  options: {
    resumeSessionId: sessionId
  }
});
```

### Fork Session

```typescript
const result = await query({
  prompt: "Try a different approach",
  options: {
    resumeSessionId: sessionId,
    forkSession: true  // Creates new branch
  }
});
```

---

## HookEvent Types (TypeScript)

The TypeScript SDK supports these hook events:

- `PreToolUse` - Before tool execution
- `PostToolUse` - After tool execution
- `Notification` - Notifications
- `UserPromptSubmit` - User prompt submitted
- `SessionStart` - Session started
- `SessionEnd` - Session ended
- `Stop` - Execution stopped
- `SubagentStop` - Subagent stopped
- `PreCompact` - Before message compaction

---

## Error Handling

```typescript
import { query, ClaudeAgentError } from '@anthropic-ai/claude-agent-sdk';

try {
  const result = await query({
    prompt: "Perform task",
    options: { maxTurns: 10 }
  });
} catch (error) {
  if (error instanceof ClaudeAgentError) {
    console.error('Agent error:', error.message);
    console.error('Code:', error.code);
  }
}
```

---

## Related Files

- [020_sdk_overview.md](./020_sdk_overview.md) - SDK overview
- [022_sdk_python.md](./022_sdk_python.md) - Python SDK
- [025_sdk_sessions.md](./025_sdk_sessions.md) - Session management
- [027_sdk_streaming.md](./027_sdk_streaming.md) - Streaming details

---

*Last updated: December 2025*
