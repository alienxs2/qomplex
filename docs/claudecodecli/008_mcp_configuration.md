# Claude Code CLI - MCP Configuration (.mcp.json)

**Keywords:** .mcp.json, MCP configuration, project MCP, team MCP, JSON, mcpServers

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/mcp

---

## Overview

`.mcp.json` is a project-level configuration file for MCP servers that can be committed to git and shared with your team.

---

## File Location

Place at project root:

```
/my-project
├── .mcp.json      # MCP server configuration
├── .claude/
│   └── settings.json
├── src/
└── package.json
```

---

## Basic Structure

```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "KEY": "value"
      }
    }
  }
}
```

---

## Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Executable command |
| `args` | string[] | No | Command arguments |
| `env` | object | No | Environment variables |
| `cwd` | string | No | Working directory |

---

## Complete Example

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
      "args": ["-y", "@anthropic/mcp-puppeteer"],
      "env": {
        "PUPPETEER_HEADLESS": "true"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/allowed/path"
      ]
    }
  }
}
```

---

## Environment Variable Substitution

Reference environment variables with `${VAR_NAME}`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "my-mcp-server",
      "env": {
        "API_KEY": "${MY_API_KEY}",
        "SECRET": "${MY_SECRET}"
      }
    }
  }
}
```

Variables are resolved from the shell environment at runtime.

---

## .mcp.json vs settings.json

| Feature | .mcp.json | settings.json |
|---------|-----------|---------------|
| Purpose | MCP servers only | All settings |
| Location | Project root | `.claude/` directory |
| Team sharing | Primary method | Also shareable |
| Scope | Project only | Project/user/local |

Both can configure MCP servers. Use `.mcp.json` for dedicated MCP config.

---

## Creating from CLI

The CLI can update `.mcp.json`:

```bash
# Adds to .mcp.json when using project scope
claude mcp add my-server --scope project
```

---

## Manual Editing

For complex configurations, edit directly:

```bash
# Create or edit .mcp.json
vim .mcp.json
```

---

## Verifying Configuration

After editing:

```bash
# Restart Claude Code
claude

# Check servers loaded
/mcp
```

Or with debug mode:

```bash
claude --mcp-debug
```

---

## Git Considerations

**Commit `.mcp.json`** for team sharing:

```bash
git add .mcp.json
git commit -m "Add MCP server configuration"
```

**Warning:** Never commit sensitive values. Use environment variable references (`${VAR}`) instead.

---

## Multiple Servers Example

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-sentry"],
      "env": {
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}"
      }
    },
    "jira": {
      "command": "npx",
      "args": ["-y", "@example/mcp-jira"],
      "env": {
        "JIRA_URL": "${JIRA_URL}",
        "JIRA_TOKEN": "${JIRA_TOKEN}"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@example/mcp-slack"],
      "env": {
        "SLACK_TOKEN": "${SLACK_TOKEN}"
      }
    }
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Server not loading | Check JSON syntax |
| Command not found | Ensure command is in PATH |
| npx fails | Verify Node.js installed |
| Env vars not resolved | Export variables in shell |

---

## Related Files

- [007_mcp_servers.md](./007_mcp_servers.md) - MCP servers CLI
- [005_configuration_settings.md](./005_configuration_settings.md) - settings.json
- [026_sdk_mcp.md](./026_sdk_mcp.md) - MCP in SDK

---

*Last updated: December 2025*
