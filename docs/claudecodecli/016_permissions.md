# Claude Code CLI - Permissions System

**Keywords:** permissions, security, allow, deny, tools, Bash, Write, Edit, patterns, settings.json

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/permissions

---

## Overview

The permissions system controls which tools Claude can use, providing security boundaries for automated operations.

---

## Permission Configuration

Permissions are set in settings.json:

```json
{
  "permissions": {
    "allow": [...],
    "deny": [...]
  }
}
```

---

## Available Tools

| Tool | Description | Risk Level |
|------|-------------|------------|
| `Read` | Read file contents | Low |
| `Glob` | Find files | Low |
| `Grep` | Search contents | Low |
| `Write` | Create/overwrite files | High |
| `Edit` | Modify files | High |
| `MultiEdit` | Multiple edits | High |
| `Bash` | Execute commands | High |
| `WebFetch` | Fetch URLs | Medium |
| `WebSearch` | Search web | Medium |

---

## Permission Patterns

### Exact Match

```json
{
  "allow": ["Read", "Glob", "Grep"]
}
```

### Wildcard Tool

```json
{
  "allow": ["*"]
}
```

### Command Patterns (Bash)

```json
{
  "allow": [
    "Bash(npm *)",
    "Bash(git status)",
    "Bash(git diff *)"
  ],
  "deny": [
    "Bash(rm *)",
    "Bash(sudo *)"
  ]
}
```

### File Patterns (Write/Edit)

```json
{
  "allow": [
    "Write(src/*)",
    "Edit(src/*)"
  ],
  "deny": [
    "Write(*.env)",
    "Write(.env*)",
    "Edit(secrets/*)"
  ]
}
```

### MCP Tool Patterns

```json
{
  "allow": [
    "mcp__github__*",
    "mcp__filesystem__read_file"
  ],
  "deny": [
    "mcp__*__delete_*"
  ]
}
```

---

## Pattern Syntax

| Pattern | Matches |
|---------|---------|
| `Read` | Read tool only |
| `Bash(npm *)` | Bash with npm commands |
| `Write(*.ts)` | Write to .ts files |
| `mcp__*__*` | All MCP tools |
| `*` | Everything |

---

## Common Configurations

### Read-Only Mode

```json
{
  "permissions": {
    "allow": ["Read", "Glob", "Grep"],
    "deny": ["Write", "Edit", "Bash"]
  }
}
```

### Development Mode

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
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Write(.env*)"
    ]
  }
}
```

### CI/CD Mode

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm test)",
      "Bash(npm run lint)",
      "Bash(npm run build)"
    ],
    "deny": ["Write", "Edit"]
  }
}
```

---

## Permission Evaluation Order

1. Check `deny` rules first
2. If denied → Block
3. Check `allow` rules
4. If allowed → Permit
5. Otherwise → Prompt user

---

## Settings File Locations

| File | Scope | Priority |
|------|-------|----------|
| `.claude/settings.local.json` | Local | Highest |
| `.claude/settings.json` | Project | Medium |
| `~/.claude/settings.json` | User | Lowest |

---

## Security Best Practices

### 1. Least Privilege

Only allow what's needed:

```json
{
  "allow": ["Read", "Glob", "Grep"]
}
```

### 2. Explicit Denies

Block dangerous operations:

```json
{
  "deny": [
    "Bash(rm -rf *)",
    "Bash(curl * | bash)",
    "Bash(wget * | sh)",
    "Write(.env*)",
    "Write(*secret*)"
  ]
}
```

### 3. Path Restrictions

Limit file access:

```json
{
  "allow": [
    "Write(src/*)",
    "Edit(src/*)",
    "Write(tests/*)"
  ],
  "deny": [
    "Write(/*)",
    "Edit(/*)"
  ]
}
```

### 4. Command Restrictions

Limit bash commands:

```json
{
  "allow": [
    "Bash(npm *)",
    "Bash(node *)",
    "Bash(git status)",
    "Bash(git diff *)",
    "Bash(git log *)"
  ]
}
```

---

## Debugging Permissions

When a tool is blocked:

1. Claude reports permission denied
2. Check settings files for rules
3. Verify pattern syntax
4. Use `--verbose` for details

---

## Enterprise Permissions

For organizations, set machine-wide permissions:

**macOS:** `/Library/Application Support/ClaudeCode/settings.json`

These take precedence over user settings.

---

## Related Files

- [005_configuration_settings.md](./005_configuration_settings.md) - settings.json
- [009_hooks_overview.md](./009_hooks_overview.md) - Hooks
- [024_sdk_permissions.md](./024_sdk_permissions.md) - SDK permissions

---

*Last updated: December 2025*
