# Claude Code CLI - CLAUDE.md Memory System

**Keywords:** CLAUDE.md, memory, context, instructions, persistent, hierarchy, @import, project context

**Official Documentation:** https://code.claude.com/docs/en/memory

---

## Overview

CLAUDE.md files provide persistent memory and instructions that are automatically loaded into Claude Code's context. They become part of the system prompt.

---

## File Locations

| Location | Scope | Purpose |
|----------|-------|---------|
| `~/.claude/CLAUDE.md` | User | Personal instructions for all projects |
| `CLAUDE.md` | Project root | Team-shared project context |
| `.claude/CLAUDE.md` | Project | Alternative project location |
| Parent directories | Monorepo | Inherited by subdirectories |

**Enterprise:** `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS)

---

## Loading Hierarchy

Files are loaded in this order (earlier = higher precedence):

1. Enterprise CLAUDE.md
2. User `~/.claude/CLAUDE.md`
3. Parent directory CLAUDE.md files
4. Project root CLAUDE.md
5. `.claude/CLAUDE.md`

---

## CLAUDE.md vs settings.json

| Aspect | CLAUDE.md | settings.json |
|--------|-----------|---------------|
| Purpose | Instructions & context | Application behavior |
| Format | Markdown | JSON |
| Content | Guidelines, conventions | Permissions, env vars |
| Loaded as | System prompt | Configuration |

---

## Basic CLAUDE.md Example

```markdown
# Project Guidelines

## Tech Stack
- TypeScript with strict mode
- React 18 with hooks
- Jest for testing

## Code Style
- Use 2-space indentation
- Prefer const over let
- Use async/await over promises

## Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Important Files
- Entry point: `src/index.ts`
- Config: `src/config.ts`
- Types: `src/types/`
```

---

## Importing Other Files

Use `@` syntax to include other files:

```markdown
# Project Context

@docs/architecture.md
@docs/api-reference.md
@.claude/conventions.md
```

Paths are relative to the CLAUDE.md file location.

---

## Best Practices

### Be Specific

```markdown
# Good
- Use 2-space indentation
- Functions should be under 50 lines
- Always handle errors with try/catch

# Bad
- Format code properly
- Keep functions small
- Handle errors
```

### Use Structure

```markdown
# Project: MyApp

## Overview
Brief description of the project.

## Architecture
- Frontend: React SPA
- Backend: Node.js API
- Database: PostgreSQL

## Conventions
### Naming
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### File Organization
- Components in `src/components/`
- Utilities in `src/utils/`
- Types in `src/types/`
```

### Include Commands

```markdown
## Development Commands
- Start dev server: `npm run dev`
- Run tests: `npm test`
- Build production: `npm run build`
- Database migrations: `npm run migrate`
```

---

## User-Level CLAUDE.md

Personal instructions in `~/.claude/CLAUDE.md`:

```markdown
# My Preferences

## Communication
- Explain changes briefly
- Use bullet points for lists

## Code Style
- I prefer functional programming
- Always add type annotations
- Include JSDoc comments

## Tools
- Use pnpm instead of npm
- Prefer Vitest over Jest
```

---

## Monorepo Setup

For monorepos, place CLAUDE.md at each level:

```
/repo
├── CLAUDE.md           # Shared conventions
├── packages/
│   ├── frontend/
│   │   └── CLAUDE.md   # Frontend-specific
│   └── backend/
│       └── CLAUDE.md   # Backend-specific
```

---

## Reviewing Memory

See what Claude knows:

```
/memory
```

This shows loaded CLAUDE.md contents.

---

## Updating Memory

Update CLAUDE.md files anytime. Changes apply to new sessions.

For current session, ask Claude:
```
Please re-read the CLAUDE.md file
```

---

## Context Management Tips

1. **Keep it concise** - Every line counts against context
2. **Prioritize** - Put most important info first
3. **Use imports** - Split large docs into focused files
4. **Update regularly** - Keep instructions current

---

## Related Files

- [005_configuration_settings.md](./005_configuration_settings.md) - settings.json
- [003_cli_commands.md](./003_cli_commands.md) - CLI commands
- [016_permissions.md](./016_permissions.md) - Permissions

---

*Last updated: December 2025*
