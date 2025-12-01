# Claude Code CLI - Hooks Overview

**Keywords:** hooks, PreToolUse, PostToolUse, automation, lifecycle, events, shell commands

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/hooks

---

## Overview

Hooks are user-defined shell commands that execute automatically at specific points in Claude Code's lifecycle. They enable automation, validation, and custom workflows.

---

## Available Hook Types

| Hook | Trigger Point | Use Case |
|------|---------------|----------|
| `PreToolUse` | Before tool executes | Validation, blocking |
| `PostToolUse` | After tool completes | Testing, logging |
| `UserPromptSubmit` | User sends prompt | Input processing |
| `Notification` | System notification | Alerting |
| `SessionStart` | Session begins | Setup |
| `SessionEnd` | Session ends | Cleanup |
| `Stop` | Execution stops | Finalization |
| `SubagentStop` | Subagent stops | Subagent handling |
| `PreCompact` | Before compaction | Context preservation |

---

## Common Use Cases

### PreToolUse

- Block writes to sensitive files
- Require approval for certain operations
- Log tool usage
- Validate tool inputs

### PostToolUse

- Run tests after code changes
- Format code after edits
- Update indexes after file operations
- Send notifications

### UserPromptSubmit

- Log all user prompts
- Filter or modify inputs
- Trigger external workflows

---

## Basic Hook Behavior

1. Hook matches tool/event by matcher pattern
2. Shell command executes
3. Hook can:
   - Allow (exit 0, or return `{"continue": true}`)
   - Block (exit non-zero, or return `{"permissionDecision": "deny"}`)
   - Modify (return JSON with changes)

---

## Hook Execution

| Feature | Behavior |
|---------|----------|
| Timeout | 60 seconds default (configurable) |
| Parallel | Multiple matching hooks run in parallel |
| Deduplication | Identical commands are deduplicated |
| Input | JSON via stdin |
| Output | stdout parsed as JSON (optional) |

---

## Quick Example

Prevent editing .env files:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "if echo $HOOK_INPUT | grep -q '.env'; then exit 1; fi"
          }
        ]
      }
    ]
  }
}
```

---

## Hook Input (stdin)

Hooks receive JSON input via stdin:

```json
{
  "tool": "Write",
  "input": {
    "file_path": "/path/to/file.ts",
    "content": "..."
  },
  "sessionId": "abc123"
}
```

---

## Hook Output (stdout)

Return JSON to control behavior:

```json
{
  "continue": true,
  "suppressOutput": false,
  "systemMessage": "Hook executed successfully"
}
```

For PreToolUse, can also use:

```json
{
  "permissionDecision": "deny",
  "reason": "Operation not allowed"
}
```

---

## MCP Tool Matching

MCP tools follow pattern `mcp__<server>__<tool>`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__puppeteer__*",
        "hooks": [...]
      }
    ]
  }
}
```

---

## Related Files

- [010_hooks_configuration.md](./010_hooks_configuration.md) - Detailed configuration
- [005_configuration_settings.md](./005_configuration_settings.md) - settings.json
- [024_sdk_permissions.md](./024_sdk_permissions.md) - SDK permissions

---

*Last updated: December 2025*
