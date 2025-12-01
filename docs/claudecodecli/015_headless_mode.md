# Claude Code CLI - Headless Mode

**Keywords:** headless, -p, --print, CI/CD, automation, non-interactive, JSON, stream-json, scripting, pipelines

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/headless

---

## Overview

Headless mode runs Claude Code non-interactively for automation, CI/CD pipelines, scripts, and batch processing.

---

## Basic Usage

```bash
# Simple query, print result and exit
claude -p "What files are in src/"

# With prompt flag (equivalent)
claude --print "Analyze this function"
```

---

## Output Formats

| Format | Flag | Description |
|--------|------|-------------|
| Text | `--output-format text` | Plain text (default) |
| JSON | `--output-format json` | JSON with metadata |
| Stream JSON | `--output-format stream-json` | Streaming events |

### Text Output (Default)

```bash
claude -p "List files"
# Output: Plain text response
```

### JSON Output

```bash
claude -p "Analyze code" --output-format json
```

Response:
```json
{
  "result": "Analysis text...",
  "cost_usd": 0.0123,
  "session_id": "abc123",
  "model": "claude-sonnet-4-5-20250929"
}
```

### Stream JSON

```bash
claude -p "Complex task" --output-format stream-json
```

Outputs JSON events as they arrive:
```json
{"type": "assistant_message", "content": "Starting..."}
{"type": "tool_use", "name": "Read", "input": {...}}
{"type": "tool_result", "output": "..."}
{"type": "assistant_message", "content": "Done"}
```

---

## Parsing JSON with jq

```bash
# Extract result
result=$(claude -p "Generate code" --output-format json)
code=$(echo "$result" | jq -r '.result')
cost=$(echo "$result" | jq -r '.cost_usd')

echo "Generated code: $code"
echo "Cost: $cost USD"
```

---

## CI/CD Examples

### GitHub Actions

```yaml
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Claude Code
        run: curl -fsSL https://claude.ai/install.sh | bash

      - name: Analyze PR
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "Review the changes in this PR for security issues" \
            --output-format json > analysis.json
```

### GitLab CI

```yaml
analyze:
  script:
    - curl -fsSL https://claude.ai/install.sh | bash
    - claude -p "Check for code quality issues" --output-format json
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

staged_files=$(git diff --cached --name-only)

if [ -n "$staged_files" ]; then
  result=$(claude -p "Review these files for issues: $staged_files" --output-format json)
  echo "$result" | jq -r '.result'
fi
```

---

## Script Examples

### Batch Analysis

```bash
#!/bin/bash

for file in src/*.ts; do
  echo "Analyzing: $file"
  claude -p "Analyze $file for potential bugs" --output-format json >> results.json
done
```

### Code Generation Pipeline

```bash
#!/bin/bash

# Generate code
claude -p "Generate a utility function for date formatting" \
  --output-format json > output.json

# Extract and save
jq -r '.result' output.json > src/utils/dateFormat.ts

# Verify
npm run typecheck
```

---

## Flags for Headless Mode

| Flag | Purpose |
|------|---------|
| `-p "prompt"` | Enable headless mode |
| `--output-format` | Output format |
| `--model` | Specify model |
| `--max-turns` | Limit turns |
| `--verbose` | Debug output |

---

## Combining Options

```bash
# Complex automation
claude -p "Refactor auth module" \
  --model opus \
  --output-format json \
  --max-turns 20 \
  > refactor-result.json
```

---

## System Prompts in Headless

```bash
# Add custom instructions
claude -p "Review code" \
  --append-system-prompt "Focus on security vulnerabilities"

# Replace system prompt
claude -p "Generate SQL" \
  --system-prompt "You are a SQL expert"
```

---

## Error Handling

```bash
#!/bin/bash

result=$(claude -p "Perform task" --output-format json 2>&1)
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Error: $result"
  exit 1
fi

echo "Success: $(echo $result | jq -r '.result')"
```

---

## Limitations

| Limitation | Note |
|------------|------|
| No persistence | Each run is independent |
| No interactivity | Cannot ask follow-ups |
| Timeout | Commands may timeout on long tasks |

---

## Best Practices

1. **Use JSON format** - For parseable output
2. **Handle errors** - Check exit codes
3. **Set timeouts** - Prevent hanging
4. **Use specific prompts** - Clear, actionable requests
5. **Log output** - For debugging pipelines

---

## Related Files

- [004_cli_flags.md](./004_cli_flags.md) - CLI flags
- [003_cli_commands.md](./003_cli_commands.md) - CLI commands
- [002_authentication.md](./002_authentication.md) - Authentication

---

*Last updated: December 2025*
