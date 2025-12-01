# Claude Code CLI - VS Code Integration

**Keywords:** VS Code, extension, IDE, Visual Studio Code, Cursor, Windsurf, VSCodium, diff, shortcuts

**Official Documentation:** https://docs.anthropic.com/en/docs/claude-code/ide-integrations

---

## Overview

The Claude Code VS Code extension provides a native graphical interface integrated directly into VS Code, Cursor, Windsurf, and VSCodium.

---

## Installation

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X / Ctrl+Shift+X)
3. Search "Claude Code" by Anthropic
4. Click Install

**Prerequisite:** Claude Code CLI must be installed separately.

---

## Key Features

| Feature | Description |
|---------|-------------|
| Real-time changes | See Claude's edits as they happen |
| Diff viewing | View changes in VS Code's diff viewer |
| Selection context | Share selected code with Claude |
| Diagnostics | Auto-share lint errors and warnings |
| Multiple sessions | Run concurrent Claude sessions |
| File references | Quick @-mention files |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Esc` (Mac) | Open Claude Code |
| `Ctrl+Esc` (Windows/Linux) | Open Claude Code |
| `Cmd+Option+K` (Mac) | Insert file reference |
| `Alt+Ctrl+K` (Windows/Linux) | Insert file reference |

---

## File References

Insert file references in prompts:

```
Look at @src/components/Button.tsx and improve the accessibility
```

With line numbers:
```
@src/utils/helper.ts#L10-50
```

Use the keyboard shortcut to quickly insert references.

---

## Selection Context

1. Select code in editor
2. Open Claude Code
3. Selected code is automatically included as context

---

## Diagnostics Sharing

The extension automatically shares:
- Lint errors
- Syntax errors
- TypeScript errors
- ESLint warnings

Claude sees these diagnostics and can help fix them.

---

## Diff Viewing

When Claude makes changes:
1. Changes appear in VS Code's diff viewer
2. Review additions (green) and deletions (red)
3. Accept or request modifications

---

## Multiple Sessions

Run multiple Claude sessions:
- Each session in separate panel
- Work on different tasks simultaneously
- Switch between sessions easily

---

## Extension Settings

Access via VS Code settings:

| Setting | Description |
|---------|-------------|
| `claude.autoStart` | Start Claude Code automatically |
| `claude.showDiffs` | Show diff view for changes |
| `claude.shareSelection` | Auto-share selected text |

---

## Supported Editors

| Editor | Supported |
|--------|-----------|
| Visual Studio Code | Yes |
| Cursor | Yes |
| Windsurf | Yes |
| VSCodium | Yes |

---

## Features Comparison: Extension vs CLI

| Feature | Extension | CLI |
|---------|-----------|-----|
| Graphical interface | Yes | No |
| Diff viewing | Native VS Code | Terminal |
| Selection sharing | Automatic | Manual copy |
| Diagnostics | Automatic | Manual |
| Session management | Visual | Commands |
| Keyboard shortcuts | IDE shortcuts | Terminal |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not working | Verify CLI is installed |
| No diff view | Check extension settings |
| Can't connect | Restart VS Code |
| Shortcuts not working | Check for conflicts |

---

## Tips

1. **Use selection context** - Select relevant code before asking questions
2. **Review diffs** - Always review changes before accepting
3. **Multiple sessions** - Use for parallel tasks
4. **File references** - Be specific with @-mentions

---

## Related Files

- [013_ide_jetbrains.md](./013_ide_jetbrains.md) - JetBrains integration
- [001_installation.md](./001_installation.md) - CLI installation
- [003_cli_commands.md](./003_cli_commands.md) - CLI commands

---

*Last updated: December 2025*
