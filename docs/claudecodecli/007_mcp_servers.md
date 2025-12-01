# Claude Code CLI - MCP Servers Setup

**Keywords:** MCP, Model Context Protocol, tools, servers, add, remove, list, scope, user, project, local

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/mcp

---

## Overview

Model Context Protocol (MCP) is Anthropic's open standard for connecting AI assistants to external tools and data sources. Claude Code acts as both an MCP client and server.

---

## MCP Server Scopes

| Scope | Persistence | Location | Sharing |
|-------|-------------|----------|---------|
| `local` | Session only | Memory | No |
| `user` | Permanent | `~/.claude.json` | All your projects |
| `project` | Permanent | `.mcp.json` | Team (via git) |

---

## Adding MCP Servers

### Interactive Wizard

```bash
claude mcp add server-name
```

### With Specific Scope

```bash
# User-level (all your projects)
claude mcp add github --scope user

# Project-level (shared with team)
claude mcp add github --scope project

# Local (current session only)
claude mcp add github --scope local
```

### Direct JSON Configuration

```bash
claude mcp add-json my-server '{"command":"npx","args":["-y","@example/mcp-server"]}'
```

---

## Listing MCP Servers

```bash
# List all servers
claude mcp list

# Check inside Claude Code
/mcp
```

---

## Removing MCP Servers

```bash
claude mcp remove server-name
```

---

## Testing MCP Servers

```bash
claude mcp get server-name
```

---

## Common MCP Servers

| Server | Purpose | Installation |
|--------|---------|--------------|
| Puppeteer | Browser automation | `npx @anthropic/mcp-puppeteer` |
| GitHub | GitHub API access | `npx @anthropic/mcp-github` |
| Filesystem | Enhanced file access | `npx @modelcontextprotocol/server-filesystem` |
| Postgres | Database access | `npx @anthropic/mcp-postgres` |

---

## MCP Server Configuration Format

```json
{
  "command": "npx",
  "args": ["-y", "@example/mcp-server"],
  "env": {
    "API_KEY": "your-key"
  },
  "cwd": "/path/to/directory"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | Executable command |
| `args` | No | Command arguments |
| `env` | No | Environment variables |
| `cwd` | No | Working directory |

---

## Scope Priority

When the same server is configured at multiple scopes:

```
Local → Project → User
(highest)    (lowest)
```

---

## Debugging MCP Issues

```bash
# Start with MCP debugging
claude --mcp-debug

# Check server status
/mcp
```

---

## MCP Tool Naming

MCP tools follow this pattern:

```
mcp__<server-name>__<tool-name>
```

Example: `mcp__puppeteer__screenshot`

---

## Environment Variable Substitution

Use `${VAR_NAME}` in configurations:

```json
{
  "env": {
    "API_KEY": "${MY_API_KEY}"
  }
}
```

---

## NPX-based Servers

Most MCP servers use npx for auto-installation:

```bash
claude mcp add-json puppeteer '{"command":"npx","args":["-y","@anthropic/mcp-puppeteer"]}'
```

**Note:** Requires Node.js installed.

---

## Related Files

- [008_mcp_configuration.md](./008_mcp_configuration.md) - .mcp.json file details
- [026_sdk_mcp.md](./026_sdk_mcp.md) - MCP in SDK
- [005_configuration_settings.md](./005_configuration_settings.md) - settings.json

---

*Last updated: December 2025*
