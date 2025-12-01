# Claude Agent SDK - Permissions

**Keywords:** permissions, permissionMode, canUseTool, acceptEdits, hooks, allow, deny, security, tool control

**Official Documentation:** https://code.claude.com/docs/en/sdk/sdk-permissions

---

## Overview

The Claude Agent SDK provides four complementary ways to control tool usage:

1. **Permission Modes** - Global permission behavior
2. **canUseTool Callback** - Runtime permission handler
3. **Hooks** - Fine-grained execution control
4. **Permission Rules** - Declarative allow/deny rules

---

## Permission Modes

| Mode | Behavior |
|------|----------|
| `default` | Ask for confirmation on write operations |
| `acceptEdits` | Auto-approve file modifications |
| `plan` | Planning mode, no execution |

### TypeScript

```typescript
const result = await query({
  prompt: "Update the config file",
  options: {
    permissionMode: 'acceptEdits'
  }
});
```

### Python

```python
options = ClaudeAgentOptions(
    permission_mode="acceptEdits"
)
```

---

## canUseTool Callback

Implement custom permission logic at runtime:

### TypeScript

```typescript
const result = await query({
  prompt: "Modify files",
  options: {
    canUseTool: async (toolName, toolInput) => {
      // Block deletion commands
      if (toolName === 'Bash' && toolInput.command?.includes('rm ')) {
        return {
          allowed: false,
          reason: "Deletion commands are not permitted"
        };
      }

      // Require confirmation for writes
      if (toolName === 'Write') {
        const confirmed = await askUser(`Allow writing to ${toolInput.file_path}?`);
        return { allowed: confirmed };
      }

      return { allowed: true };
    }
  }
});
```

### Python

```python
async def can_use_tool(tool_name: str, tool_input: dict) -> dict:
    if tool_name == "Bash" and "rm " in tool_input.get("command", ""):
        return {"allowed": False, "reason": "Deletion not permitted"}

    if tool_name == "Write":
        confirmed = await ask_user(f"Allow writing to {tool_input['file_path']}?")
        return {"allowed": confirmed}

    return {"allowed": True}

options = ClaudeAgentOptions(
    can_use_tool=can_use_tool
)
```

---

## Permission Rules (settings.json)

Declarative rules in settings files:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm run *)",
      "Bash(git *)"
    ],
    "deny": [
      "Bash(rm *)",
      "Bash(sudo *)",
      "Write(*.env)"
    ]
  }
}
```

### Pattern Syntax

| Pattern | Matches |
|---------|---------|
| `Read` | All Read tool calls |
| `Bash(npm *)` | Bash commands starting with "npm" |
| `Write(*.env)` | Writing to .env files |
| `mcp__*__*` | All MCP tools |

---

## Combining Tools with Permissions

Enable file modifications with specific tools:

### TypeScript

```typescript
options: {
  appendAllowedTools: ["Write", "Edit"],
  permissionMode: "acceptEdits"
}
```

### Python

```python
options = ClaudeAgentOptions(
    append_allowed_tools=["Write", "Edit"],
    permission_mode="acceptEdits"
)
```

---

## Using Hooks for Permissions

Fine-grained control through hooks:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/permission-check.js"
          }
        ]
      }
    ]
  }
}
```

Hook script can return:

```json
{
  "permissionDecision": "deny",
  "reason": "Cannot modify protected files"
}
```

---

## Read-Only Mode

For analysis tasks without modifications:

```typescript
const result = await query({
  prompt: "Analyze this codebase",
  options: {
    allowedTools: ["Read", "Glob", "Grep"],
    disallowedTools: ["Write", "Edit", "Bash"]
  }
});
```

---

## Security Best Practices

1. **Least Privilege** - Only enable tools needed for the task
2. **Explicit Denies** - Block dangerous operations explicitly
3. **Path Restrictions** - Limit file access to specific directories
4. **Command Filtering** - Use patterns to allow only safe commands
5. **Audit Logging** - Use hooks to log all tool executions

---

## Permission Decision Flow

```
Tool Request
    │
    ▼
Check allowedTools/disallowedTools
    │
    ▼
Check permission rules (settings.json)
    │
    ▼
Run canUseTool callback
    │
    ▼
Run PreToolUse hooks
    │
    ▼
Execute Tool (if all pass)
```

---

## Related Files

- [020_sdk_overview.md](./020_sdk_overview.md) - SDK overview
- [023_sdk_tools.md](./023_sdk_tools.md) - Tools configuration
- [009_hooks_overview.md](./009_hooks_overview.md) - Hooks overview
- [016_permissions.md](./016_permissions.md) - CLI permissions

---

*Last updated: December 2025*
