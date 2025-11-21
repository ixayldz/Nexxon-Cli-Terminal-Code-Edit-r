export interface PolicyOverrides {
  [key: string]: unknown;
}

export interface AuthContext {
  type: 'bearer';
  token: string;
}

export interface ClaimsContext {
  sub: string;
  org: string;
  roles: string[];
}

export interface RequestEnvelope {
  api_version: '1.0';
  id: string;
  command: 'plan' | 'diff' | 'apply' | 'test' | 'search' | 'index' | 'log' | 'whoami' | 'undo' | 'validate';
  args: Record<string, unknown>;
  policy?: { overrides?: PolicyOverrides; override_mode?: 'restrictive' | 'admin'; override_reason?: string };
  auth?: AuthContext;
  context?: { claims?: ClaimsContext; session?: { id: string; started_at?: string } };
}

export interface ResponseEnvelope {
  api_version: '1.0';
  id: string;
  status: 'ok' | 'error' | 'in_progress';
  result?: Record<string, unknown>;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  logs?: { ts: string; level: 'info' | 'warn' | 'error'; msg: string }[];
  metrics?: { latency_ms: number };
  identity?: { sub: string; org: string; roles: string[] };
  policy_trace?: { effective_hash: string; decisions?: { action: string; subject: string; decision: string; rule: string }[] };
}
