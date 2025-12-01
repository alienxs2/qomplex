# Claude Code CLI - Flags Reference

**Keywords:** flags, options, --model, --print, -p, --output-format, --verbose, --system-prompt, headless, JSON

**Official Documentation:** https://code.claude.com/docs/en/cli-reference

---

## Common Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |
| `--print` | `-p` | Headless mode (non-interactive) |
| `--model` | | Specify model to use |
| `--verbose` | | Enable debug output |

---

## Model Selection

```bash
# Use specific model
claude --model claude-opus-4-5-20251101

# Shorthand names
claude --model opus
claude --model sonnet
claude --model haiku
```

---

## Headless Mode Flags

For automation and CI/CD:

| Flag | Description |
|------|-------------|
| `-p "prompt"` | Run prompt and exit |
| `--output-format text` | Plain text output (default) |
| `--output-format json` | JSON with metadata |
| `--output-format stream-json` | Streaming JSON events |

### Examples

```bash
# Simple headless query
claude -p "What files are in src/"

# JSON output with metadata
claude -p "Analyze code" --output-format json

# Streaming JSON for real-time processing
claude -p "Complex task" --output-format stream-json
```

---

## System Prompt Flags

| Flag | Description |
|------|-------------|
| `--system-prompt "text"` | Replace system prompt entirely |
| `--system-prompt-file path` | Load system prompt from file |
| `--append-system-prompt "text"` | Add to existing system prompt |

**Recommendation:** Use `--append-system-prompt` to preserve Claude Code's built-in capabilities.

### Examples

```bash
# Add custom instructions
claude --append-system-prompt "Always use TypeScript"

# Load from file
claude --system-prompt-file ./custom-prompt.md

# Full replacement (use carefully)
claude --system-prompt "You are a code reviewer"
```

---

## Debug Flags

| Flag | Description |
|------|-------------|
| `--verbose` | Show detailed debug information |
| `--mcp-debug` | Debug MCP server connections |

```bash
# Debug mode
claude --verbose

# MCP debugging
claude --mcp-debug
```

---

## Configuration Flags

| Flag | Description |
|------|-------------|
| `--no-settings` | Ignore settings files |
| `--working-directory path` | Set working directory |

```bash
# Start in specific directory
claude --working-directory /path/to/project

# Ignore all settings
claude --no-settings
```

---

## Output Control Flags

| Flag | Description |
|------|-------------|
| `--output-format` | Output format (text/json/stream-json) |
| `--max-turns N` | Limit conversation turns |

---

## Combining Flags

```bash
# Headless with JSON output and specific model
claude -p "Analyze" --model opus --output-format json

# Debug MCP with verbose output
claude --mcp-debug --verbose

# Custom prompt with model selection
claude --model haiku --append-system-prompt "Be concise"
```

---

## Parsing JSON Output

```bash
# Extract result with jq
result=$(claude -p "Generate code" --output-format json)
code=$(echo "$result" | jq -r '.result')
cost=$(echo "$result" | jq -r '.cost_usd')

echo "Code: $code"
echo "Cost: $cost"
```

---

## Environment Variable Alternatives

Some flags can be set via environment variables:

| Flag | Environment Variable |
|------|---------------------|
| `--model` | `ANTHROPIC_MODEL` |

```bash
export ANTHROPIC_MODEL="claude-opus-4-5-20251101"
claude  # Uses Opus by default
```

---

## Flag Precedence

1. Command-line flags (highest priority)
2. Environment variables
3. Project settings (`.claude/settings.json`)
4. User settings (`~/.claude/settings.json`)
5. Defaults (lowest priority)

---

## Related Files

- [003_cli_commands.md](./003_cli_commands.md) - CLI commands
- [015_headless_mode.md](./015_headless_mode.md) - Headless mode details
- [014_models.md](./014_models.md) - Model configuration
- [005_configuration_settings.md](./005_configuration_settings.md) - Settings files

---

*Last updated: December 2025*
