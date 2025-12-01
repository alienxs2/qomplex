# Claude Code CLI - JetBrains Integration

**Keywords:** JetBrains, IntelliJ, WebStorm, PyCharm, plugin, IDE, diff, shortcuts

**Official Documentation:** https://code.claude.com/docs/en/jetbrains

---

## Overview

Claude Code integrates with JetBrains IDEs through a dedicated plugin, providing features like interactive diff viewing and selection context sharing.

---

## Supported IDEs

| IDE | Supported |
|-----|-----------|
| IntelliJ IDEA | Yes |
| WebStorm | Yes |
| PyCharm | Yes |
| PhpStorm | Yes |
| RubyMine | Yes |
| GoLand | Yes |
| CLion | Yes |
| Rider | Yes |
| DataGrip | Yes |

---

## Installation

1. Open your JetBrains IDE
2. Go to Settings/Preferences → Plugins
3. Search "Claude Code" in Marketplace
4. Click Install
5. Restart IDE

**Prerequisite:** Claude Code CLI must be installed separately.

---

## Key Features

| Feature | Description |
|---------|-------------|
| Quick launch | Keyboard shortcut to open Claude |
| Diff viewing | Native IDE diff viewer |
| Selection sharing | Share selected code |
| File references | Quick file mentions |
| Diagnostics | Share IDE warnings/errors |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Esc` (Mac) | Open Claude Code |
| `Ctrl+Esc` (Windows/Linux) | Open Claude Code |

---

## Selection Context

1. Select code in editor
2. Press shortcut to open Claude Code
3. Selected code is automatically shared

---

## Diff Viewing

When Claude modifies files:
- Changes appear in JetBrains diff viewer
- Side-by-side comparison
- Accept or reject changes

---

## File References

Reference files in prompts:

```
Look at @src/main/java/App.java and optimize
```

Use keyboard shortcut to insert file references with line numbers.

---

## Diagnostics

The plugin shares:
- Compiler errors
- IDE inspections
- Lint warnings
- Type errors

Claude can help resolve these issues.

---

## JetBrains AI Assistant Integration

Separate from the plugin, Claude Agent is also available in JetBrains AI Assistant:

| Feature | Claude Code Plugin | JetBrains AI Assistant |
|---------|-------------------|------------------------|
| Provider | Anthropic (direct) | JetBrains subscription |
| Billing | Claude/API | JetBrains AI |
| Integration | Plugin | Built-in |
| Features | Full CLI access | AI Assistant features |

---

## Plugin Settings

Access via Settings → Tools → Claude Code:

| Setting | Description |
|---------|-------------|
| Auto-connect | Connect on IDE start |
| Diff mode | How to show changes |
| Share diagnostics | Auto-share errors |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Plugin not loading | Check CLI installation |
| No connection | Restart IDE |
| Diff not showing | Check plugin settings |
| Shortcuts conflict | Remap in Keymap settings |

---

## Tips

1. **Use selection** - Select relevant code before opening Claude
2. **Review diffs** - Always review before accepting changes
3. **Share context** - Include error messages in prompts
4. **Use references** - @-mention specific files

---

## Related Files

- [012_ide_vscode.md](./012_ide_vscode.md) - VS Code integration
- [001_installation.md](./001_installation.md) - CLI installation
- [003_cli_commands.md](./003_cli_commands.md) - CLI commands

---

*Last updated: December 2025*
