import http from 'node:http';
import { randomUUID } from 'node:crypto';
import type { RequestEnvelope, ResponseEnvelope } from '@nexxon/shared/src/types.js';

export interface ClientOptions {
  port?: number;
  token?: string;
}

export function callRuntime(
  command: RequestEnvelope['command'],
  args: Record<string, unknown> = {},
  opts: ClientOptions & { policy?: RequestEnvelope['policy']; context?: RequestEnvelope['context'] } = {}
): Promise<ResponseEnvelope> {
  const port = opts.port || Number(process.env.NEXXON_PORT || 7777);
  const reqBody: RequestEnvelope = {
    api_version: '1.0',
    id: randomUUID(),
    command,
    args,
    policy: opts.policy,
    auth: opts.token ? { type: 'bearer', token: opts.token } : undefined,
    context: opts.context || {}
  };
  return callRuntimeEnvelope(reqBody, { port, token: opts.token });
}

export function callRuntimeEnvelope(reqBody: RequestEnvelope, opts: ClientOptions = {}): Promise<ResponseEnvelope> {
  const port = opts.port || Number(process.env.NEXXON_PORT || 7777);
  const body = JSON.stringify(reqBody);
  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port,
    path: '/api/v1',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8')) as ResponseEnvelope;
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Helper to build runtime request (for interactive mode)
export function buildRuntimeRequest(command: string, args: Record<string, unknown>): RequestEnvelope {
  return {
    api_version: '1.0',
    id: randomUUID(),
    command: command as any,  // Type assertion for dynamic commands
    args,
    context: {}
  };
}

// Check if runtime is running
export async function checkRuntimeStatus(port?: number): Promise<boolean> {
  const runtimePort = port || Number(process.env.NEXXON_PORT || 7777);

  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: runtimePort,
      path: '/health',
      method: 'GET',
      timeout: 1000
    }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}
