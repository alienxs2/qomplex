# Claude Code CLI - Installation

**Keywords:** install, npm, curl, setup, Node.js, requirements, Windows, WSL, macOS, Linux, Ubuntu

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/setup

---

## System Requirements

| Requirement | Specification |
|-------------|---------------|
| **OS** | macOS 10.15+, Ubuntu 20.04+/Debian 10+, Windows 10+ (WSL) |
| **RAM** | 4GB minimum |
| **Node.js** | 18+ (only for npm installation) |
| **Network** | Internet connection required |

---

## Installation Methods

### Method 1: Native Binary (Recommended)

No Node.js required. Most stable option.

**macOS / Linux / WSL:**

```bash
# Stable version (default)
curl -fsSL https://claude.ai/install.sh | bash

# Latest version
curl -fsSL https://claude.ai/install.sh | bash -s latest

# Specific version
curl -fsSL https://claude.ai/install.sh | bash -s 1.0.58
```

### Method 2: NPM

Requires Node.js 18+.

```bash
npm install -g @anthropic-ai/claude-code
```

**Important:** Do NOT use `sudo` with npm - it causes permission issues.

---

## Windows Installation

Windows requires WSL (Windows Subsystem for Linux).

1. Install WSL2:
   ```powershell
   wsl --install
   ```

2. Open WSL terminal and run:
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   ```

Native Windows installation is NOT supported.

---

## Alpine Linux / musl-based Systems

Additional dependencies required:

```bash
apk add libgcc libstdc++ ripgrep
export USE_BUILTIN_RIPGREP=0
```

---

## Fixing NPM Permission Issues (Linux)

Configure user-level npm to avoid sudo:

```bash
# Create user npm directory
mkdir ~/.npm-global

# Configure npm to use it
npm config set prefix '~/.npm-global'

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=~/.npm-global/bin:$PATH

# Reload shell
source ~/.bashrc
```

---

## Verify Installation

```bash
# Check version
claude --version

# Run diagnostics
claude doctor
```

---

## Updating Claude Code

### Native Binary

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### NPM

```bash
npm update -g @anthropic-ai/claude-code
```

---

## Uninstalling

### Native Binary

```bash
rm -rf ~/.claude
rm $(which claude)
```

### NPM

```bash
npm uninstall -g @anthropic-ai/claude-code
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Command not found | Restart terminal or re-add to PATH |
| Permission denied | Don't use sudo; fix npm permissions |
| Node.js too old | Upgrade to Node.js 18+ |
| WSL issues | Ensure WSL2 is properly installed |

Run `claude doctor` to auto-detect and suggest fixes for most issues.

---

## Related Files

- [002_authentication.md](./002_authentication.md) - Authentication setup
- [003_cli_commands.md](./003_cli_commands.md) - CLI commands
- [004_cli_flags.md](./004_cli_flags.md) - CLI flags

---

*Last updated: December 2025*
