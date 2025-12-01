# Claude Agent SDK - Python Reference

**Keywords:** Python, pip, query, ClaudeSDKClient, ClaudeAgentOptions, async, asyncio, streaming

**Official Documentation:** https://docs.claude.com/en/docs/agent-sdk/python

---

## Installation

```bash
pip install claude-agent-sdk
```

**Requirements:**
- Python 3.10+
- Node.js (required for some SDK features)

---

## Two APIs Available

| API | Use Case | Tools Support |
|-----|----------|---------------|
| `query()` | Simple, lightweight text generation | No |
| `ClaudeSDKClient` | Full agentic API with all features | Yes |

---

## Simple Query API

Best for lightweight use cases without tools:

```python
from claude_agent_sdk import query

async def main():
    result = await query(
        prompt="Explain this code",
        max_turns=10
    )
    print(result)

import asyncio
asyncio.run(main())
```

---

## ClaudeSDKClient (Full Features)

For full agentic capabilities:

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        max_turns=20,
        system_prompt="You are a code review assistant",
        allowed_tools=["Read", "Glob", "Grep"],
        working_directory="/path/to/project"
    )

    client = ClaudeSDKClient(options)

    async for event in client.query("Review the authentication module"):
        if event.type == "assistant_message":
            print(event.content)
        elif event.type == "tool_use":
            print(f"Using tool: {event.name}")

import asyncio
asyncio.run(main())
```

---

## ClaudeAgentOptions

| Option | Type | Description |
|--------|------|-------------|
| `max_turns` | `int` | Maximum conversation turns |
| `system_prompt` | `str` | Custom system prompt |
| `allowed_tools` | `list[str]` | Tools Claude can use |
| `disallowed_tools` | `list[str]` | Tools to block |
| `working_directory` | `str` | Working directory path |
| `setting_sources` | `list[str]` | Settings to load (e.g., `["project"]`) |
| `permission_mode` | `str` | Permission behavior mode |
| `mcp_servers` | `dict` | MCP server configuration |

---

## Loading Project Settings

By default, project settings are NOT loaded. To enable:

```python
options = ClaudeAgentOptions(
    setting_sources=["project"]  # Load .claude/settings.json and CLAUDE.md
)
```

---

## Streaming Events

```python
from claude_agent_sdk import ClaudeSDKClient

async def main():
    client = ClaudeSDKClient()

    async for event in client.query("Generate a utility function"):
        match event.type:
            case "assistant_message":
                print(f"Assistant: {event.content}")
            case "tool_use":
                print(f"Tool: {event.name} - {event.input}")
            case "tool_result":
                print(f"Result: {event.output}")
            case "system_message":
                if hasattr(event, 'session_id'):
                    print(f"Session: {event.session_id}")
```

---

## Session Management

### Resume a Session

```python
options = ClaudeAgentOptions(
    resume_session_id="previous-session-id"
)

client = ClaudeSDKClient(options)
result = await client.query("Continue the task")
```

### Fork a Session

```python
options = ClaudeAgentOptions(
    resume_session_id="previous-session-id",
    fork_session=True  # Creates new branch from this point
)
```

---

## Supported Hook Events (Python)

**Note:** Python SDK has limited hook support compared to TypeScript.

| Hook | Supported | Description |
|------|-----------|-------------|
| `PreToolUse` | Yes | Before tool execution |
| `PostToolUse` | Yes | After tool execution |
| `UserPromptSubmit` | Yes | User submits prompt |
| `Stop` | Yes | Execution stops |
| `SubagentStop` | Yes | Subagent stops |
| `PreCompact` | Yes | Before compaction |
| `SessionStart` | No | Not supported |
| `SessionEnd` | No | Not supported |
| `Notification` | No | Not supported |

---

## Adding Custom Tools

```python
from claude_agent_sdk import ClaudeAgentOptions

options = ClaudeAgentOptions(
    append_allowed_tools=["mcp__my-server__my_tool"],
    permission_mode="acceptEdits"
)
```

---

## Error Handling

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentError

async def main():
    try:
        client = ClaudeSDKClient()
        async for event in client.query("Perform task"):
            pass
    except ClaudeAgentError as e:
        print(f"Agent error: {e.message}")
        print(f"Code: {e.code}")
```

---

## Type Hints

```python
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    QueryEvent,
    AssistantMessage,
    ToolUseEvent,
    ToolResultEvent
)

def process_event(event: QueryEvent) -> None:
    if isinstance(event, AssistantMessage):
        handle_message(event)
    elif isinstance(event, ToolUseEvent):
        handle_tool(event)
```

---

## Related Files

- [020_sdk_overview.md](./020_sdk_overview.md) - SDK overview
- [021_sdk_typescript.md](./021_sdk_typescript.md) - TypeScript SDK
- [025_sdk_sessions.md](./025_sdk_sessions.md) - Session management
- [028_sdk_migration.md](./028_sdk_migration.md) - Migration guide

---

*Last updated: December 2025*
