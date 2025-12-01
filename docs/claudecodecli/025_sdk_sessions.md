# Claude Agent SDK - Session Management

**Keywords:** sessions, session ID, resume, fork, conversation state, history, context, multi-turn

**Official Documentation:** https://platform.claude.com/docs/en/agent-sdk/sessions

---

## Overview

Sessions allow you to continue conversations across multiple interactions while maintaining full context. The SDK automatically creates sessions and provides IDs for resumption.

---

## Session Lifecycle

```
Start Query → Session Created → Session ID Returned
                    │
                    ▼
            Continue/Resume Session
                    │
           ┌────────┴────────┐
           ▼                 ▼
    Continue Original    Fork Session
      (same ID)         (new branch)
```

---

## Capturing Session ID

### TypeScript

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

let sessionId: string | undefined;

for await (const event of query({ prompt: "Start a task" })) {
  if (event.type === 'system_message' && event.sessionId) {
    sessionId = event.sessionId;
    console.log('Session started:', sessionId);
  }
  // Process other events...
}

// Save sessionId for later use
```

### Python

```python
from claude_agent_sdk import ClaudeSDKClient

session_id = None

async def main():
    global session_id
    client = ClaudeSDKClient()

    async for event in client.query("Start a task"):
        if event.type == "system_message" and hasattr(event, 'session_id'):
            session_id = event.session_id
            print(f"Session started: {session_id}")
```

---

## Resuming a Session

Continue from where you left off:

### TypeScript

```typescript
const result = await query({
  prompt: "Continue with the next step",
  options: {
    resumeSessionId: sessionId
  }
});
```

### Python

```python
options = ClaudeAgentOptions(
    resume_session_id=session_id
)

client = ClaudeSDKClient(options)
async for event in client.query("Continue with the next step"):
    # Process events...
```

---

## Forking a Session

Create a new branch from an existing session state:

### TypeScript

```typescript
const result = await query({
  prompt: "Try a different approach",
  options: {
    resumeSessionId: sessionId,
    forkSession: true  // Creates new session ID
  }
});
```

### Python

```python
options = ClaudeAgentOptions(
    resume_session_id=session_id,
    fork_session=True
)
```

---

## When to Fork vs Continue

| Scenario | Action |
|----------|--------|
| Linear workflow continuation | Continue (no fork) |
| Exploring alternative approaches | Fork |
| A/B testing different prompts | Fork |
| Undoing and trying different path | Fork |
| Building on previous results | Continue |

---

## Session State Contents

A session preserves:

- Full conversation history
- Tool execution results
- File modifications made
- Context and memory
- Working directory state

---

## Multi-Session Patterns

### Parallel Sessions

```typescript
// Start multiple independent sessions
const session1 = query({ prompt: "Analyze module A" });
const session2 = query({ prompt: "Analyze module B" });

// Process in parallel
const [result1, result2] = await Promise.all([
  collectResults(session1),
  collectResults(session2)
]);
```

### Sequential with Handoff

```typescript
// Session 1: Analysis
let analysisSessionId: string;
for await (const event of query({ prompt: "Analyze the codebase" })) {
  if (event.type === 'system_message') analysisSessionId = event.sessionId;
}

// Session 2: Implementation (new session, referencing analysis)
const result = await query({
  prompt: "Based on analysis, implement improvements",
  options: {
    systemPrompt: `Previous analysis session: ${analysisSessionId}`
  }
});
```

---

## Session Storage

Sessions are managed by the SDK. To persist session IDs:

```typescript
// Save to file
import { writeFileSync, readFileSync } from 'fs';

function saveSession(id: string) {
  writeFileSync('.session', id);
}

function loadSession(): string | undefined {
  try {
    return readFileSync('.session', 'utf-8');
  } catch {
    return undefined;
  }
}

// Usage
const previousSession = loadSession();
const result = await query({
  prompt: "Continue work",
  options: previousSession ? { resumeSessionId: previousSession } : {}
});
```

---

## Session Limitations

| Limitation | Details |
|------------|---------|
| Expiration | Sessions may expire after inactivity |
| Size | Context limits still apply |
| Cross-machine | Sessions are local to the environment |

---

## Best Practices

1. **Always capture session ID** - Store it for potential resumption
2. **Fork for experiments** - Don't pollute main session with exploration
3. **Clear sessions** - Start fresh for unrelated tasks
4. **Handle expiration** - Gracefully handle expired sessions

---

## Related Files

- [020_sdk_overview.md](./020_sdk_overview.md) - SDK overview
- [021_sdk_typescript.md](./021_sdk_typescript.md) - TypeScript reference
- [022_sdk_python.md](./022_sdk_python.md) - Python reference
- [027_sdk_streaming.md](./027_sdk_streaming.md) - Streaming events

---

*Last updated: December 2025*
