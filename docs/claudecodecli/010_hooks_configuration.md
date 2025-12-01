# Claude Code CLI - Hooks Configuration

**Keywords:** hooks configuration, PreToolUse, PostToolUse, matcher, command, JSON, settings.json, examples

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/hooks

---

## Configuration Location

Hooks are configured in settings files:

- `~/.claude/settings.json` (user)
- `.claude/settings.json` (project)
- `.claude/settings.local.json` (local)

---

## Basic Structure

```json
{
  "hooks": {
    "HookType": [
      {
        "matcher": "pattern",
        "hooks": [
          {
            "type": "command",
            "command": "shell command",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

---

## Matcher Patterns

| Pattern | Matches |
|---------|---------|
| `Write` | Exact match: Write tool only |
| `Write\|Edit` | Write OR Edit tool |
| `*` | All tools |
| `""` (empty) | All tools |
| `mcp__*__*` | All MCP tools |
| `mcp__github__*` | All GitHub MCP tools |

---

## Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | required | `"command"` or `"prompt"` |
| `command` | string | required | Shell command to execute |
| `timeout` | number | 60 | Timeout in seconds |

---

## PreToolUse Examples

### Block Sensitive File Edits

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const input=JSON.parse(require('fs').readFileSync(0,'utf8')); if(input.input.file_path.includes('.env')){console.log(JSON.stringify({permissionDecision:'deny',reason:'Cannot edit .env files'}));process.exit(0);} console.log(JSON.stringify({continue:true}));\""
          }
        ]
      }
    ]
  }
}
```

### Require Confirmation for Bash

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/confirm-command.sh"
          }
        ]
      }
    ]
  }
}
```

### Log All Tool Usage

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "cat >> ~/.claude/tool-log.json"
          }
        ]
      }
    ]
  }
}
```

---

## PostToolUse Examples

### Run Tests After Code Changes

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm test --silent 2>/dev/null || echo '{\"systemMessage\":\"Tests failed\"}'"
          }
        ]
      }
    ]
  }
}
```

### Format Code After Edits

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $(cat | jq -r '.input.file_path') 2>/dev/null"
          }
        ]
      }
    ]
  }
}
```

### Lint After File Changes

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "file=$(cat | jq -r '.input.file_path'); if [[ $file == *.ts ]]; then npx eslint --fix \"$file\"; fi"
          }
        ]
      }
    ]
  }
}
```

---

## Hook Script Example

External script `/path/to/hook.sh`:

```bash
#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract file path
file_path=$(echo "$input" | jq -r '.input.file_path // empty')

# Check if editing protected file
if [[ "$file_path" == *".env"* ]] || [[ "$file_path" == *"secrets"* ]]; then
    echo '{"permissionDecision":"deny","reason":"Protected file"}'
    exit 0
fi

# Allow the operation
echo '{"continue":true}'
```

---

## JSON Output Reference

### Allow Operation

```json
{"continue": true}
```

### Deny Operation (PreToolUse only)

```json
{
  "permissionDecision": "deny",
  "reason": "Human-readable reason"
}
```

### Add System Message

```json
{
  "continue": true,
  "systemMessage": "Message shown to Claude"
}
```

### Suppress Output

```json
{
  "continue": true,
  "suppressOutput": true
}
```

### Stop Execution

```json
{
  "continue": false,
  "stopReason": "Reason for stopping"
}
```

---

## Complete Configuration Example

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "/home/user/scripts/validate-edit.sh",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/home/user/scripts/validate-bash.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run format -- $(cat | jq -r '.input.file_path')"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/home/user/scripts/cleanup.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Debugging Hooks

1. Test command manually first
2. Use `--verbose` flag
3. Check hook script exit codes
4. Log output to file for inspection

---

## Related Files

- [009_hooks_overview.md](./009_hooks_overview.md) - Hooks overview
- [005_configuration_settings.md](./005_configuration_settings.md) - settings.json
- [016_permissions.md](./016_permissions.md) - Permissions

---

*Last updated: December 2025*
