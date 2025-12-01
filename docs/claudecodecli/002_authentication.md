# Claude Code CLI - Authentication

**Keywords:** authentication, API key, OAuth, login, ANTHROPIC_API_KEY, Bedrock, Vertex, Pro, Max, Console

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/setup

---

## Authentication Options

| Method | Description | Best For |
|--------|-------------|----------|
| OAuth (Claude Console) | Browser-based login | Individual developers |
| API Key | Environment variable | CI/CD, automation |
| Amazon Bedrock | AWS integration | Enterprise AWS users |
| Google Vertex AI | GCP integration | Enterprise GCP users |
| Pro/Max Plan | Unified subscription | Consumers |

---

## Method 1: OAuth via Claude Console (Default)

1. Start Claude Code:
   ```bash
   claude
   ```

2. Follow the browser prompt to authenticate

3. Complete OAuth flow in Claude Console

**Requirements:**
- Active billing at [console.anthropic.com](https://console.anthropic.com)

---

## Method 2: API Key

### Get API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Navigate to API Keys
3. Create new key

### Set Environment Variable

**Temporary (current session):**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Permanent (add to shell config):**

```bash
# ~/.bashrc or ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-..."
```

Then reload:
```bash
source ~/.bashrc
```

---

## Method 3: Amazon Bedrock

For AWS enterprise users:

```bash
export CLAUDE_CODE_USE_BEDROCK=1
```

Requires:
- AWS credentials configured
- Bedrock access enabled
- Claude model access granted

---

## Method 4: Google Vertex AI

For GCP enterprise users:

```bash
export CLAUDE_CODE_USE_VERTEX=1
```

Requires:
- GCP credentials configured
- Vertex AI API enabled
- Claude model access granted

---

## Method 5: Pro/Max Subscription

Claude Pro or Max plan includes Claude Code access.

1. Subscribe at [claude.com](https://claude.com)
2. Start Claude Code
3. Log in with your Claude account

---

## Checking Authentication Status

```bash
# Start Claude Code and check connection
claude

# Run diagnostics
claude doctor
```

---

## Multiple Accounts

Switch between accounts:

```bash
# Log out current account
claude logout

# Log in with different account
claude
```

---

## Environment Variables Reference

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | API key authentication |
| `CLAUDE_CODE_USE_BEDROCK` | Enable Bedrock (set to `1`) |
| `CLAUDE_CODE_USE_VERTEX` | Enable Vertex AI (set to `1`) |

---

## Security Best Practices

1. **Never commit API keys** - Use environment variables or secrets managers
2. **Rotate keys regularly** - Create new keys periodically
3. **Use minimal permissions** - Create keys with limited scope when possible
4. **Monitor usage** - Check Console for unexpected activity

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Authentication failed | Check API key is valid and has credits |
| OAuth loop | Clear browser cookies, try incognito |
| Bedrock access denied | Verify AWS credentials and model access |
| Rate limited | Check usage limits in Console |

---

## Related Files

- [001_installation.md](./001_installation.md) - Installation
- [003_cli_commands.md](./003_cli_commands.md) - CLI commands
- [015_headless_mode.md](./015_headless_mode.md) - CI/CD automation

---

*Last updated: December 2025*
