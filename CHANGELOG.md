# Changelog

All notable changes to Nexxon CLI will be documented in this file.

## [1.0.0] - 2025-11-20

### Added
- 🎉 Initial release
- ✨ Interactive Matrix-themed terminal UI
- 🤖 Multi-provider LLM support (GPT-5.1, Claude 4.5 Sonnet, Gemini 3.0 Pro)
- ⚡ Slash commands (`/plan`, `/diff`, `/model`, `/search`, etc.)
- 🎨 ASCII art welcome screen
- 💬 REPL mode with command history
- 🔮 Auto-completion for commands and file paths
- 🚀 Runtime auto-start
- 📦 Global npm package installation
- ✅ Backward compatible classic CLI mode

### Features
- **LLM Providers:**
  - OpenAI GPT-5.1 with Responses API
  - Anthropic Claude 4.5 Sonnet
  - Google Gemini 3.0 Pro
  - Automatic provider selection and fallback

- **Interactive Mode:**
  - Matrix green color theme
  - Readline-based REPL
  - Tab auto-completion
  - Command history (100 entries)
  - Natural language support

- **Slash Commands:**
  - `/help` - Show available commands
  - `/plan <task>` - Create implementation plan
  - `/diff <file>` - Generate file diff
  - `/model [name]` - Switch LLM model
  - `/search <query>` - Search codebase
  - `/clear` - Clear screen
  - `/exit` - Exit application

- **Classic CLI:**
  - `nexxon init` - Initialize repository index
  - `nexxon search <query>` - Search codebase
  - `nexxon plan <task>` - Create implementation plan
  - `nexxon diff` - Generate unified diff
  - `nexxon apply` - Apply changes
  - `nexxon iterate` - Iterative development loop
  - `nexxon test` - Run tests
  - `nexxon whoami` - Show identity and policy
  - `nexxon undo` - Revert changes
  - `nexxon ci` - CI/CD integration

### Technical
- TypeScript monorepo with workspaces
- Fastify-based runtime server
- Policy enforcement and RBAC
- Circuit breaker pattern for LLM providers
- Audit logging
- Session management
- Docker support
- Single-binary distribution

---

## Future Releases

### Planned for 1.1.0
- [ ] Web search integration
- [ ] MCP (Model Context Protocol) support
- [ ] Custom tool definitions
- [ ] Enhanced diff viewer
- [ ] Multi-model ensemble
- [ ] Real-time knowledge integration

### Planned for 1.2.0
- [ ] VS Code extension
- [ ] Multi-agent orchestration
- [ ] Advanced caching
- [ ] Performance benchmarking dashboard
- [ ] SSO and organization policies
