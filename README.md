# 🤖 Nexxon CLI

> AI-Powered Coding Assistant with Interactive Matrix-Themed Terminal UI

[![npm version](https://badge.fury.io/js/nexxon-cli.svg)](https://www.npmjs.com/package/nexxon-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/ixayldz/Nexxon-Cli-Terminal-Code-Edit-r?style=social)](https://github.com/ixayldz/Nexxon-Cli-Terminal-Code-Edit-r)

Nexxon CLI is a next-generation AI coding assistant that brings **GPT-5.1, Claude 4.5 Sonnet, and Gemini 3.0 Pro** to your terminal with a beautiful Matrix-themed interactive interface.

## ✨ Features

- 🎨 **Matrix-Themed UI** - Beautiful green terminal aesthetic with ASCII art
- 🤖 **Multi-LLM Support** - GPT-5.1, Claude 4.5, Gemini 3.0 Pro
- ⚡ **Slash Commands** - Quick actions with `/plan`, `/diff`, `/model`
- 💬 **Interactive REPL** - Natural language + command mode
- 🔮 **Auto-Completion** - Tab completion for commands and files
- 🚀 **Auto-Start Runtime** - No manual setup required
- 📦 **Global Installation** - One command to install
- ✅ **Production Ready** - Fully tested and documented

## 🚀 Quick Start

### Installation

```bash
npm install -g nexxon-cli
```

### Setup

Set up at least ONE API key:

```bash
# Option 1: OpenAI GPT-5.1
export OPENAI_API_KEY="sk-proj-..."

# Option 2: Anthropic Claude 4.5
export ANTHROPIC_API_KEY="sk-ant-..."

# Option 3: Google Gemini 3.0
export GEMINI_API_KEY="AIza..."
```

### Usage

```bash
nexxon  # Start interactive mode
```

## 🎯 Interactive Mode

```
╔══════════════════════════════════════════════════════════════╗
║   ███╗   ██╗███████╗██╗  ██╗██╗  ██╗ ██████╗ ███╗   ██╗    ║
║   ████╗  ██║██╔════╝╚██╗██╔╝╚██╗██╔╝██╔═══██╗████╗  ██║    ║
║   ██╔██╗ ██║█████╗   ╚███╔╝  ╚███╔╝ ██║   ██║██╔██╗ ██║    ║
║   ██║╚██╗██║██╔══╝   ██╔██╗  ██╔██╗ ██║   ██║██║╚██╗██║    ║
║   ██║ ╚████║███████╗██╔╝ ██╗██╔╝ ██╗╚██████╔╝██║ ╚████║    ║
║              AI-Powered Coding Assistant                    ║
╚══════════════════════════════════════════════════════════════╝

🤖 GPT-5.1 • Claude 4.5 • Gemini 3.0
⚡ Ready to code

nexxon> /help
```

## 📚 Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/plan <task>` | Create implementation plan |
| `/diff <file>` | Generate file diff |
| `/model [name]` | Switch/list LLM models |
| `/search <query>` | Search codebase |
| `/clear` | Clear screen |
| `/exit` | Exit application |

## 💡 Examples

### Create a Plan

```
nexxon> /plan add user authentication

✓ Plan created successfully
{
  "plan_steps": [
    "Create user model",
    "Add password hashing",
    "Implement JWT middleware"
  ]
}
```

### Switch Models

```
nexxon> /model claude-4-5-sonnet-20250514
✓ Switched to model: claude-4-5-sonnet-20250514
```

### Search Code

```
nexxon> /search authentication
```

## 🛠️ Classic CLI Mode

Backward compatible with traditional CLI:

```bash
nexxon init                         # Initialize repository
nexxon search "authentication"      # Search code
nexxon plan "add feature"          # Create plan
nexxon diff --file app.ts          # Generate diff
nexxon apply --file app.ts         # Apply changes
nexxon test --cmd "npm test"       # Run tests
nexxon whoami                      # Show identity
```

## 🤖 Supported Models

### OpenAI GPT-5.1
- Latest flagship model with Responses API
- Reasoning effort control (none/low/medium/high)
- Verbosity settings

### Anthropic Claude 4.5 Sonnet
- Advanced reasoning capabilities
- 200K context window
- Superior code generation

### Google Gemini 3.0 Pro
- Multimodal understanding
- 2M context window
- Fast inference

## 🔧 Configuration

### API Keys

Set via environment variables:

```bash
export OPENAI_API_KEY="..."
export ANTHROPIC_API_KEY="..."
export GEMINI_API_KEY="..."
```

Or create `.env` file:

```env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

### Advanced Options

```bash
export NEXXON_PORT=8888           # Custom runtime port
export NEXXON_JSON=1              # Force JSON output
export NEXXON_REASONING_EFFORT=high  # GPT-5.1 reasoning
export NEXXON_VERBOSITY=low       # Output verbosity
```

## 📖 Documentation

- [Full User Guide](https://github.com/ixayldz/Nexxon-Cli-Terminal-Code-Edit-r/blob/main/KULLANIM_KILAVUZU.md)
- [Changelog](https://github.com/ixayldz/Nexxon-Cli-Terminal-Code-Edit-r/blob/main/CHANGELOG.md)
- [API Documentation](https://github.com/ixayldz/Nexxon-Cli-Terminal-Code-Edit-r/blob/main/prd.md)

## 🏗️ Architecture

- **CLI:** Interactive REPL with slash commands
- **Runtime:** Fastify-based server with LLM orchestration
- **Providers:** Multi-provider support with circuit breakers
- **Policy:** RBAC, audit logging, network controls

## 🤝 Contributing

Contributions welcome! See [GitHub repository](https://github.com/ixayldz/Nexxon-Cli-Terminal-Code-Edit-r).

## 📄 License

MIT © 2025 Ayildiz

## 🔗 Links

- [GitHub](https://github.com/ixayldz/Nexxon-Cli-Terminal-Code-Edit-r)
- [NPM Package](https://www.npmjs.com/package/nexxon-cli)
- [Issues](https://github.com/ixayldz/Nexxon-Cli-Terminal-Code-Edit-r/issues)

---

**Made with ❤️ and Matrix green**
