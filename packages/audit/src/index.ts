import fs from 'node:fs';
import path from 'node:path';

export interface AuditEntry {
  ts: string;
  actor: 'user' | 'agent';
  action: string;
  target?: { path?: string; op?: string };
  policy?: { decision: 'allow' | 'deny' | 'confirm'; rule?: string };
  result?: { status: 'ok' | 'error'; details?: string };
}

export function writeAudit(entry: AuditEntry, cwd = process.cwd()) {
  const dir = path.join(cwd, '.nexxon');
  const file = path.join(dir, 'audit.log');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(file, JSON.stringify(entry) + '\n', 'utf8');
}

