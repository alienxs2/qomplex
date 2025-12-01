# Claude Code CLI Documentation Index

**Version:** December 2025
**For:** AI Agents
**Official Docs:** https://docs.claude.com/en/docs/claude-code

---

## Quick Navigation

- [Claude Agent SDK](#claude-agent-sdk-priority) - Priority documentation for building AI agents
- [Installation & Setup](#installation--setup)
- [CLI Reference](#cli-reference)
- [Configuration](#configuration)
- [MCP Servers](#mcp-servers)
- [Hooks](#hooks)
- [IDE Integrations](#ide-integrations)
- [Official Links](#official-links)

---

## Claude Agent SDK (Priority)

Build AI agents programmatically with Claude Code's capabilities.

| File | Description | Keywords |
|------|-------------|----------|
| [020_sdk_overview.md](./claudecodecli/020_sdk_overview.md) | SDK overview, installation, authentication | SDK, Agent SDK, install, npm, pip, API key, Bedrock, Vertex |
| [021_sdk_typescript.md](./claudecodecli/021_sdk_typescript.md) | TypeScript SDK reference and examples | TypeScript, Node.js, query, ClaudeAgentOptions, streaming |
| [022_sdk_python.md](./claudecodecli/022_sdk_python.md) | Python SDK reference and examples | Python, pip, query, ClaudeSDKClient, async, asyncio |
| [023_sdk_tools.md](./claudecodecli/023_sdk_tools.md) | Custom tools, MCP integration in SDK | tools, MCP, custom tools, allowedTools, createSdkMcpServer |
| [024_sdk_permissions.md](./claudecodecli/024_sdk_permissions.md) | SDK permission control system | permissions, permissionMode, canUseTool, acceptEdits |
| [025_sdk_sessions.md](./claudecodecli/025_sdk_sessions.md) | Session management and resumption | sessions, session ID, resume, fork, context |
| [026_sdk_mcp.md](./claudecodecli/026_sdk_mcp.md) | MCP servers in SDK (in-process & external) | MCP, mcp_servers, subprocess, in-process, SDK MCP |
| [027_sdk_streaming.md](./claudecodecli/027_sdk_streaming.md) | Streaming events and real-time processing | streaming, events, HookEvent, async iterator |
| [028_sdk_migration.md](./claudecodecli/028_sdk_migration.md) | Migration from Claude Code SDK | migration, upgrade, breaking changes, imports |

---

## Installation & Setup

| File | Description | Keywords |
|------|-------------|----------|
| [001_installation.md](./claudecodecli/001_installation.md) | Installation methods and requirements | install, npm, curl, Node.js, Windows, WSL, macOS, Linux |
| [002_authentication.md](./claudecodecli/002_authentication.md) | Authentication and API keys | authentication, API key, OAuth, Bedrock, Vertex, login |

---

## CLI Reference

| File | Description | Keywords |
|------|-------------|----------|
| [003_cli_commands.md](./claudecodecli/003_cli_commands.md) | CLI and slash commands reference | commands, /help, /clear, /compact, /rewind, /model |
| [004_cli_flags.md](./claudecodecli/004_cli_flags.md) | CLI flags and options | flags, --model, --print, -p, --output-format, --verbose |
| [014_models.md](./claudecodecli/014_models.md) | Model selection and configuration | models, Opus, Sonnet, Haiku, --model, opusplan |
| [015_headless_mode.md](./claudecodecli/015_headless_mode.md) | Non-interactive mode for CI/CD | headless, -p, CI/CD, automation, JSON, scripting |

---

## Configuration

| File | Description | Keywords |
|------|-------------|----------|
| [005_configuration_settings.md](./claudecodecli/005_configuration_settings.md) | settings.json configuration | settings.json, permissions, environment, hierarchy |
| [006_claudemd_memory.md](./claudecodecli/006_claudemd_memory.md) | CLAUDE.md memory system | CLAUDE.md, memory, context, instructions, @import |
| [016_permissions.md](./claudecodecli/016_permissions.md) | Permissions and security | permissions, security, allow, deny, patterns |

---

## MCP Servers

| File | Description | Keywords |
|------|-------------|----------|
| [007_mcp_servers.md](./claudecodecli/007_mcp_servers.md) | MCP servers setup and management | MCP, servers, add, remove, scope, user, project |
| [008_mcp_configuration.md](./claudecodecli/008_mcp_configuration.md) | .mcp.json configuration file | .mcp.json, configuration, JSON, mcpServers |

---

## Hooks

| File | Description | Keywords |
|------|-------------|----------|
| [009_hooks_overview.md](./claudecodecli/009_hooks_overview.md) | Hooks system overview | hooks, PreToolUse, PostToolUse, lifecycle, events |
| [010_hooks_configuration.md](./claudecodecli/010_hooks_configuration.md) | Hooks configuration examples | hooks configuration, matcher, command, JSON examples |

---

## Slash Commands

| File | Description | Keywords |
|------|-------------|----------|
| [011_slash_commands.md](./claudecodecli/011_slash_commands.md) | Custom slash commands | slash commands, /project, /user, markdown, $ARGUMENTS |

---

## IDE Integrations

| File | Description | Keywords |
|------|-------------|----------|
| [012_ide_vscode.md](./claudecodecli/012_ide_vscode.md) | VS Code extension | VS Code, extension, Cursor, Windsurf, diff, shortcuts |
| [013_ide_jetbrains.md](./claudecodecli/013_ide_jetbrains.md) | JetBrains plugin | JetBrains, IntelliJ, WebStorm, PyCharm, plugin |

---

## Official Links

### Documentation
- **Claude Code Docs:** https://docs.claude.com/en/docs/claude-code
- **CLI Reference:** https://code.claude.com/docs/en/cli-reference
- **Agent SDK Overview:** https://docs.claude.com/en/api/agent-sdk/overview
- **TypeScript SDK:** https://code.claude.com/docs/en/sdk/sdk-typescript
- **Python SDK:** https://docs.claude.com/en/docs/agent-sdk/python

### Repositories
- **Claude Code:** https://github.com/anthropics/claude-code
- **Agent SDK TypeScript:** https://github.com/anthropics/claude-agent-sdk-typescript
- **Agent SDK Python:** https://github.com/anthropics/claude-agent-sdk-python

### Packages
- **NPM (CLI):** https://www.npmjs.com/package/@anthropic-ai/claude-code
- **NPM (SDK):** https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk
- **PyPI (SDK):** https://pypi.org/project/claude-agent-sdk/

### Other
- **Best Practices:** https://www.anthropic.com/engineering/claude-code-best-practices
- **Report Issues:** https://github.com/anthropics/claude-code/issues

---

## Usage Guide for AI Agents

1. **Find topic:** Scan the tables above for relevant keywords
2. **Read file:** Open the specific file for detailed information
3. **Follow links:** Check related files for additional context
4. **Verify:** Use official links for the most up-to-date information

---

*Last updated: December 2025*
