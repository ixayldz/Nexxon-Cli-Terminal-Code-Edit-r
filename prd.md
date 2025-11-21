# Nexxon CLI - Product Requirements Document (PRD)
## 1. Document Metadata

- Product Name: Nexxon CLI
- Version: 1.2
- Date: November 18, 2025
- Authors:
  - Grok 4 - Conceptual Design Lead
  - Nexxon PM Team - PRD Editors
- Status: Approved
- Revision History:
  - v1.0: Initial creation based on market analysis of CLI AI coding agents.
  - v1.1: Refined scope (open-core model), clarified architecture layers (CLI vs Cloud), realistic performance targets, phased feature mapping, and security/compliance scope.
  - v1.2: Editorial cleanup (UTF-8 normalization); standardized headings/lists/tables; closed code blocks; added KPI definitions and measurement methodology; defined CLI <-> Runtime API contract; added policy/audit schemas; clarified performance/scalability constraints; added P1 acceptance criteria.
- Approval Sign-offs (to be completed in production):
  - Product Manager
  - Engineering Lead
  - UX Lead
  - Security/Compliance Lead
- References:
  - Market Research: Benchmarks from KDnuggets, Render.com, Medium (CLI AI agents, 2025).
  - Competitor Analysis: Claude Code docs, Gemini CLI GitHub, ForgeCode posts, Aider and Cline docs.
  - Standards:
    - OWASP (security)
    - ISO 9241 (usability)
    - GDPR / CCPA (privacy)
    - SOC 2 Type II (for cloud / enterprise backend)

---

## 2. Product Definition & Scope

### 2.1 High-Level Product Definition

Nexxon is a CLI-first AI coding assistant that helps developers plan, edit, and refactor code directly from the terminal. It is built as an open-core product with clearly separated components:

1. Nexxon CLI (Core, Open-Source)
   - Command-line interface used inside terminal environments.
   - Provides task planning, code exploration, and AI-assisted edits.
   - Designed for local-first usage and privacy.

2. Nexxon Local Runtime
   - Local agent runtime (Node.js/TypeScript-based) handling:
     - LLM orchestration (remote or local models),
     - Vector-based context management,
     - Tooling (git, tests, linters),
     - Policy enforcement (for local sandbox).
   - Communicates with the CLI via local IPC/HTTP.

3. Nexxon Cloud / Enterprise (Optional, Closed-Source)
   - Hosted orchestration and enterprise controls:
     - Centralized audit logs and analytics,
     - Organization-wide policies & RBAC,
     - SSO, usage dashboards,
     - Managed model routing and cost controls.

### 2.2 Licensing & Business Model

- Nexxon CLI Core: Apache License 2.0 (final).
- Nexxon Local Runtime: Apache License 2.0 (final).
- Nexxon Cloud / Enterprise:
  - Closed-source SaaS / on-prem offering.
  - Freemium:
    - Core CLI + Local Runtime: Free.
    - Premium Enterprise features: $10/user/month (indicative).
      - Centralized dashboards, org policies, SSO, managed logs, enterprise support.

### 2.3 In-Scope vs Out-of-Scope (Product-Level)

In Scope:

- Terminal-first developer experience.
- Code-centric tasks (editing, refactoring, testing, debugging).
- Multi-model orchestration (remote + local).
- Local-first privacy with optional cloud augmentation.
- CI/CD and DevOps oriented workflows.

Out of Scope (for v1.x):

- Full GUI-based IDE.
- General-purpose chat assistant unrelated to coding.
- Non-programming workflows (e.g., long-form writing unrelated to code).

---

## 3. Executive Summary

Nexxon CLI is a multi-model AI coding agent for the terminal, designed for professional developers who want substantial productivity gains without sacrificing security, control, or transparency.

Key design goals:

- CLI Purity, Professionalism & Enterprise Readiness
  - Local-first, open-source core with optional enterprise backend.
  - Strong auditability, permissions, and security controls.

- Superior Capabilities
  - Multi-model and multi-agent orchestration (e.g., planner vs coder models).
  - Vector-based code understanding and large-repo handling.
  - Automated tests, CI/CD hooks, and observability of agent behavior.

- Realistic & Sustainable Productivity Gains
  - Targeting 30-40% median time reduction on routine coding and maintenance tasks (bug fixing, refactoring, boilerplate generation), and 50-60% on highly automatable categories in benchmarked workflows.
  - Tuned for long-term adoption in both indie and enterprise environments.

---

## 4. Business Objectives & KPIs

### 4.1 Business Objectives (2-Year Horizon)

1. Adoption & Community
   - Reach 100K+ downloads of Nexxon CLI in Year 1.
   - Reach 15-20% share among actively used AI CLI coding tools in targeted niche (measured via surveys and ecosystem signals) within 2 years.

2. Productivity Impact
   - Deliver 30-40% median time reduction on predefined benchmark tasks (e.g., bug fixing, feature scaffolding) vs. non-AI workflows; target 50-60% on highly automatable categories.

3. Enterprise Readiness
   - Nexxon Cloud / Enterprise:
     - Achieve 99.9% uptime for the cloud orchestrator and critical integrations.
     - Maintain no publicly disclosed Sev-1 security incident in the first 12 months post-GA.

### 4.2 Key Performance Indicators (KPIs)

- User Adoption & Retention
  - 100K unique installations in Year 1.
  - 80% 30-day active retention for developers who used Nexxon at least 5 times.

- Feature Usage
  - >= 70% of sessions use planning + code-editing workflow.
  - >= 60% of sessions in advanced setups use multi-model or multi-agent features (Phase 2+).

- Quality & Hallucination Control
  - < 5% of user feedback marked as hallucination / incorrect suggestion.
  - >= 80% of suggested diffs are accepted or accepted after minor edits in benchmark projects.

- Satisfaction
  - Net Promoter Score (NPS) > 60 at GA; target > 80 in mature phase.
  - Favorable qualitative comparisons vs. Claude Code, Gemini CLI, Aider, etc.

- Revenue (Cloud / Enterprise)
  - Conversion rate of 5-10% from active orgs using the open core to paying enterprise accounts within first year of Cloud GA.

### 4.3 KPI Definitions & Measurement

- Unique Installations
  - Sources: release downloads (GitHub), npm installs (if applicable), Docker pulls, optional opt-in telemetry samples.
  - Privacy: no raw code collected; repo identity hashed when sampled.

- 30-Day Active Retention
  - Cohort: users with >= 5 sessions in first 14 days after install.
  - Session: a CLI run that executes at least one agent action, separated by >= 30 minutes from previous session.

- Feature Usage
  - Measured from local audit logs when telemetry is opted-in; otherwise estimated via periodic opt-in surveys and community samples.
  - Planning + code-editing workflow: any session that includes both plan and diff/apply.

- Diff Acceptance Rate
  - Accepted: user applies proposed diff without edits.
  - Accepted after minor edits: user-modified diff changes <= 20% of hunks/lines vs. proposal before commit.
  - Measured in benchmark projects and opt-in pilot repos.

- Hallucination Rate
  - User-visible Flag as hallucination action in CLI.
  - Rate = flagged suggestions / total suggestions in sample windows.

- Productivity Impact
  - Benchmark suite: predefined tasks (bug fixes, feature scaffolding, refactors) in sample repos.
  - Protocol: timed runs by internal team and external beta users; baseline (no AI) vs. Nexxon-guided.
  - Output: median and p95 time deltas per task category.

---

## 5. Target Audience & Personas

### 5.1 Target Users

- Primary
  - Full-stack developers, backend engineers, DevOps, and data/ML engineers who live in the terminal (Vim/Emacs/Neovim, tmux, etc.).
- Secondary
  - Enterprise teams needing secure, auditable AI tooling.
  - Indie developers / freelancers seeking local and low-cost AI coding support.

### 5.2 Pain Points

- Existing CLI agents:
  - Hallucinations and unsafe edits.
  - Context limits on large repos.
  - Cloud-only tools with privacy concerns.
  - Poor or noisy terminal UX.

### 5.3 Personas

Persona 1: Alex - Indie Developer

- Builds web backends and dashboards (Python / JS).
- Needs fast bug fixing, boilerplate code, and simple refactors.
- Very cost-sensitive; prefers local models and free tools.

Persona 2: Jordan - Enterprise Engineer

- Works in a large monorepo (Go / Rust / Java).
- Needs:
  - Compliance (GDPR, SOC 2 for backend),
  - Multi-user policies and audit logs,
  - Integration with CI/CD (GitHub, GitLab).
- Will only adopt tools that pass security review and offer RBAC & SSO.

Persona 3: Taylor - Research Engineer

- AI/ML prototyping (Python, CUDA).
- Needs:
  - Up-to-date knowledge (papers, APIs),
  - Low hallucination rate on novel tasks,
  - Flexible multi-model configs, including local LLMs.

---

## 6. Use Cases & User Flows

### 6.1 Core Use Cases

1. Bug Fixing in Existing Code
   - User: `nexxon "fix bug in main.py when input is empty"`
   - Nexxon:
     - Reads relevant files,
     - Plans investigation steps,
     - Proposes a patch as a diff,
     - Runs tests,
     - Presents results and logs.

2. Refactoring & Cleanup
   - User: `nexxon "refactor user authentication module for better readability"`
   - Nexxon:
     - Indexes module and related files,
     - Proposes a refactor plan,
     - Shows granular diffs per file,
     - Runs tests / linters,
     - Logs each change.

3. Feature Implementation
   - User: `nexxon "add export to CSV feature for sales report"`
   - Nexxon:
     - Finds entry points and data structures,
     - Suggests new functions, endpoints, or CLI options,
     - Generates tests and integrates them into CI.

4. Large Repo Exploration
   - On first run in a repo: `nexxon init` -> asks to index repo using `.gitignore`.

---

## 7. Features

### 7.1 Core Experience (Must-Have)

- Task interpretation and planning.
- Repo scanning with .gitignore awareness.
- Semantic/code-aware search (basic embeddings + BM25 or similar).
- Diff-based edits with explicit user approval.
- Test integration (user-configurable command).
- Local audit logs with redaction.

### 7.1.1 Global CLI Flags

- `--validate-policy`
  - Applies to most commands: `plan`, `diff`, `apply`, `test`, `index`, `search`, `log`, `whoami`.
  - Behavior: validates Org/Project policy and session overrides without executing side effects.
  - On violations: prints a readable summary and exits with code `4` (invalid_args).
  - On success: proceeds with the command (or exits 0 if used standalone for validation-only workflows).

- `--admin-override <reason>`
  - Requires RBAC role: OrgAdmin or ProjectMaintainer.
  - Allows widening policy constraints for the current session (e.g., temporarily allow a network host).
  - Mandatory `reason` is recorded in audit logs; all admin overrides are flagged in `policy_trace`.
  - Use sparingly; prefer editing `policy.yaml` for persistent changes.

Examples:
```sh
# Successful validation (exit 0)
$ nexxon plan "refactor auth module" --validate-policy --dry-run

# Violation example (exit 4)
$ nexxon apply --patch patch.diff --validate-policy
Policy validation failed:
- exec.allow: attempting to allow command not permitted by effective policy: "curl"
- network.outbound: attempting to add host outside org policy: "example.com"
```

Validation-only:
```sh
# Validate repo policy and overrides without running a command
$ nexxon --validate-policy
Policy OK (effective: sha256:abcdef)
```

Notes:
- CI integration: `nexxon ci run --validate-policy` validates before executing any actions.

### 7.1.2 Whoami Options

- `--policy-trace`
  - Prints a concise summary of key policy decisions relevant to the current session.
  - Works with text output and `--json`.
  - Intended for quick inspection and debugging of effective policy.

Examples:
```sh
$ nexxon whoami --policy-trace
Identity: dev@acme (roles: Developer)
Effective Policy: sha256:abcdef
Decisions:
- exec: "npm install" -> confirm (rule: exec.confirm)
- network: registry.npmjs.org -> allow (rule: network.outbound)
```

JSON:
```sh
$ nexxon whoami --policy-trace --json
{
  "identity": { "sub": "dev@acme", "org": "acme", "roles": ["Developer"] },
  "policy": { "effective_hash": "sha256:abcdef" },
  "policy_trace": {
    "effective_hash": "sha256:abcdef",
    "decisions": [
      { "action": "exec", "subject": "npm install", "decision": "confirm", "rule": "exec.confirm" },
      { "action": "network", "subject": "registry.npmjs.org", "decision": "allow", "rule": "network.outbound" }
    ]
  }
}
```

### 7.1.3 Execution & Iteration (P1-P2)

- P1: simple loop - propose change -> run tests -> propose fix on failure (max N loops).
- P2: ReAct-style loop with structured logs per step (Reason -> Action -> Observation). Option to auto-iterate up to a configurable limit before asking user.

### 7.1.4 Context & Token Management

- Sliding window + summarization: large files and multi-file changes are chunked; high-signal blocks are pinned; summaries replace low-signal parts when near token limits.
- Retrieval + reranking: embed/code-aware retrieval proposes candidates; rerank by recency, call-graph proximity, and test coverage impact.
- Adapter hints: function-level and module-level summaries cached per commit; invalidated on change.
- Streaming + trimming: prefer streaming decoding; truncate non-critical logs, keep code hunks intact.



### 7.1.5 Session & State Management

- Session ledger at `.nexxon/session.sqlite` tracks plan, diffs, applies, and tests; TTL configurable (default 14 days).
- `nexxon plan` persists artifacts (`artifacts/plan.json`, `patch.diff`); `nexxon apply` can resume after restart.
- `nexxon log` shows per-session audit with links to artifacts; `--json` available.

### 7.1.6 Undo Semantics (P1)

- `undo` by default reverts the last successful `apply` operation (`steps: 1`).
- When `steps > 1`, reverts the last N `apply` operations in reverse order according to `.nexxon/session.sqlite` ledger history.
- If a Git repository is present:
  - Nexxon first reapplies its own generated patches; for related commits or working tree changes, uses a safe Git-based rollback (`git stash`/`git restore`) strategy.
  - If files were manually modified after `apply`, `undo` performs conflict detection and prompts the user for an interactive resolution.
- If no Git repository is present:
  - Nexxon restores file contents using session ledger snapshots/patches; on failure, aborts `undo` safely and logs the issue.


### 7.2 Advanced Features (Should-Have)

7.2.1 Multi-Model Ensemble (P2)

- Config specifying planner, coder, and optional reviewer models.
- Modes: hybrid (local + remote) and cloud-only.
- Voting: K-of-N agreement on diffs before 'high confidence' label.
- Cost controls: model usage limits (tokens/day/project).

7.2.2 Real-Time Knowledge Integration (P2)

- Web search tool for up-to-date docs.
- API doc fetchers/summarizers for popular frameworks.
- Providers (configurable): web search (Google Programmable Search, Bing, DuckDuckGo), Q&A/docs (Stack Overflow, MDN, devdocs), registries (npm, PyPI, pkg.go.dev, crates.io), framework docs (React, Vue, Django, FastAPI, Spring).
- Caching & rate limits: local result cache with TTL; exponential backoff and provider-specific throttling; per-session concurrency caps.
- Citations & grounding: return source URLs/snippets with suggestions; prefer authoritative docs; warn on low-confidence/noisy sources.
- ArXiv/PDF scraping for research tasks.
- Configurable: `allow_external_web: true|false` per project/org.

Example providers.yaml (concept):
```yaml
knowledge:
  allow_external_web: true
  web_search:
    provider: bing            # bing | google_cse | ddg
    api_key_env: BING_API_KEY
    rate_limit: { rps: 1, burst: 5 }
    cache_ttl: 10m            # per-query TTL
  docs:
    sources: [mdn, devdocs, react, vue, django, fastapi, spring]
  registries:
    npm: true
    pypi: true
    crates_io: true
    pkg_go_dev: true
  citations: true
```

7.2.3 Multi-Agent Orchestration (P2)

- Specialized agents (Planner, Frontend, Backend, Test-Writer, etc.).
- Coordinator agent merges outputs, resolves conflicts, presents unified plan and diffs.

7.2.4 CLI UI Enhancements (P1-P2)

- P1: rich text output, color-coded messages, simple progress indicators.
- P2: TUI with Ink/React-Ink (tabs: Plan / Diffs / Logs; keybindings; progress bars and badges). Optional voice mode (P3+).

7.2.5 Automation Pipelines (P2-P3)

- CI/CD hooks: generate PRs/MRs with diffs and summarized descriptions; labels and reviewer suggestions.
- Scheduled tasks (P3): automated daily code review or 'tech-debt scan'.

### 7.2.6 Model Routing & Fallback (P2)

- Provider priority list and capability matrix define routing (e.g., planner vs coder).
- Fallback chain: try next compatible provider on outage or policy denial; local model as last resort.
- Prompt adapters normalize format differences across providers; tests validate parity.
- Policy-aware routing: disallow external calls in on_device mode; prefer local when cost caps hit.
- Telemetry-free routing in local-only mode; no prompt contents sent externally.
- Circuit breakers & health: track per-provider failures/latency; apply cooldowns and gradual recovery.
- Cost-aware routing: respect per-project/org token budgets; choose cheapest compatible provider when quality thresholds met.
- Privacy note: in cloud/enterprise mode, only minimal, non-content metrics (latency, counts) are reported; prompts/diffs never logged unless explicitly enabled.
- SLA/timeouts: per-call deadlines and cancellations; fail fast to fallback on slow/stalled providers.

Routing pseudocode (conceptual):
```text
role = (planner|coder|reviewer)
if policy.mode == on_device:
  return call(local_model(role), prompt)

candidates = provider_priority[role]
candidates = filter_by_policy(candidates, policy)             # network, model allowlists
candidates = filter_by_health(candidates, health_state)       # circuit breaker open -> drop
candidates = sort_by(cost_quality_score(role), candidates)    # respect budgets, quality

for p in candidates:
  try:
    resp = call(p, adapt_prompt(p, prompt), timeout=per_call_deadline)
    if meets_quality(resp):
      return resp
  except TimeoutError:
    open_breaker(p, reason="timeout")
  except ProviderError as e:
    record_failure(p, e)
    if transient(e): half_open_breaker(p)
    else: open_breaker(p)

if local_allowed(policy):
  return call(local_model(role), prompt)

raise NoProviderAvailable
```

### 7.3 Security & Compliance Features (Must-Have)

7.3.1 Sandboxing (P2)

- Local sandbox: default scope = project directory; non-project access requires explicit confirmation/policy.
- Optional Docker-based isolation (P2/P3): run-everything-in-container mode.

7.3.2 Permissions & Policies (P2-P3)

- YAML-based policy configuration (P2): allowed tools, commands requiring confirmation.
- Enterprise policies in Cloud/Org (P3): RBAC, org-wide policies, read-only projects.

7.3.3 Audit Logs (P1-P3)

- P1: local JSON/SQLite audit log per project - timestamp, actor (user/agent), action, target (file/command), result.
- P3: centralized org-level logs in Nexxon Cloud - SIEM-friendly formats (JSON/CSV export), search & filtering.

7.3.4 Privacy Controls & Telemetry (P1-P3)

- Local-only mode: `mode: on_device` - no external API calls, only local models.
- Hybrid & cloud modes: explicit opt-in for telemetry; clear docs of what is sent (no raw source code by default).
- GDPR for cloud services: data deletion requests, EU data residency options, DPAs and compliance docs.

7.3.5 Policy Schema and Enforcement (P2-P3)

- Prompt scrubbing: secrets and tokens are redacted before any remote LLM call; on-device mode never sends prompts externally.

- Policy file: `policy.yaml` in project root (overridable via `--policy`).
- Defaults: deny unknown tools; require confirmation for writes; restrict network.
- Schema (draft):
  ```yaml
  version: 1
  scope:
    fs:
      allow: ["./", "./src", "./tests"]
      deny: ["../", "/"]
    network:
      outbound: ["api.github.com", "registry.npmjs.org"]
      blocked: ["*tracking*", "169.254.169.254"]
    exec:
      allow: ["git", "npm", "node", "pnpm", "yarn"]
      confirm: ["npm install", "rm", "mv"]
  models:
    providers:
      - name: "openrouter" # example
        allow: ["model-a", "model-b"]
        max_tokens: 8192
        temperature: { min: 0.0, max: 0.7 }
    local_fallback: true
  limits:
    tokens_per_session: 200000
    files_read_per_minute: 500
    bytes_read_per_minute: 10485760 # 10MB
  redaction:
    patterns:
      - name: secrets
        regex: "(?i)(api[_-]?key|token|secret|password)\s*[:=]"
        action: hash
  approval:
    require_for:
      - writes
      - exec.confirm
      - network.outbound
  ```

- JSON Schema (draft):
  ```json
  {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://nexxon.dev/schemas/policy.schema.json",
    "type": "object",
    "additionalProperties": false,
    "required": ["version", "scope", "limits"],
    "properties": {
      "version": { "type": "integer", "enum": [1] },
      "scope": {
        "type": "object",
        "required": ["fs", "network", "exec"],
        "properties": {
          "fs": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "allow": { "type": "array", "items": { "type": "string" } },
              "deny": { "type": "array", "items": { "type": "string" } }
            }
          },
          "network": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "outbound": { "type": "array", "items": { "type": "string" } },
              "blocked": { "type": "array", "items": { "type": "string" } }
            }
          },
          "exec": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "allow": { "type": "array", "items": { "type": "string" } },
              "confirm": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      },
      "models": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "providers": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["name"],
              "properties": {
                "name": { "type": "string" },
                "allow": { "type": "array", "items": { "type": "string" } },
                "max_tokens": { "type": "integer", "minimum": 0 },
                "temperature": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "min": { "type": "number", "minimum": 0 },
                    "max": { "type": "number", "maximum": 1 }
                  }
                }
              }
            }
          },
          "local_fallback": { "type": "boolean" }
        }
      },
      "limits": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "tokens_per_session": { "type": "integer", "minimum": 0 },
          "files_read_per_minute": { "type": "integer", "minimum": 0 },
          "bytes_read_per_minute": { "type": "integer", "minimum": 0 }
        }
      },
      "redaction": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "patterns": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["name", "regex", "action"],
              "properties": {
                "name": { "type": "string" },
                "regex": { "type": "string" },
                "action": { "type": "string", "enum": ["hash", "redact", "drop"] }
              }
            }
          }
        }
      },
      "approval": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "require_for": {
            "type": "array",
            "items": { "type": "string", "enum": ["writes", "exec.confirm", "network.outbound"] }
          }
        }
      }
    }
  }
  ```

7.3.6 Audit Log Schema (P1-P3)

- Local log: JSON lines in `.nexxon/audit.log` per project; optional SQLite mirror.
- Redaction: file paths hashed with salt when telemetry enabled; code snippets truncated or hashed.
- Record (example):
  ```json
  {
    "ts": "2026-01-15T12:34:56.789Z",
    "actor": "agent|user",
    "action": "plan|diff|apply|test|search|index|exec|network",
    "target": { "path": "src/app.ts", "op": "write" },
    "policy": { "decision": "allow|deny|confirm", "rule": "limits.tokens_per_session" },
    "result": { "status": "ok|error", "details": "..." },
    "hashes": { "repo": "sha256:...", "path": "sha256:..." }
  }
  ```

7.3.7 RBAC & SSO (P3)

- Roles (default):
  - OrgAdmin: manage org/users/policies; full project access.
  - ProjectMaintainer: manage project policies; approve/apply diffs; run agents/tests.
  - Developer: plan/diff/test; apply diffs if policy allows.
  - Auditor: read-only access to logs/metrics; no code writes or exec.
  - ReadOnly: view plans/logs; no actions.
- Actions (sample verbs): `plan`, `diff`, `apply`, `test`, `index`, `search`, `exec`, `network`, `policy.manage`, `log.read`.
- AuthN/SSO:
  - OIDC and SAML SSO for Cloud/Enterprise; local mode uses OS user identity.
  - SCIM for user/group provisioning (Cloud).
  - Tokens: short-lived JWTs with scopes; claims include `sub`, `org`, `roles`, `exp`, `jti`.
  - Device code login flow optional for terminals.
- Enforcement: CLI/Runtimes check role permissions before actions; all denials audited.

7.3.8 Organization Policies (P3)

- Precedence: Org policy -> Project policy -> Session overrides (most restrictive wins for security-sensitive settings).
- Example `org-policy.yaml` (draft):
  ```yaml
  version: 1
  defaults:
    network:
      outbound: []
    limits:
      tokens_per_session: 150000
  projects:
    "*":
      scope:
        exec:
          allow: ["git", "npm", "node"]
          confirm: ["npm install"]
    "payments/*":
      scope:
        network:
          outbound: ["api.stripe.com"]
        fs:
          deny: ["/secrets"]
  rbac:
    roles:
      ProjectMaintainer: ["plan", "diff", "apply", "test", "policy.manage", "log.read"]
      Developer: ["plan", "diff", "test", "log.read"]
      Auditor: ["log.read"]
    bindings:
      users:
        alice@example.com: ["OrgAdmin"]
      groups:
        dev-team: ["Developer"]
  ```

7.3.9 Policy Merging & Precedence

- Sources:
  - Organization policy (optional, Cloud/Enterprise)
  - Project policy (`policy.yaml`)
  - Session overrides (per-command `--policy` or inline constraints)

- Precedence Rules (most restrictive wins where ambiguous):
  - FS scope: effective allow = intersection of allows; effective deny = union of denies; deny always overrides allow.
  - Network: effective outbound = intersection; effective blocked = union.
  - Exec: effective allow = intersection; effective confirm = union; any command not in allow becomes deny unless explicitly confirmed and permitted by policy.
  - Limits (numbers): choose the minimum across sources (e.g., tokens_per_session = min(org, project, session)).
  - Models: provider/model allow = intersection; temperature range = overlap (clamped); if empty, deny.
  - Approval: require_for = union (more actions require approval).
  - Redaction: patterns = union.

- Algorithm (conceptual):
  1) Start with defaults (secure baseline).
  2) Merge Org -> Project -> Session with the rules above.
  3) Validate consistency (e.g., allow list not empty for required ops) else fail-closed.
  4) Cache effective policy for the session and include policy hash in audit events.

- Examples:
  - Example A (Exec confirm):
    - Org: exec.confirm = ["npm install"], Project: exec.confirm = ["rm"], Session: (none)
    - Effective: exec.confirm = ["npm install", "rm"] (union)
  - Example B (Network restrict):
    - Org: network.outbound = ["api.github.com"], Project: ["registry.npmjs.org", "api.github.com"], Session: (none)
    - Effective: ["api.github.com"] (intersection)
  - Example C (FS deny overrides allow):
    - Org: fs.deny = ["/secrets"], Project: fs.allow = ["./", "./src"], Session: (none)
    - Effective: access to /secrets denied regardless of allow lists.


7.3.10 Policy Overrides Validation (CLI)

- Philosophy: session-level overrides may only further restrict capabilities, never widen beyond Org/Project effective policy.
  - Admin override path: users with OrgAdmin or ProjectMaintainer role may widen constraints for the session by explicitly passing `--admin-override <reason>`; all such actions are audit-logged and surfaced in `policy_trace`.
- Validation rules (selected):
  - Numeric limits (e.g., tokens_per_session): override_value <= effective_value (else reject, unless admin override).
  - FS scope: override.allow must be a subset of effective allow (admin override may add entries with reason); override.deny may add new entries.
  - Network: override.outbound must be a subset of effective outbound (admin override may add hosts with reason); override.blocked may add entries.
  - Exec: override.allow must be a subset of effective allow (admin override may add commands with reason); override.confirm may add entries.
  - Models: override.providers[*].allow must be a subset of effective allow (admin override may add entries); temperatures must be equal or a narrower range.
  - Approval: override.require_for must be a superset of effective.require_for (admin override cannot reduce approvals).
- CLI behavior:
  - Validate `policy.overrides` against JSON Schema and the effective policy using the rules above.
  - On invalid overrides: exit code 4 (invalid_args); print a clear diff of violations.
  - With `--admin-override <reason>`: permit allowed widenings per rules above; include reason in audit; warn prominently in output.
  - On success: include `policy.overrides` and override metadata in request; echo effective policy hash in output.
- Example overrides (valid):
  ```json
  {
    "limits": { "tokens_per_session": 100000 },
    "scope": { "exec": { "confirm": ["npm install", "rm"] } }
  }
  ```

- Enforcement:
  - CLI checks local actions before execution; Runtime validates requests against effective policy.
  - Violations: block, log event, prompt user with required context and diff where applicable.

## 8. Architecture & Tech Stack

### 8.1 Logical Architecture

- CLI Layer (TypeScript / Node.js)
  - Command parsing, interactive TUI, user-facing experience.
  - Communicates with Local Runtime via IPC/localhost HTTP.

- Local Runtime (Node.js/TypeScript)
  - Agents (planner, coder, tools).
  - Model orchestration (remote API + local LLMs).
  - Vector store (Qdrant or SQLite + sqlite-vss) for code embeddings.
  - Policy engine and sandbox enforcement.

- Tools & Integrations
  - File system access; git, test runners, linters.
  - Optional Docker sandbox (Dockerode).

- Cloud Orchestrator & Dashboard (Enterprise)
  - Multi-tenant backend; centralized logging and analytics; org policies, SSO, billing.

### 8.2 Tech Stack

- Languages
  - CLI/TUI: TypeScript (Node.js, Commander.js, Ink/React-Ink).
  - Runtime: TypeScript/Node.js (agents, orchestration).
  - Performance-critical utilities: Rust (optional).

- Libraries & Frameworks
  - CLI: Commander.js, Ink/React-Ink.
  - AI orchestration: LangChain.js / LlamaIndex (TS) (evaluated; may be replaced with a thin custom layer).
  - Vector search: Qdrant or SQLite + sqlite-vss (local).
  - Containerization: Docker, Dockerode.

- Config & Schemas
  - Schemas: `policy.schema.json`, `providers.schema.json` (JSON Schema 2020-12).
  - Validation: on startup and on demand (`--validate-policy`); fail-closed with clear path:message errors.
  - Sources: `policy.yaml` (YAML parsed to JSON), `providers.yaml`.
  - Engine: Ajv with formats plugin; strict mode enabled.
  - Locations: default schemas at `.nexxon/schemas/policy.schema.json` and `.nexxon/schemas/providers.schema.json`; project configs at project root (`policy.yaml`, `providers.yaml`). Optional override via env `NEXXON_SCHEMA_DIR`.
  - Example (Ajv JSON output on failure):
    ```json
    {
      "errors": [
        {
          "instancePath": "/scope/exec/allow/0",
          "schemaPath": "#/properties/scope/properties/exec/properties/allow/items/type",
          "keyword": "type",
          "params": { "type": "string" },
          "message": "must be string"
        }
      ]
    }
    ```
  - Example (CLI summary):
    ```text
    Policy validation failed:
    - /scope/exec/allow/0: must be string (expected type string)
    ```

- Distribution Strategy
  - Developer monorepo: CLI + Runtime + Rust crates.
  - End-user distribution:
    - Option A: prebuilt binaries (packaged Node runtime).
    - Option B: Docker image (`nexxon/cli`) bundling dependencies.
    - Option C: `npm install -g nexxon` for advanced users with Node already set up.
  - Goal: provide at least one zero-friction installation path (binary or Docker).

### 8.3 CLI <-> Local Runtime API Contract (v1.0)

- Transport & Auth
  - Default: HTTP on 127.0.0.1 with random port and ephemeral token; fallback: stdio/IPC.
  - Auth: Bearer token optional (local mode), signed short‑lived tokens for Cloud/Enterprise; claims carry `sub`, `org`, `roles`.
  - Content type: JSON; max payload sizes enforced by policy.

- Envelope
  - Request:
    ```json
    {
      "api_version": "1.0",
      "id": "uuid",
      "command": "plan|diff|apply|test|search|index|log|whoami",
      "args": {},
      "policy": { "overrides": {}, "override_mode": "restrictive|admin", "override_reason": "string" },
      "auth": { "type": "bearer", "token": "..." },
      "context": {
        "claims": { "sub": "user@org", "org": "acme", "roles": ["Developer"] },
        "session": { "id": "uuid", "started_at": "iso8601" }
      }
    }
    ```
  - Response:
    ```json
    {
      "api_version": "1.0",
      "id": "uuid",
      "status": "ok|error|in_progress",
      "result": {},
      "error": { "code": "string", "message": "string", "details": {} },
      "logs": [ { "ts": "iso8601", "level": "info|warn|error", "msg": "string" } ],
      "metrics": { "latency_ms": 0 },
      "identity": { "sub": "user@org", "org": "acme", "roles": ["Developer"] },
      "policy_trace": {
        "effective_hash": "sha256:...",
        "decisions": [
          { "action": "exec", "subject": "npm install", "decision": "confirm", "rule": "exec.confirm" },
          { "action": "network", "subject": "registry.npmjs.org", "decision": "allow", "rule": "network.outbound" }
        ]
      }
    }
    ```

- Commands (selected)
  - [Index] index: args `{ "paths": ["..."], "use_gitignore": true }` -> result `{ "indexed_files": n }`
  - [Discover] search: args `{ "q": "string", "semantic": true|false }` -> result `{ "matches": [ {"path": "...", "line": 0, "snippet": "..."} ] }`
  - [Plan] plan: args `{ "task": "string", "files_hint": ["path"], "constraints": {} }` -> result `{ "plan_steps": ["..."] }`
  - [Edit] diff: args `{ "plan": ["..."], "scope": {"paths": ["..."], "exclude": ["..."]} }` -> result `{ "patch": "unified-diff" }`
  - [Edit] apply: args `{ "patch": "unified-diff", "dry_run": true|false }` -> result `{ "applied": true|false, "hunks": n }`
  - [Control] undo: args `{ "steps": 1 }` -> result `{ "reverted": true, "commits": 1 }`
  - [Test] test: args `{ "cmd": "string" }` -> result `{ "exit_code": 0, "stdout": "...", "stderr": "..." }`
  - [Audit] log: args `{ "limit": 100 }` -> result `{ "entries": [ {"ts": "iso8601", "actor": "user|agent", "action": "...", "target": "...", "result": "..."} ] }`
  - [Identity] whoami: args `{}` -> result `{ "identity": {"sub": "...", "org": "...", "roles": ["..."] }, "policy": {"effective_hash": "sha256:..."} }`
Example (whoami):
Request:
{
  "api_version": "1.0",
  "id": "uuid",
  "command": "whoami",
  "args": {},
  "auth": { "type": "bearer", "token": "..." },
  "context": { "claims": { "sub": "dev@acme", "org": "acme", "roles": ["Developer"] }, "session": { "id": "uuid" } }
}

Response:
{
  "api_version": "1.0",
  "id": "uuid",
  "status": "ok",
  "result": {
    "identity": { "sub": "dev@acme", "org": "acme", "roles": ["Developer"] },
    "policy": { "effective_hash": "sha256:abcdef" }
  },
  "identity": { "sub": "dev@acme", "org": "acme", "roles": ["Developer"] },
  "policy_trace": { "effective_hash": "sha256:abcdef", "decisions": [] }
}
```

CLI Example (whoami):
```sh
$ nexxon whoami --json
{
  "identity": { "sub": "dev@acme", "org": "acme", "roles": ["Developer"] },
  "policy": { "effective_hash": "sha256:abcdef" }
}
```

---

## 9. Distribution & Installation

- Single-binary releases for macOS, Linux, Windows (bundled Node.js runtime).
- Docker image `nexxon/cli` for container-first environments.
- NPM global install `npm install -g nexxon` for developers with Node already installed.

Note: Prebuilt single-binary releases bundle their own Node.js runtime and do not require a separate Node.js installation. The `npm install -g nexxon` path requires a system-wide Node.js LTS installation.

---

## 10. Non-Functional Requirements

### 10.1 Performance (Scenario-based targets; p95 unless noted)

- Local context-only suggestion (no web, no tests): < 3 seconds.
- Single remote LLM call, no tests: < 8 seconds (provider-dependent).
- Full workflow (ensemble + tests + web search): p95 < 30 seconds, p99 < 60 seconds.
- Baseline: 8 cores / 16 GB RAM / SSD; stable internet (p50 RTT ~100 ms) for remote calls.

### 10.2 Scalability

- Handle repositories with 1M+ LOC via chunking, incremental indexing, embedding-based retrieval, cached vector indices.
- Index build < 15 min; steady-state update < 2 min after typical change set.

### 10.3 Reliability & Maintainability

- Critical runtime error rate: < 1% of sessions.
- Code quality: 80-90% unit test coverage for critical components; static analysis (ESLint, TypeScript, etc.).
- Graceful degradation: fallback providers or local models on provider failure.

### 10.4 Usability & Accessibility

- Full keyboard navigation in TUI; high-contrast themes.
- Rich `--help` and inline docs for commands.
- Documentation website hosted on GitHub Pages or similar.

### 10.5 Platform Support

- OS: macOS (x64/arm64), Linux (x64/arm64), Windows 10+.
- Runtime: Node.js LTS (CLI + Runtime).

---

### 10.6 Security

- Default-deny policy stance; explicit allowlists for FS/exec/network.
- Secrets handling: environment variables only; redact common secret patterns in logs.
- SAST/linters: ESLint + TypeScript strict mode; optional Semgrep profiles for JS/TS.
- Dependency scanning: `npm audit`/`pnpm audit` or `osv-scanner` hook integration.
- Supply chain: lockfile required; integrity verification for downloaded models/tools where applicable.
- Isolation: optional Docker sandbox (projects) via Dockerode; restrict mounts and network.
- Telemetry: opt-in only; no source code by default; hashed repo identifiers.

---

## 11. Roadmap & Phases

### 11.1 Phases Overview

- Phase 1 (Q1 2026): MVP - open-source CLI + Local Runtime; core planning, code exploration, diff-based editing.
- Phase 2 (Q2-Q3 2026): Advanced Intelligence - multi-model ensembles; multi-agent orchestration; web/knowledge integration; Docker sandbox; YAML policies.
- Phase 3 (Q3-Q4 2026): Enterprise Edition - Cloud backend; org-level policies, SSO, RBAC; centralized logging/analytics; CI/CD deep integrations.

### 11.2 Feature-to-Phase Mapping

| Feature | MoSCoW | Phase |
|---|---|---|
| CLI command parsing & basic TUI | Must | P1 |
| Task interpretation & simple planning | Must | P1 |
| Repo scanning & basic text/semantic search | Must | P1 |
| Diff-based edits + user approval | Must | P1 |
| Basic test integration (user-defined command) | Must | P1 |
| Local audit logs (per project) | Must | P1 |
| Single-model LLM integration (remote or local) | Must | P1 |
| Undo last change (`undo`) | Must | P1 |
| Multi-model ensemble & voting | Should | P2 |
| Real-time web search / doc integration | Should | P2 |
| Multi-agent orchestration | Should | P2 |
| Advanced TUI (tabs, diffs, logs) | Should | P2 |
| Docker sandbox for projects | Must | P2 |
| YAML-based local policies | Must | P2 |
| Vulnerability & bias detection (basic) | Could | P2 |
| CI/CD hooks & PR generation | Should | P2 |
| Nexxon Cloud orchestrator | Must | P3 |
| Centralized org-level audit logs | Must | P3 |
| SSO, RBAC, org policies | Must | P3 |
| Analytics dashboards | Could | P3 |
| Collaboration mode (multi-user sessions) | Could | P3 |
| Mobile companion app | Could | P3+ |

---

## 12. Risks & Mitigations

- LLM Hallucinations
  - Mitigation: multi-model ensemble; reviewer model (P2); user feedback loop; diff-only suggestions.

- Provider Lock-in / Deprecation
  - Mitigation: pluggable provider interface; support multiple vendors and local models; config-driven routing.

- High Costs for Heavy Users
  - Mitigation: cost controls (token limits, per-project caps); strong local LLM support.

- Adoption Barriers (Security Reviews)
  - Mitigation: clear threat model and docs; local-only mode with no telemetry; security whitepapers & SOC 2 roadmap.

---

## 13. Appendices

### 13.1 Competitive Analysis

| Agent | Strengths | Weaknesses | Nexxon Advantage |
|---|---|---|---|
| Claude Code | Sub-agents, planning | Context limits, verbose UI | Vector context, streamlined TUI |
| OpenAI Codex CLI | Strong coding accuracy | Costs, hallucinations, deprecated | Ensemble, local-friendly, open-core |
| Factory Droid CLI | Speed, debugging | Minimal tools, no multi-model | Parallel agents, extensible tools |
| Google Gemini CLI | Code understanding, open-source | Model freshness, security concerns | Policy sandbox, web integration |
| ForgeCode | Intuitive terminal feel | Subscription fatigue, weak visuals | Freemium, Ink-based TUI |
| Cline | Frontier model access, transparency | Execution risk, abstract struggles | Audit logs, safer policies |
| Aider | Autonomous edits, CI hooks | Novel task failures, integration gaps | Multi-agent with better planning |
| Warp | Fast workflows | Limited creativity, privacy issues | On-device mode, better context |
| Cursor Composer | Great code quality (IDE-focused) | Cloud dependency, token-heavy | CLI purity, optimized tokens |

### 13.2 Glossary

- ReAct: Reasoning + Acting loop where the model alternates between thought and tool use.
- Ensemble: Combining multiple models to reach higher confidence.
- Sandbox: Isolated execution environment with restricted permissions.
- Sev-1 Incident: Highest severity security or availability incident.

### 13.3 Open Issues

- Evaluate and select default local models (accuracy vs. performance).
- Explore quantum-safe encryption for cloud data at rest (future).
- Assess voice mode UX and accuracy in noisy environments.
- Review and finalize provider list and routing heuristics.

---

## 14. Phase 1 (MVP) Acceptance Criteria

- Commands
  - `init` (index repo with .gitignore), `plan`, `diff`, `apply` (selective), `test` (user-defined), `log` (view audit), `whoami` (identity & effective policy hash), `undo` (revert last applied patch).

- Features
  - .gitignore-aware scanning; basic semantic search.
  - Single-model planning + diff generation; no writes without explicit user approval.
  - Local JSON/SQLite audit log with redaction; local-only mode available and tested.

- Quality Gates
  - E2E flow validated on >= 3 sample repos (Python/JS/Go) with p95 timings recorded.
  - Benchmark task suite (>= 10 tasks) measured and reported; diff acceptance metrics computed.
  - Error handling for policy denials, timeouts, provider failures; safe rollback path (git stash/restore or patch revert).

- Documentation
  - Quickstart, CLI reference, policy guide, security overview; example `policy.yaml` and API samples included.

---

## 15. CI/CD Integration

### 15.1 Goals

- Enable reproducible agent runs in CI (planning, diff generation, validation).
- Automate PR annotations with plans, diffs, and metrics.
- Gate merges on tests, policies, and optional quality thresholds.

### 15.2 Supported Platforms (P2+)

- GitHub Actions and GitLab CI templates provided.
- Minimal generic shell template for other CI systems.

### 15.3 Commands & Behavior

- `nexxon ci init` - installs example workflows and config.
- `nexxon ci run` - runs plan/diff with `--dry-run`, attaches artifacts.
- `nexxon ci annotate` - posts PR/MR comments (if token provided).

### 15.4 Example GitHub Action (excerpt)

```yaml
name: Nexxon CI
on:
  pull_request:
    branches: [ main ]
jobs:
  nexxon:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 'lts/*' }
      - run: npm install
      - run: npm run validate
      - run: npm i -g nexxon
      - run: nexxon ci run --task "analyze diff and propose fixes" --dry-run --validate-policy
      - run: nexxon ci annotate --from artifacts/report.json
```

### 15.5 Policies in CI

- CI uses repository `policy.yaml` with stricter defaults (no external network unless explicitly allowed).
- Secrets pulled from CI secret store; no secrets logged; redact on output.

### 15.6 Artifacts & PR Annotations

- Artifacts: `artifacts/plan.json`, `artifacts/patch.diff`, `artifacts/report.json` (metrics, summary).
- PR comments summarize plan, highlight risky changes, and link to diff artifacts.

### 15.7 Merge Gates (optional)

- Require: `npm test` success, policy checks pass, diff acceptance risk below threshold.
- Optional coverage delta gate: fail if coverage decreases by > X%.

### 15.8 CI Command Contracts

- `nexxon ci init`
  - Args:
    - `--path <dir>`: target directory for CI files (default: auto-detected path).
    - `--force`: overwrite existing files.
    - `--provider <github|gitlab|generic>`: selects template (default: auto-detect).
    - `--json`: emit result JSON to stdout.
  - Result (when `--json`):
    ```json
    { "files_created": [".github/workflows/nexxon.yml"], "files_updated": [], "provider": "github" }
    ```

- `nexxon ci run`
  - Args:
    - `--task <string>`: natural language task description.
    - `--dry-run`: do not apply diffs; only generate artifacts.
    - `--policy <path>`: path to policy file (default: `policy.yaml`).
    - `--validate-policy`: validate Org/Project policy and overrides before run; print summary and exit on violations.
    - `--plan <path>`: output plan JSON (default: `artifacts/plan.json`).
    - `--patch <path>`: output unified diff (default: `artifacts/patch.diff`).
    - `--report <path>`: output report JSON (default: `artifacts/report.json`).
    - `--json`: emit summary JSON to stdout.
    - `--admin-override <reason>`: widen policy for this run (requires RBAC, strongly discouraged in CI).
  - Exit codes:
    - `0` success; `1` generic failure; `2` policy_denied; `3` tests_failed; `4` invalid_args.
  - Report JSON (fields):
    ```json
    {
      "task": "...",
      "plan_steps": ["..."],
      "diff_stats": { "files": 3, "hunks": 7, "added": 120, "removed": 45 },
      "tests": { "ran": true, "exit_code": 0, "duration_ms": 12345 },
      "policy": { "violations": 0, "decisions": ["allow"] },
      "metrics": { "latency_ms": 25678, "tokens": 12345 }
    }
    ```


- `nexxon ci annotate`
  - Args:
    - `--from <report.json>`: report file to annotate from.
    - `--provider <github|gitlab>`: platform.
    - `--pr <id>`: PR/MR identifier (or auto from CI env).
    - `--token <string>`: API token (read from env if not provided).
    - `--dry-run`: print comment text to stdout without posting.
    - `--json`: emit result JSON to stdout.
  - Result (when `--json`):
    ```json
    { "provider": "github", "pr": 123, "comment_url": "https://api.github.com/...", "posted": true }
    ```



---

## 16. Updates & Versioning

- Self-update: `nexxon update` downloads signed releases; verifies checksums/signatures before install; rollback to previous version on failure.
- Version pinning: per-project `.nexxon/version` to enforce minimum CLI/runtime versions; warn or fail if incompatible.
- Offline/airgapped: support manual update via file bundle; skip telemetry.
- Security advisories: CVE feed monitored; critical patches flagged in CLI; optional auto-update in enterprise-managed environments.
---

## 17. Performance Benchmark Protocol

### Baseline Establishment (Pre-launch)
- Internal team: 3 developers x 30 tasks = 90 data points
- Beta users: 20 developers x 10 tasks = 200 data points
- Minimum sample: 100 tasks per category for statistical significance

### Benchmark Suite Structure
repos/
  small/     # < 10K LOC
    python-flask-api/
    nodejs-express/
    go-cli-tool/
  medium/    # 10K-100K LOC
    python-django-monolith/
    rust-web-server/
  large/     # > 100K LOC
    java-spring-enterprise/

### Task Categories (per repo)
1. Bug Fixing (10 tasks)
   - Null pointer errors, logic bugs, edge case handling
2. Refactoring (10 tasks)
   - Extract method, rename variable, move class
3. Feature Addition (10 tasks)
   - Add REST endpoint, validation, logging

### Measurement Protocol
```bash
# Baseline (no AI)
time human_developer task1.txt  # Record median, p95

# Nexxon-assisted
time nexxon "$(cat task1.txt)"  # Record median, p95
```

### Metrics
- Time to first valid diff
- Time to passing tests
- Number of iterations
- User edits to diff (%)
- Test success rate

### Acceptance Criteria
- Median time reduction: >= 30%
- Diff acceptance rate: >= 80%
- Test success rate: >= 95%

---

## 18. Cost Analysis & Unit Economics

### Infrastructure Costs (Monthly, per 1000 active users)
Component            | Cost   | Notes
---------------------|--------|---------------------------
Vector DB (Qdrant)   | $200   | Cloud hosted
LLM API calls        | $1,500 | Avg 50K tokens/user/month
Storage (S3)         | $50    | Audit logs, artifacts
CDN (Binary dist.)   | $20    | Distribution
Total Infrastructure | $1,770 | $1.77/user/month

### Revenue Model
Tier        | Price/user/mo | Features               | Target Conversion
------------|---------------|------------------------|------------------
Free        | $0            | Local runtime only     | 80%
Pro         | $20           | Cloud sync, 10x limits | 15%
Enterprise  | $50           | SSO, RBAC, audit       | 5%

### Unit Economics (Pro Tier)
- Revenue: $20/user/month
- Cost: $1.77/user/month (infra) + $3/user/month (support) = $4.77
- Gross Margin: 76%
- CAC Target: $100 (5-month payback)
- LTV (24 months): $480
- LTV/CAC: 4.8x

### Break-even Analysis
- Fixed Costs: $50K/month (team + overhead)
- Break-even users: 50000 / (20-4.77) = 3,283 paying users
- With 15% conversion: need 21,887 total active users

### Sensitivity Analysis
Scenario          | Conversion | Users Needed     | Risk
------------------|------------|------------------|------
Best case         | 20%        | 16,415           | Low
Base case         | 15%        | 21,887           | Moderate
Worst case        | 10%        | 32,830           | High

### Contingency Plan (if conversion < 10%)
1. Increase Free tier value (better local models)
2. Reduce Pro tier price to $15
3. Introduce annual discount (2 months free)

---

## 19. Error Taxonomy & Recovery Strategies

Error Code                  | Category         | Recommended Handling
--------------------------- | ---------------- | --------------------
POLICY_DENIED (4001)        | Policy           | Explain, log, suggest override if RBAC
POLICY_INVALID_OVERRIDE(4002)| Policy          | Print violation diff, exit 4
POLICY_MERGE_CONFLICT(4003) | Policy           | Fail-closed, ask user to resolve
PROVIDER_UNAVAILABLE(5001)  | Provider         | Open breaker, fallback
PROVIDER_TIMEOUT(5002)      | Provider         | Timeout -> fallback, cooldown
PROVIDER_QUOTA_EXCEEDED(5003)| Provider        | Backoff, switch provider
PROVIDER_AUTH_FAILED(5004)  | Provider         | Prompt to re-auth, or switch
DIFF_APPLY_CONFLICT(6001)   | Runtime          | Abort apply, show hunks, suggest `undo`
TEST_FAILED(6002)           | Runtime          | Surface logs, propose fix plan
INDEX_CORRUPT(6003)         | Runtime          | Rebuild index from snapshot
NETWORK_UNREACHABLE(7001)   | Network          | Offline mode prompt
DNS_RESOLUTION_FAILED(7002) | Network          | Retry with backoff, provider switch

### Error Response Format (API)
```ts
interface NexxonError {
  code: number;              // 4001, 5002, etc.
  category: string;          // "policy", "provider", "runtime", "network"
  message: string;           // User-facing
  details?: object;          // Structured data
  retry: {
    retryable: boolean;
    retryAfter?: number;     // seconds
    fallback?: string;       // "local_model", "next_provider"
  };
  context: {
    command: string;
    args: object;
    timestamp: string;       // ISO-8601
  };
  help: {
    docs: string;            // URL to relevant docs
    suggestions: string[];   // Actionable steps
  };
}
```

Example error response:
```json
{
  "code": 5002,
  "category": "provider",
  "message": "Provider timed out after 10s",
  "retry": { "retryable": true, "retryAfter": 5, "fallback": "local_model" },
  "context": { "command": "plan", "args": { "task": "fix bug in main.py" }, "timestamp": "2026-01-15T12:34:56Z" },
  "help": { "docs": "https://docs.nexxon.dev/errors/5002", "suggestions": ["Check network", "Verify API key", "Try again in 5s"] }
}
```
---

## 20. QA Checklist (Key Scenarios)
- Admin override logs and allows (with reason)
- Policy merge conflicts fail-closed
- Circuit breaker opens after N failures
- Fallback chain executes in defined order
- Cost limits prevent overspending
- Local fallback works when all remotes fail
- Network timeout triggers fallback
- Partial diff application rolls back safely
- Corrupt audit log rebuilds from session
- Invalid schema fails validation early

### Test Automation Coverage
Category              | Coverage Target | Tool/Framework
----------------------|-----------------|----------------
Unit Tests            | 80%             | Jest/Vitest
Integration Tests     | 60%             | Supertest
E2E Tests             | Critical paths  | Playwright
Policy Tests          | 100% scenarios  | Custom harness
Performance Tests     | Benchmark suite | Hyperfine
Security Tests        | OWASP Top 10    | SAST + Manual

### CI/CD Test Pipeline
1. Pre-commit: Linting (ESLint, Prettier)
2. On PR: Unit + Integration tests
3. Nightly: E2E + Performance benchmarks
4. Pre-release: Full regression + penetration test

---

## 21. Go-to-Market Strategy (Overview)

### Pre-Launch (8 weeks)
- Messaging & Positioning: Terminal-first, enterprise-grade security.
- Content calendar: blogs, comparisons, videos; weekly cadence.
- Beta program: recruit 50–100 devs; feedback loop; collect baseline data.

### Launch Week
- Day 1: Public release (blog, HN, social); founder post.
- Day 2–3: Content blitz (comparisons, videos, guest posts).
- Day 4–5: Community engagement (AMA, spaces, livestreams).
- Day 6: ProductHunt prep; assets & coordination.
- Day 7: ProductHunt launch; aggressive response & updates.

### Post-Launch (Months 1–3)
- Retention: weekly office hours; rapid bugfixes; monthly feature drops.
- Growth: ambassador program; partnerships; case studies.
- Metrics: stars, visits, downloads, retention, conversion; iterate GTM.
