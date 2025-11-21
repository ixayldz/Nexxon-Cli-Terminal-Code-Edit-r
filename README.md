# Nexxon CLI - Quick Start Guide

## Prerequisites

- Node.js 20.x or later
- **At least ONE LLM API key:**
  - OpenAI API key for GPT-5.1 ([Get key](https://platform.openai.com/api-keys))
  - Anthropic API key for Claude 4.5 Sonnet ([Get key](https://console.anthropic.com/settings/keys))
  - Google API key for Gemini 3.0 Pro ([Get key](https://aistudio.google.com/app/apikey))

## Installation

```bash
# Install dependencies
npm install

# Set up environment - Choose at least ONE provider:

# Option 1: OpenAI GPT-5.1 (Latest Flagship Model)
export OPENAI_API_KEY="your-openai-api-key-here"

# Option 2: Anthropic Claude 4.5 Sonnet
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Option 3: Google Gemini 3.0 Pro
export GEMINI_API_KEY="your-gemini-api-key-here"

# Windows PowerShell:
# $env:OPENAI_API_KEY="your-api-key"
# $env:ANTHROPIC_API_KEY="your-api-key"
# $env:GEMINI_API_KEY="your-api-key"

# You can set multiple keys to use different providers

# GPT-5.1 Advanced Options (optional):
# export NEXXON_REASONING_EFFORT=none    # none|low|medium|high (default: none)
# export NEXXON_VERBOSITY=medium         # low|medium|high (default: medium)
```

## Running the System

### 1. Start the Runtime Server

```bash
# In terminal 1
npm run dev:runtime

# Server will start on http://127.0.0.1:7777
```

### 2. Use the CLI

```bash
# In terminal 2

# Check identity
npm run dev:cli -- whoami

# Tip: if you start runtime on a non-default port
# (e.g., NEXXON_PORT=7788), point CLI to it via env:
#   Windows PowerShell
#   $env:NEXXON_PORT=7788; npm run dev:cli -- whoami
#   macOS/Linux
#   NEXXON_PORT=7788 npm run dev:cli -- whoami

# Tip: force JSON output via env (useful on Windows if --json is not forwarded)
#   $env:NEXXON_JSON=1; npm run dev:cli -- whoami

# Index current directory
npm run dev:cli -- init

# Create a plan
npm run dev:cli -- plan "add a new feature to calculate fibonacci"

# Generate diff for a file
npm run dev:cli -- diff --task "add error handling" --file src/example.ts

# Run tests
npm run dev:cli -- test --cmd "npm test"
```

## Available Commands

### Core Commands

- `init` - Index repository (respects .gitignore)
- `search <query>` - Search codebase
- `plan <task>` - Generate implementation plan
- `diff` - Generate code changes
- `apply` - Apply changes to files
- `test` - Run test command
- `log` - View audit logs
- `whoami` - Show identity and policy
- `undo` - Revert last changes
- `iterate` - Simple loop: diff -> apply -> test (max N)

### Global Flags

- `--validate-policy` - Validate policy before execution
- `--admin-override <reason>` - Admin override (requires RBAC)

## Example Workflow

```bash
# 1. Plan a feature
npm run dev:cli -- plan "add user authentication"

# 2. Generate code for specific file
npm run dev:cli -- diff --task "implement login function" --file src/auth.ts

# 3. Apply changes (with dry-run first)
npm run dev:cli -- apply --file src/auth.ts --content "..." --dry-run

# 4. Run tests
npm run dev:cli -- test --cmd "npm test"

# 5. Check audit log
npm run dev:cli -- log

# 6. Try simple iteration (P1 loop)
npm run dev:cli -- iterate --task "fix failing login tests" --file src/auth.ts --test-cmd "npm test" --max-loops 2
```

## Configuration

### policy.yaml

Controls security and operational policies:

```yaml
version: 1
scope:
  fs:
    allow: ["./", "./src", "./tests"]
    deny: ["../", "/"]
  network:
    outbound: ["api.openai.com"]
  exec:
    allow: ["git", "npm", "node"]
    confirm: ["npm install"]
limits:
  tokens_per_session: 200000
```

### providers.yaml

Configures knowledge providers:

```yaml
knowledge:
  allow_external_web: false
  docs:
    sources: [mdn, devdocs]
  registries:
    npm: true
    pypi: true
```

## Troubleshooting

### Runtime server won't start

- Check if port 7777 is already in use
- Set custom port: `NEXXON_PORT=8888 npm run dev:runtime`

### LLM calls fail

- Verify `OPENAI_API_KEY` is set
- Check network connectivity
- Review audit logs: `npm run dev:cli -- log`


## Configuration

### policy.yaml

Controls security and operational policies:

```yaml
version: 1
scope:
  fs:
    allow: ["./", "./src", "./tests"]
    deny: ["../", "/"]
  network:
    outbound: ["api.openai.com"]
  exec:
    allow: ["git", "npm", "node"]
    confirm: ["npm install"]
limits:
  tokens_per_session: 200000
```

### providers.yaml

Configures knowledge providers:

```yaml
knowledge:
  allow_external_web: false
  docs:
    sources: [mdn, devdocs]
  registries:
    npm: true
    pypi: true
```

## Troubleshooting

### Runtime server won't start

- Check if port 7777 is already in use
- Set custom port: `NEXXON_PORT=8888 npm run dev:runtime`

### LLM calls fail

- Verify `OPENAI_API_KEY` is set
- Check network connectivity
- Review audit logs: `npm run dev:cli -- log`

### Permission errors

- Check `policy.yaml` settings
- Ensure file paths are in allowed scope
- Use `--admin-override` if needed (with caution)

## Development

```bash
# Run validation
npm run validate

# Build all packages
npm run build

# Lint code
npm run lint

# Run tests
npm test
```

## Packaging & Distribution

### Docker

Build and run Nexxon in a container:

```bash
# Build Docker image
docker build -t nexxon/cli .

# Run Nexxon CLI
docker run nexxon/cli --version
docker run -v $(pwd):/workspace nexxon/cli plan "add feature"
```

### Single Binary

Create standalone executables for distribution:

```bash
# Build binaries for all platforms
node scripts/build-binaries.mjs

# Outputs to dist-binaries/:
#   nexxon-linux-x64
#   nexxon-linux-arm64
#   nexxon-macos-x64
#   nexxon-macos-arm64
#   nexxon-win-x64.exe
```

## Benchmarking

Run performance benchmarks per PRD Section 17:

```bash
# Build benchmark package
npm run build

# Run benchmark suite
cd packages/benchmark
npm run benchmark

# View results in artifacts/benchmark-report.json
```

Metrics measured:
- Time to first valid diff
- Time to passing tests
- Number of iterations
- Diff acceptance rate (target: >= 80%)
- Test success rate (target: >= 95%)

## CI/CD Integration

### Initialize CI Workflow

```bash
# Generate GitHub Actions workflow
nexxon ci init --provider github

# Generate GitLab CI config
nexxon ci init --provider gitlab
```

### Run in CI

```bash
# Dry-run analysis (no changes applied)
nexxon ci run --task "analyze PR changes" --dry-run

# Annotate PR with results
nexxon ci annotate --from artifacts/report.json --provider github
```

See `.github/workflows/nexxon.yml` for example integration.

## Next Steps

- Configure your `policy.yaml` for your project
- Set up CI/CD hooks
- Run benchmarks to validate performance
- Explore multi-agent features (coming in Phase 2)
- Join the community at https://github.com/nexxon-cli

## Support

- Documentation: https://nexxon.dev/docs
- Issues: https://github.com/nexxon-cli/nexxon/issues
- Discord: https://discord.gg/nexxon
