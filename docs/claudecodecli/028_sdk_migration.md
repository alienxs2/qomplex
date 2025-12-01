# Claude Agent SDK - Migration Guide

**Keywords:** migration, upgrade, claude-code-sdk, claude-agent-sdk, breaking changes, imports, settings

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/sdk/migration-guide

---

## Overview

The Claude Code SDK has been renamed to Claude Agent SDK. This guide covers migration from the old package to the new one.

---

## Package Changes

| Old Package | New Package |
|-------------|-------------|
| `@anthropic-ai/claude-code` | `@anthropic-ai/claude-agent-sdk` |
| `claude-code-sdk` (Python) | `claude-agent-sdk` |

---

## TypeScript Migration

### 1. Update package.json

```diff
{
  "dependencies": {
-   "@anthropic-ai/claude-code": "^0.x.x"
+   "@anthropic-ai/claude-agent-sdk": "^1.x.x"
  }
}
```

### 2. Update Imports

```diff
- import { query, ClaudeCodeOptions } from '@anthropic-ai/claude-code';
+ import { query, ClaudeAgentOptions } from '@anthropic-ai/claude-agent-sdk';
```

### 3. Update Type Names

```diff
- const options: ClaudeCodeOptions = {
+ const options: ClaudeAgentOptions = {
    maxTurns: 10
  };
```

---

## Python Migration

### 1. Update Requirements

```diff
# requirements.txt
- claude-code-sdk>=0.1.0
+ claude-agent-sdk>=1.0.0
```

### 2. Update Imports

```diff
- from claude_code_sdk import query, ClaudeCodeOptions
+ from claude_agent_sdk import query, ClaudeAgentOptions
```

### 3. Update Class Names

```diff
- options = ClaudeCodeOptions(
+ options = ClaudeAgentOptions(
      max_turns=10
  )
```

---

## Behavioral Changes

### Settings Loading

**Old behavior:** Project settings (`.claude/settings.json`, `CLAUDE.md`) loaded automatically.

**New behavior:** Project settings NOT loaded by default.

### Migration

```typescript
// TypeScript - explicitly load project settings
const result = await query({
  prompt: "Task",
  options: {
    settingSources: ['project']  // Add this line
  }
});
```

```python
# Python - explicitly load project settings
options = ClaudeAgentOptions(
    setting_sources=["project"]  # Add this line
)
```

---

## API Changes Summary

| Old | New | Notes |
|-----|-----|-------|
| `ClaudeCodeOptions` | `ClaudeAgentOptions` | Type rename |
| `claude_code_sdk` | `claude_agent_sdk` | Module rename |
| Auto-load settings | Manual opt-in | Add `settingSources` |

---

## Full Migration Example

### Before (Old SDK)

```typescript
import { query, ClaudeCodeOptions } from '@anthropic-ai/claude-code';

const options: ClaudeCodeOptions = {
  maxTurns: 20,
  allowedTools: ['Read', 'Write']
};

const result = await query({
  prompt: "Update the config",
  options
});
```

### After (New SDK)

```typescript
import { query, ClaudeAgentOptions } from '@anthropic-ai/claude-agent-sdk';

const options: ClaudeAgentOptions = {
  maxTurns: 20,
  allowedTools: ['Read', 'Write'],
  settingSources: ['project']  // If you need project settings
};

const result = await query({
  prompt: "Update the config",
  options
});
```

---

## Python Full Example

### Before

```python
from claude_code_sdk import query, ClaudeCodeOptions

options = ClaudeCodeOptions(
    max_turns=20,
    allowed_tools=['Read', 'Write']
)

result = await query(prompt="Update the config", options=options)
```

### After

```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    max_turns=20,
    allowed_tools=['Read', 'Write'],
    setting_sources=['project']  # If you need project settings
)

result = await query(prompt="Update the config", options=options)
```

---

## Troubleshooting

### Import Errors

If you see `ModuleNotFoundError` or `Cannot find module`:

1. Uninstall old package:
   ```bash
   # TypeScript
   npm uninstall @anthropic-ai/claude-code

   # Python
   pip uninstall claude-code-sdk
   ```

2. Install new package:
   ```bash
   # TypeScript
   npm install @anthropic-ai/claude-agent-sdk

   # Python
   pip install claude-agent-sdk
   ```

### Settings Not Loading

If CLAUDE.md or project settings aren't being applied:

```typescript
// Ensure you've added settingSources
options: {
  settingSources: ['project']
}
```

---

## Version Compatibility

| Old Version | New Version | Migration Required |
|-------------|-------------|-------------------|
| 0.x.x | 1.x.x | Yes |

---

## Related Files

- [020_sdk_overview.md](./020_sdk_overview.md) - SDK overview
- [021_sdk_typescript.md](./021_sdk_typescript.md) - TypeScript reference
- [022_sdk_python.md](./022_sdk_python.md) - Python reference

---

*Last updated: December 2025*
