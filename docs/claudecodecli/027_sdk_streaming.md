# Claude Agent SDK - Streaming & Events

**Keywords:** streaming, events, async iterator, HookEvent, real-time, messages, tool_use, single-shot, batch

**Official Documentation:** https://docs.claude.com/en/docs/agent-sdk/python

---

## Overview

The SDK offers two execution modes:

| Mode | Use Case | Latency |
|------|----------|---------|
| **Streaming** | Interactive UX, real-time feedback | Low |
| **Single-shot** | Batch processing, deterministic runs | Higher |

---

## Streaming Mode

Process events as they arrive:

### TypeScript

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const event of query({
  prompt: "Analyze this codebase",
  options: { maxTurns: 10 }
})) {
  switch (event.type) {
    case 'system_message':
      console.log('Session:', event.sessionId);
      break;

    case 'assistant_message':
      process.stdout.write(event.content);
      break;

    case 'tool_use':
      console.log(`\nUsing tool: ${event.name}`);
      console.log('Input:', JSON.stringify(event.input, null, 2));
      break;

    case 'tool_result':
      console.log('Result:', event.output.substring(0, 100) + '...');
      break;

    case 'error':
      console.error('Error:', event.message);
      break;
  }
}
```

### Python

```python
from claude_agent_sdk import ClaudeSDKClient

async def main():
    client = ClaudeSDKClient()

    async for event in client.query("Analyze this codebase"):
        match event.type:
            case "system_message":
                print(f"Session: {event.session_id}")

            case "assistant_message":
                print(event.content, end="", flush=True)

            case "tool_use":
                print(f"\nUsing tool: {event.name}")
                print(f"Input: {event.input}")

            case "tool_result":
                print(f"Result: {event.output[:100]}...")

            case "error":
                print(f"Error: {event.message}")
```

---

## Event Types

| Event Type | Description | Key Fields |
|------------|-------------|------------|
| `system_message` | Session info | `sessionId` |
| `assistant_message` | Claude's response | `content` |
| `tool_use` | Tool being called | `name`, `input`, `id` |
| `tool_result` | Tool output | `output`, `toolUseId` |
| `error` | Error occurred | `message`, `code` |
| `done` | Execution complete | `result` |

---

## Single-Shot Mode

Wait for complete result:

### TypeScript

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

// Collect all events into final result
async function singleShot(prompt: string) {
  let result = '';

  for await (const event of query({ prompt })) {
    if (event.type === 'assistant_message') {
      result += event.content;
    }
  }

  return result;
}

const analysis = await singleShot("Analyze the auth module");
console.log(analysis);
```

### Python

```python
async def single_shot(prompt: str) -> str:
    client = ClaudeSDKClient()
    result = ""

    async for event in client.query(prompt):
        if event.type == "assistant_message":
            result += event.content

    return result
```

---

## Hook Events

### TypeScript Hook Events

| Event | Description |
|-------|-------------|
| `PreToolUse` | Before tool execution |
| `PostToolUse` | After tool execution |
| `Notification` | System notifications |
| `UserPromptSubmit` | User submits prompt |
| `SessionStart` | Session begins |
| `SessionEnd` | Session ends |
| `Stop` | Execution stops |
| `SubagentStop` | Subagent stops |
| `PreCompact` | Before context compaction |

### Python Hook Events

**Note:** Python has limited hook support.

| Event | Supported |
|-------|-----------|
| `PreToolUse` | Yes |
| `PostToolUse` | Yes |
| `UserPromptSubmit` | Yes |
| `Stop` | Yes |
| `SubagentStop` | Yes |
| `PreCompact` | Yes |
| `SessionStart` | No |
| `SessionEnd` | No |
| `Notification` | No |

---

## Progress Indicators

Build progress UI from events:

```typescript
let currentTool: string | null = null;
let toolCount = 0;

for await (const event of query({ prompt: "Complex task" })) {
  switch (event.type) {
    case 'tool_use':
      currentTool = event.name;
      toolCount++;
      updateProgressUI({
        status: `Running ${event.name}...`,
        step: toolCount
      });
      break;

    case 'tool_result':
      updateProgressUI({
        status: `${currentTool} completed`,
        step: toolCount
      });
      currentTool = null;
      break;

    case 'assistant_message':
      appendOutput(event.content);
      break;
  }
}
```

---

## Cancellation

Cancel streaming execution:

### TypeScript

```typescript
const controller = new AbortController();

// Cancel after 30 seconds
setTimeout(() => controller.abort(), 30000);

try {
  for await (const event of query({
    prompt: "Long task",
    options: { signal: controller.signal }
  })) {
    // Process events
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Execution cancelled');
  }
}
```

---

## Buffering Messages

Collect all messages before processing:

```typescript
interface ConversationTurn {
  role: 'assistant' | 'tool';
  content: string;
}

async function collectConversation(prompt: string): Promise<ConversationTurn[]> {
  const turns: ConversationTurn[] = [];

  for await (const event of query({ prompt })) {
    if (event.type === 'assistant_message') {
      turns.push({ role: 'assistant', content: event.content });
    } else if (event.type === 'tool_result') {
      turns.push({ role: 'tool', content: event.output });
    }
  }

  return turns;
}
```

---

## Related Files

- [020_sdk_overview.md](./020_sdk_overview.md) - SDK overview
- [021_sdk_typescript.md](./021_sdk_typescript.md) - TypeScript SDK
- [022_sdk_python.md](./022_sdk_python.md) - Python SDK
- [025_sdk_sessions.md](./025_sdk_sessions.md) - Sessions

---

*Last updated: December 2025*
