# Claude Code CLI - Slash Commands

**Keywords:** slash commands, custom commands, /project, /user, markdown, $ARGUMENTS, automation, prompts

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/slash-commands

---

## Overview

Slash commands are reusable prompts stored as Markdown files. They help standardize common tasks and workflows.

---

## Command Types

| Type | Location | Prefix | Scope |
|------|----------|--------|-------|
| Project | `.claude/commands/` | `/project:` | Team (via git) |
| Personal | `~/.claude/commands/` | `/user:` | All your projects |
| MCP | MCP servers | `/mcp:` | Dynamic |
| Built-in | Claude Code | `/` | Global |

---

## Creating Commands

### Project Command

Create `.claude/commands/fix-issue.md`:

```markdown
Fix GitHub issue #$ARGUMENTS

1. Read the issue description
2. Understand the problem
3. Find relevant code
4. Implement the fix
5. Write tests
6. Create a descriptive commit
```

Use: `/project:fix-issue 1234`

### Personal Command

Create `~/.claude/commands/review.md`:

```markdown
Review the code changes for:
- Potential bugs
- Performance issues
- Security concerns
- Code style violations

Provide a summary with specific recommendations.
```

Use: `/user:review`

---

## Arguments

Use `$ARGUMENTS` placeholder for user input:

```markdown
# .claude/commands/search.md
Search the codebase for: $ARGUMENTS

Find all occurrences and explain each usage.
```

Usage:
```
/project:search authentication
```

Becomes:
```
Search the codebase for: authentication

Find all occurrences and explain each usage.
```

---

## Directory Structure

Subdirectories create namespaces:

```
.claude/commands/
├── fix-issue.md           → /project:fix-issue
├── review.md              → /project:review
├── test/
│   ├── unit.md            → /project:test/unit
│   └── integration.md     → /project:test/integration
└── docs/
    └── generate.md        → /project:docs/generate
```

---

## Example Commands

### Code Review

`.claude/commands/review-pr.md`:
```markdown
Review the changes for PR #$ARGUMENTS

1. Fetch PR details and diff
2. Analyze code changes
3. Check for:
   - Breaking changes
   - Security issues
   - Missing tests
   - Documentation updates needed
4. Provide constructive feedback
```

### Generate Documentation

`.claude/commands/document.md`:
```markdown
Generate documentation for: $ARGUMENTS

Include:
- Description
- Parameters/Props
- Return values
- Usage examples
- Edge cases
```

### Refactor

`.claude/commands/refactor.md`:
```markdown
Refactor the following code: $ARGUMENTS

Goals:
- Improve readability
- Reduce complexity
- Follow project conventions
- Maintain functionality

Explain each change made.
```

### Test Generator

`.claude/commands/test.md`:
```markdown
Generate tests for: $ARGUMENTS

Requirements:
- Unit tests with Jest
- Cover happy path and edge cases
- Mock external dependencies
- Include descriptive test names
```

---

## Listing Commands

View available commands:

```
/help
```

Project commands show "(project)", personal show "(user)".

---

## MCP-Provided Commands

MCP servers can expose prompts as slash commands:

```
/mcp:server-name:command-name
```

These are discovered dynamically from connected MCP servers.

---

## Command Best Practices

1. **Be specific** - Include detailed instructions
2. **Use placeholders** - `$ARGUMENTS` for flexibility
3. **Structure output** - Tell Claude what format you expect
4. **Include context** - Reference relevant files or conventions
5. **Version control** - Commit project commands to git

---

## Complex Command Example

`.claude/commands/feature.md`:
```markdown
Implement new feature: $ARGUMENTS

## Process

1. **Understand Requirements**
   - Clarify any ambiguities
   - Identify affected areas

2. **Design**
   - Plan the implementation
   - Consider edge cases
   - Note any dependencies

3. **Implement**
   - Write clean, tested code
   - Follow existing patterns
   - Add necessary types

4. **Test**
   - Unit tests for new code
   - Integration tests if needed
   - Manual verification steps

5. **Document**
   - Update relevant docs
   - Add code comments where needed

6. **Review**
   - Self-review the changes
   - Prepare PR description

## Output
Provide a summary of changes made.
```

---

## Related Files

- [003_cli_commands.md](./003_cli_commands.md) - CLI commands
- [006_claudemd_memory.md](./006_claudemd_memory.md) - CLAUDE.md
- [007_mcp_servers.md](./007_mcp_servers.md) - MCP servers

---

*Last updated: December 2025*
