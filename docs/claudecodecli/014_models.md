# Claude Code CLI - Model Configuration

**Keywords:** models, Opus, Sonnet, Haiku, --model, /model, ANTHROPIC_MODEL, opusplan, extended context

**Official Documentation:** https://code.claude.com/docs/en/model-config

---

## Available Models

| Model | Best For | Cost | Speed |
|-------|----------|------|-------|
| **Opus** | Complex reasoning, architecture | Highest | Slowest |
| **Sonnet** | Daily development, balanced | Medium | Medium |
| **Haiku** | Simple tasks, high frequency | Lowest | Fastest |

---

## Model Selection Methods

### 1. Command Line Flag

```bash
# Full model name
claude --model claude-opus-4-5-20251101

# Shorthand
claude --model opus
claude --model sonnet
claude --model haiku
```

### 2. Interactive Command

```
/model opus
/model sonnet
/model haiku
/model claude-opus-4-5-20251101
```

### 3. Environment Variable

```bash
# Add to ~/.bashrc or ~/.zshrc
export ANTHROPIC_MODEL="claude-sonnet-4-5-20250929"
```

### 4. Config Command

```bash
# Set default model
claude config set model claude-haiku-4-5

# View current model
claude config get model
```

---

## Model Names Reference

| Shorthand | Full Name |
|-----------|-----------|
| `opus` | `claude-opus-4-5-20251101` |
| `sonnet` | `claude-sonnet-4-5-20250929` |
| `haiku` | `claude-haiku-4-5` |

---

## Model Recommendations

| Task Type | Recommended Model |
|-----------|-------------------|
| Architecture decisions | Opus |
| Complex debugging | Opus |
| Code reviews | Sonnet |
| Feature implementation | Sonnet |
| Security/auth work | Sonnet |
| Simple scripts | Haiku |
| File operations | Haiku |
| Quick questions | Haiku |

---

## Opusplan Mode

Combines Opus reasoning with Sonnet execution:

- **Planning**: Opus for architectural decisions
- **Implementation**: Sonnet for code generation

Best of both worlds with optimized cost.

---

## Extended Context (1M Tokens)

For Console/API users, enable 1 million token context:

```
/model anthropic.claude-sonnet-4-5-20250929-v1:0[1m]
```

Add `[1m]` suffix to model name.

**Note:** Extended context has different pricing.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_MODEL` | Default model |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Haiku alias target |

---

## Switching Models Mid-Session

```
/model haiku
```

Switch models anytime during a session. Useful for:
- Quick questions → Haiku
- Complex analysis → Opus

---

## Cost Considerations

| Model | Input | Output |
|-------|-------|--------|
| Opus | $15/M | $75/M |
| Sonnet | $3/M | $15/M |
| Haiku | $0.25/M | $1.25/M |

*Approximate pricing, check official docs for current rates.*

---

## Model Selection Strategy

```
Start with Sonnet (default)
    │
    ├── Simple task? → Switch to Haiku
    │
    └── Complex task? → Switch to Opus
```

---

## Checking Current Model

```
/model
```

Shows currently active model.

---

## Related Files

- [003_cli_commands.md](./003_cli_commands.md) - CLI commands
- [004_cli_flags.md](./004_cli_flags.md) - CLI flags
- [005_configuration_settings.md](./005_configuration_settings.md) - Configuration

---

*Last updated: December 2025*
