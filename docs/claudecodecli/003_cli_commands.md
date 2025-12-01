# Claude Code CLI - Commands Reference

**Keywords:** commands, slash commands, /help, /clear, /compact, /rewind, /model, /mcp, claude doctor, claude config

**Official Documentation:** https://code.claude.com/docs/en/cli-reference

---

## Terminal Commands

Commands run from your shell before starting Claude Code.

| Command | Description |
|---------|-------------|
| `claude` | Start interactive session |
| `claude "prompt"` | Start with initial prompt |
| `claude -p "prompt"` | Headless mode (print & exit) |
| `claude doctor` | Run diagnostics |
| `claude config` | View/modify configuration |
| `claude mcp` | Manage MCP servers |
| `claude logout` | Log out current account |
| `claude --version` | Show version |
| `claude --help` | Show help |

---

## Interactive Slash Commands

Commands used inside Claude Code session.

### Information Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/status` | Show current session status |
| `/cost` | Show cost for current session |

### Context Management

| Command | Description |
|---------|-------------|
| `/clear` | Clear conversation history |
| `/compact` | Compress context (use at ~70% capacity) |
| `/rewind` | Roll back to previous state |

### Model Control

| Command | Description |
|---------|-------------|
| `/model` | Show current model |
| `/model opus` | Switch to Opus |
| `/model sonnet` | Switch to Sonnet |
| `/model haiku` | Switch to Haiku |
| `/model claude-opus-4-5-20251101` | Use full model name |

### MCP & Tools

| Command | Description |
|---------|-------------|
| `/mcp` | Show MCP server status |
| `/allowed-tools` | Show allowed tools |

### Other

| Command | Description |
|---------|-------------|
| `/bug` | Report a bug |
| `/quit` or `/exit` | Exit Claude Code |

---

## Claude Config Command

```bash
# View all settings
claude config list

# Get specific setting
claude config get model

# Set a value
claude config set model claude-haiku-4-5

# Reset to default
claude config reset model
```

---

## Claude MCP Command

```bash
# List all MCP servers
claude mcp list

# Add server (interactive wizard)
claude mcp add server-name

# Add server with scope
claude mcp add server-name --scope user
claude mcp add server-name --scope project

# Add server with JSON config
claude mcp add-json server-name '{"command":"npx","args":["-y","@example/server"]}'

# Remove server
claude mcp remove server-name

# Test server
claude mcp get server-name
```

---

## Claude Doctor Command

Diagnose and fix common issues:

```bash
claude doctor
```

Checks:
- Node.js version
- Authentication status
- Configuration validity
- Network connectivity
- MCP server health

---

## Custom Slash Commands

Create your own commands:

**Project-level** (`.claude/commands/my-command.md`):
```markdown
Fix the GitHub issue: $ARGUMENTS
```

Use as: `/project:my-command 1234`

**User-level** (`~/.claude/commands/my-command.md`):

Use as: `/user:my-command`

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Cancel current operation |
| `Esc Esc` | Open rewind menu |
| `Up Arrow` | Previous input |
| `Tab` | Autocomplete |

---

## Command Examples

```bash
# Start in specific directory
cd /my/project && claude

# Start with specific model
claude --model claude-opus-4-5-20251101

# Run analysis and exit
claude -p "Analyze this codebase" --output-format json

# Debug MCP issues
claude --mcp-debug
```

---

## Related Files

- [004_cli_flags.md](./004_cli_flags.md) - CLI flags reference
- [011_slash_commands.md](./011_slash_commands.md) - Custom slash commands
- [014_models.md](./014_models.md) - Model configuration
- [007_mcp_servers.md](./007_mcp_servers.md) - MCP servers

---

*Last updated: December 2025*
