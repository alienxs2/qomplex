# Claude Code CLI - Configuration (settings.json)

**Keywords:** settings.json, configuration, permissions, environment, project settings, user settings, local settings, hierarchy

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/settings

---

## Settings File Locations

| Location | Scope | Git |
|----------|-------|-----|
| `~/.claude/settings.json` | User (all projects) | No |
| `.claude/settings.json` | Project (team) | Yes |
| `.claude/settings.local.json` | Project (personal) | No |

---

## Settings Hierarchy

Higher priority settings override lower:

1. Local project settings (highest)
2. Project settings
3. User settings (lowest)

---

## Basic Structure

```json
{
  "permissions": {
    "allow": [],
    "deny": []
  },
  "env": {},
  "hooks": {},
  "mcpServers": {}
}
```

---

## Permissions Configuration

Control which tools Claude can use:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm run *)",
      "Bash(git status)",
      "Bash(git diff *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Write(*.env)",
      "Write(.env*)"
    ]
  }
}
```

### Permission Patterns

| Pattern | Matches |
|---------|---------|
| `Read` | All Read tool calls |
| `Bash(npm *)` | Bash commands starting with npm |
| `Write(*.env)` | Writing to .env files |
| `mcp__*__*` | All MCP tools |

---

## Environment Variables

Set environment variables for Claude Code sessions:

```json
{
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "true",
    "CUSTOM_VAR": "value"
  }
}
```

---

## MCP Servers Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-puppeteer"]
    }
  }
}
```

---

## Hooks Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'File modification detected'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Command executed'"
          }
        ]
      }
    ]
  }
}
```

---

## Complete Example

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(npm *)",
      "Bash(git *)",
      "Bash(pnpm *)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo *)",
      "Write(.env.production)"
    ]
  },
  "env": {
    "NODE_ENV": "development"
  },
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"]
    }
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint --fix"
          }
        ]
      }
    ]
  }
}
```

---

## Project vs User Settings

**User settings** (`~/.claude/settings.json`):
- Personal preferences
- Global tool permissions
- User-level MCP servers

**Project settings** (`.claude/settings.json`):
- Team-shared configuration
- Project-specific tools
- Committed to git

**Local project settings** (`.claude/settings.local.json`):
- Personal project overrides
- Local API keys
- Not committed to git

---

## Viewing Current Settings

```bash
# View all settings
claude config list

# View specific setting
claude config get permissions
```

---

## Related Files

- [006_claudemd_memory.md](./006_claudemd_memory.md) - CLAUDE.md memory
- [009_hooks_overview.md](./009_hooks_overview.md) - Hooks overview
- [007_mcp_servers.md](./007_mcp_servers.md) - MCP servers
- [016_permissions.md](./016_permissions.md) - Permissions details

---

*Last updated: December 2025*
