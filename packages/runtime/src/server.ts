// Enhanced runtime server with policy enforcement and session tracking
import Fastify from 'fastify';
import { scan } from '../../indexer/dist/index.js';
import { writeAudit, type AuditEntry } from '../../audit/dist/index.js';
import { PolicyEnforcer } from '../../policy/dist/enforcer.js';
import { findSchemaDir } from '../../policy/dist/index.js';
import { PolicyHierarchy } from '../../policy/dist/hierarchy.js';
import { SessionLedger } from '../../undo/dist/ledger.js';
import { UndoManager } from '../../undo/dist/undo-manager.js';
import { handlePlan } from './handlers/plan.js';
import { handleDiff } from './handlers/diff.js';
import { handleApply } from './handlers/apply.js';
import { handleTest } from './handlers/test.js';
import { handleLog } from './handlers/log.js';
import path from 'node:path';
import type { RequestEnvelope, ResponseEnvelope } from '@nexxon/shared/src/types.js';
import crypto from 'node:crypto';
import { setNetworkGuard } from './llm/provider.js';
import { NexxonErrorClass, createErrorResponse, ERROR_CODES } from './shared.js';

const server = Fastify({ logger: { level: 'info' }, bodyLimit: 1_048_576 });

// Global instances
let policyEnforcer: PolicyEnforcer | null = null;
let policyHierarchy: PolicyHierarchy | null = null;
const sessionLedger = new SessionLedger();
const undoManager = new UndoManager();

// Initialize policy enforcer
async function initPolicy() {
  try {
    const schemaDir = findSchemaDir();
    const policyPath = path.resolve(process.cwd(), 'policy.yaml');
    const schemaPath = path.join(schemaDir, 'policy.schema.json');

    policyEnforcer = await PolicyEnforcer.load(policyPath, schemaPath);
    policyHierarchy = new PolicyHierarchy();
    // Set current effective policy for hierarchy validation/merge
    policyHierarchy.setEffectivePolicy((policyEnforcer as any).getPolicy ? (policyEnforcer as any).getPolicy() : {});
    setNetworkGuard((host: string) => {
      const res = policyEnforcer!.checkNetwork(host);
      if (!res.allowed) {
        throw new NexxonErrorClass(
          ERROR_CODES.POLICY_DENIED,
          'policy',
          res.reason || `Network host not allowed: ${host}`,
          'network',
          { host }
        );
      }
    });
    console.log('✓ Policy loaded:', policyEnforcer.getEffectiveHash());
  } catch (error) {
    console.warn('⚠ Policy not loaded, running in permissive mode:', error);
  }
}

server.get('/health', async () => ({ status: 'ok', policy: policyEnforcer?.getEffectiveHash() || 'none' }));

async function handle(req: RequestEnvelope): Promise<ResponseEnvelope> {
  const start = Date.now();

  // Audit log the request (with redaction)
  const auditBase: AuditEntry = {
    ts: new Date().toISOString(),
    actor: 'user',
    action: req.command,
    target: { op: req.command },
    result: { status: 'ok' }
  };
  writeAudit(redactAudit(auditBase));

  let result: ResponseEnvelope;

  try {
    switch (req.command) {
      case 'validate': {
        const mode = (req.policy?.override_mode || 'restrictive') as 'restrictive' | 'admin';
        const overrides = (req.policy?.overrides || {}) as any;
        if (!policyHierarchy || !policyEnforcer) {
          return {
            api_version: '1.0',
            id: req.id,
            status: 'ok',
            result: { policy_trace: { effective_hash: 'sha256:none', decisions: [] } },
            metrics: { latency_ms: Date.now() - start }
          };
        }
        // Validate overrides against current effective policy
        const { valid, violations } = policyHierarchy.validateOverride(overrides, mode);
        if (!valid) {
          throw new NexxonErrorClass(
            ERROR_CODES.POLICY_INVALID_OVERRIDE,
            'policy',
            `Policy validation failed: ${violations.join('; ')}`,
            req.command,
            req.args
          );
        }
        // Merge project policy + session overrides to produce new hash
        const base = (policyEnforcer as any).getPolicy ? (policyEnforcer as any).getPolicy() : {};
        const merged = policyHierarchy.merge({ project: base, session: overrides });
        return {
          api_version: '1.0',
          id: req.id,
          status: 'ok',
          result: { policy_trace: { effective_hash: merged.hash, decisions: [] } },
          metrics: { latency_ms: Date.now() - start }
        };
      }
      case 'whoami': {
        const wantTrace = !!(req.args as any)?.policy_trace;
        const decisions: Array<{ action: string; subject: string; decision: string; rule: string }> = [];
        if (wantTrace && policyEnforcer) {
          const execCheck = policyEnforcer.checkExec('npm install');
          decisions.push({ action: 'exec', subject: 'npm install', decision: execCheck.requiresConfirm ? 'confirm' : (execCheck.allowed ? 'allow' : 'deny'), rule: execCheck.requiresConfirm ? 'exec.confirm' : (execCheck.allowed ? 'exec.allow' : 'exec.deny') });
          const netCheck = policyEnforcer.checkNetwork('registry.npmjs.org');
          decisions.push({ action: 'network', subject: 'registry.npmjs.org', decision: netCheck.allowed ? 'allow' : 'deny', rule: netCheck.allowed ? 'network.outbound' : 'network.blocked' });
        }
        result = {
          api_version: '1.0',
          id: req.id,
          status: 'ok',
          result: {
            identity: req.context?.claims || { sub: 'local', org: 'local', roles: ['Developer'] },
            policy: { effective_hash: policyEnforcer?.getEffectiveHash() || 'sha256:none' },
            policy_trace: wantTrace ? { effective_hash: policyEnforcer?.getEffectiveHash() || 'sha256:none', decisions } : undefined
          },
          metrics: { latency_ms: Date.now() - start }
        };
        break;
      }

      case 'index': {
        const cwd = process.cwd();
        const useVectors = req.args.vectors as boolean ?? false;
        const files = await scan({ cwd, useGitignore: true });
        const allowedFiles = policyEnforcer
          ? files.filter(f => policyEnforcer!.checkFSAccess(path.resolve(cwd, f)).allowed)
          : files;

        let vectorStats;
        if (useVectors) {
          const vectorPath = process.env.NODE_ENV === 'production' ? '../../vector/dist/index.js' : '@nexxon/vector/src/index.js';
          const { VectorSearch } = await (import(vectorPath as any) as Promise<any>);
          const vectorSearch = new VectorSearch();

          try {
            // Index only source files (ts, js, tsx, jsx, py, etc.)
            const sourceFiles = allowedFiles.filter(f =>
              /\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|h)$/.test(f)
            );

            vectorStats = await vectorSearch.indexFiles(sourceFiles);
            vectorSearch.close();
          } catch (error) {
            console.warn('Vector indexing failed:', error);
            // Don't fail the whole request for vector indexing failure
          }
        }

        result = {
          api_version: '1.0',
          id: req.id,
          status: 'ok',
          result: {
            indexed_files: allowedFiles.length,
            files: allowedFiles.slice(0, 100),
            vector_stats: vectorStats
          },
          metrics: { latency_ms: Date.now() - start }
        };
        break;
      }

      case 'search': {
        const query = (req.args.q as string) || '';
        const semantic = !!(req.args.semantic as boolean);

        if (semantic) {
          // Semantic vector search, with graceful fallback when embeddings not configured
          try {
            const { VectorSearch } = await import('@nexxon/vector/src/index.js');
            const vectorSearch = new VectorSearch();
            const results = await vectorSearch.search(query, 5);
            vectorSearch.close();

            result = {
              api_version: '1.0',
              id: req.id,
              status: 'ok',
              result: {
                matches: results.map(r => ({ file: r.file_path, text: r.chunk_text, relevance: 1 - r.distance }))
              },
              metrics: { latency_ms: Date.now() - start }
            };
          } catch (error) {
            // Fall back to simple text search if embeddings are not configured or error occurs
            const files = await scan({ cwd: process.cwd(), useGitignore: true });
            const q = query.toLowerCase();
            const matches: any[] = [];
            for (const f of files.slice(0, 2000)) { // cap files scanned to 2000
              try {
                const fp = path.resolve(process.cwd(), f);
                const content = (await import('node:fs')).default.readFileSync(fp, 'utf8');
                const idx = content.toLowerCase().indexOf(q);
                if (idx >= 0) {
                  const startIdx = Math.max(0, idx - 80);
                  const endIdx = Math.min(content.length, idx + q.length + 80);
                  matches.push({ file: f, snippet: content.slice(startIdx, endIdx) });
                }
                if (matches.length >= 50) break;
              } catch { /* ignore */ }
            }
            result = {
              api_version: '1.0',
              id: req.id,
              status: 'ok',
              result: { matches, note: 'semantic unavailable; used text fallback' },
              metrics: { latency_ms: Date.now() - start }
            };
          }
        } else {
          // Text search across repo
          const files = await scan({ cwd: process.cwd(), useGitignore: true });
          const q = query.toLowerCase();
          const matches: any[] = [];
          for (const f of files.slice(0, 2000)) { // cap
            try {
              const fp = path.resolve(process.cwd(), f);
              const content = (await import('node:fs')).default.readFileSync(fp, 'utf8');
              const idx = content.toLowerCase().indexOf(q);
              if (idx >= 0) {
                const startIdx = Math.max(0, idx - 80);
                const endIdx = Math.min(content.length, idx + q.length + 80);
                matches.push({ file: f, snippet: content.slice(startIdx, endIdx) });
              }
              if (matches.length >= 50) break;
            } catch { /* ignore */ }
          }
          result = {
            api_version: '1.0',
            id: req.id,
            status: 'ok',
            result: { matches },
            metrics: { latency_ms: Date.now() - start }
          };
        }
        break;
      }

      case 'plan':
        result = await handlePlan(req);
        break;

      case 'diff': {
        const filePath = (req.args as any)?.file as string | undefined;
        if (filePath && policyEnforcer) {
          const check = policyEnforcer.checkFSAccess(path.resolve(process.cwd(), filePath));
          if (!check.allowed) {
            throw new NexxonErrorClass(
              ERROR_CODES.POLICY_DENIED,
              'policy',
              check.reason || 'File access denied by policy',
              req.command,
              req.args
            );
          }
        }
        result = await handleDiff(req);
        break;
      }

      case 'apply': {
        const filePath = (req.args as any)?.file as string | undefined;
        if (filePath && policyEnforcer) {
          const check = policyEnforcer.checkFSAccess(path.resolve(process.cwd(), filePath));
          if (!check.allowed) {
            throw new NexxonErrorClass(
              ERROR_CODES.POLICY_DENIED,
              'policy',
              check.reason || 'Write denied by policy',
              req.command,
              req.args
            );
          }
        }
        result = await handleApply(req, sessionLedger);
        break;
      }

      case 'test': {
        const cmd = (req.args as any)?.cmd as string | undefined;
        if (cmd && policyEnforcer) {
          const execCheck = policyEnforcer.checkExec(cmd);
          if (!execCheck.allowed) {
            throw new NexxonErrorClass(
              ERROR_CODES.POLICY_DENIED,
              'policy',
              execCheck.reason || 'Command not allowed by policy',
              req.command,
              req.args
            );
          }
        }
        result = await handleTest(req);
        break;
      }

      case 'log':
        result = await handleLog(req);
        break;

      case 'undo': {
        const steps = (req.args.steps as number) || 1;
        const records = sessionLedger.getLastApplyRecords(steps);

        if (records.length === 0) {
          result = {
            api_version: '1.0',
            id: req.id,
            status: 'ok',
            result: { reverted: false, message: 'No apply records to undo' },
            metrics: { latency_ms: Date.now() - start }
          };
        } else {
          const undoResult = await undoManager.undo(records);
          result = {
            api_version: '1.0',
            id: req.id,
            status: 'ok',
            result: undoResult as unknown as Record<string, unknown>,
            metrics: { latency_ms: Date.now() - start }
          };
        }
        break;
      }

      default:
        throw new NexxonErrorClass(
          ERROR_CODES.UNKNOWN_COMMAND,
          'generic',
          `Unknown command: ${req.command}`,
          req.command,
          req.args
        );
    }
  } catch (error) {
    if (error instanceof NexxonErrorClass) {
      return createErrorResponse(req.id, error);
    }

    // Wrap unknown errors
    const wrappedError = new NexxonErrorClass(
      ERROR_CODES.RUNTIME_ERROR,
      'runtime',
      error instanceof Error ? error.message : 'Unknown error',
      req.command,
      req.args
    );
    return createErrorResponse(req.id, wrappedError);
  }

  return result;
}

server.post<{ Body: RequestEnvelope }>('/api/v1', async (request, reply) => {
  const body = request.body;
  try {
    const res = await handle(body);
    reply.send(res);
  } catch (e: any) {
    // This catch block handles errors that occur outside the handle function's try/catch
    // or if handle function throws something unexpected
    const error = e instanceof NexxonErrorClass ? e : new NexxonErrorClass(
      ERROR_CODES.RUNTIME_ERROR,
      'runtime',
      e?.message || 'Unknown error',
      body.command || 'unknown',
      body.args || {}
    );

    reply.code(500).send(createErrorResponse(body.id, error));
  }
});

const port = process.env.NEXXON_PORT ? Number(process.env.NEXXON_PORT) : 7777;

// Initialize and start
initPolicy().then(() => {
  sessionLedger.startSession('local');

  server.listen({ port, host: '127.0.0.1' }).then(() => {
    console.log(`✓ Runtime server listening on 127.0.0.1:${port}`);
    console.log(`✓ Session started: ${sessionLedger.getCurrentSession()}`);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  sessionLedger.endSession(sessionLedger.getCurrentSession());
  sessionLedger.close();
  process.exit(0);
});

// Redact audit entry fields based on policy redaction patterns
function redactAudit(entry: AuditEntry): AuditEntry {
  const cfg: any = (policyEnforcer && (policyEnforcer as any).getPolicy) ? (policyEnforcer as any).getPolicy() : undefined;
  const patterns: { name?: string; regex: string; action: 'hash' | 'redact' | 'drop' }[] = cfg?.redaction?.patterns || [];
  if (!patterns.length) return entry;

  function redactValue(v: any): any {
    if (typeof v !== 'string') return v;
    let out = v;
    for (const p of patterns) {
      try {
        const re = new RegExp(p.regex, 'g');
        out = out.replace(re, (m: string) => {
          switch (p.action) {
            case 'hash':
              return 'sha256:' + crypto.createHash('sha256').update(m).digest('hex');
            case 'redact':
              return '***REDACTED***';
            case 'drop':
              return '';
            default:
              return m;
          }
        });
      } catch {
        // ignore invalid regex
      }
    }
    return out;
  }

  function walk(obj: any): any {
    if (Array.isArray(obj)) return obj.map(walk);
    if (obj && typeof obj === 'object') {
      const res: any = {};
      for (const [k, v] of Object.entries(obj)) res[k] = walk(v);
      return res;
    }
    return redactValue(obj);
  }

  return walk(entry);
}
