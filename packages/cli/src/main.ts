#!/usr/bin/env node
// Enhanced CLI main with global flags per PRD Section 7.1.1
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { callRuntime, callRuntimeEnvelope } from './runtimeClient.js';
import { render } from 'ink';
import React from 'react';
import { DiffPreview, ConfirmDialog } from '@nexxon/ui';
// Defer CI imports to compiled dist to avoid path alias issues at runtime
import { ciInit, ciRun } from '../../runtime/dist/ci/commands.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

// Global state for flags
let globalValidatePolicy = false;
let globalAdminOverride: string | undefined;
const globalJsonEnv = process.env.NEXXON_JSON === '1' || process.env.NEXXON_JSON === 'true';


// Helper to add policy/auth to runtime requests
function buildRuntimeRequest(command: string, args: Record<string, unknown>) {
  const req: any = {
    api_version: '1.0',
    id: Math.random().toString(36),
    command,
    args
  };

  // Add policy overrides if admin override is used
  if (globalAdminOverride) {
    req.policy = {
      override_mode: 'admin' as const,
      override_reason: globalAdminOverride
    };
  }

  // Add context (placeholder - will be enhanced with RBAC)
  req.context = {
    claims: {
      sub: process.env.USER || 'local-user',
      org: 'local',
      roles: globalAdminOverride ? ['OrgAdmin'] : ['Developer']
    }
  };

  return req;
}

// Helper to handle validation mode
async function executeWithValidation(
  command: string,
  args: Record<string, unknown>,
  action: () => Promise<void>
) {
  if (globalValidatePolicy) {
    // Validation-only mode (runtime 'validate' command)
    const req = buildRuntimeRequest('validate', { dry_run: true, validate_only: true });
    const res = await callRuntimeEnvelope(req);

    if (res.status === 'error') {
      console.error('Policy validation failed:');
      console.error(res.error?.message);
      process.exit(4); // PRD: exit code 4 for invalid_args/policy violations
    }

    console.log('Policy OK');
    const trace = (res.result as any)?.policy_trace as any;
    if (trace?.effective_hash) {
      console.log(`Effective policy: ${trace.effective_hash}`);
    }
    process.exit(0);
  }

  // Normal execution
  await action();
}

program
  .command('init')
  .description('Initialize index (.gitignore-aware)')
  .option('--vectors', 'Build vector embeddings for semantic search')
  .action(async (options) => {
    await executeWithValidation('index', { vectors: options.vectors }, async () => {
      const req = buildRuntimeRequest('index', { paths: ['.'], use_gitignore: true, vectors: options.vectors });
      const res = await callRuntimeEnvelope(req);
      console.log(JSON.stringify(res.result || {}, null, 2));
    });
  });

program
  .command('search')
  .description('Search repository (text/semantic)')
  .argument('<query>')
  .option('--semantic', 'Use semantic search (vector-based)')
  .action(async (query, options) => {
    await executeWithValidation('search', { q: query, semantic: options.semantic }, async () => {
      const req = buildRuntimeRequest('search', { q: query, semantic: options.semantic || false });
      const res = await callRuntimeEnvelope(req);
      console.log(JSON.stringify(res.result || {}, null, 2));
    });
  });

program
  .command('plan')
  .description('Create a plan for a given task')
  .argument('<task>')
  .option('--output <file>', 'Save plan to file')
  .option('--model <provider>', 'LLM provider to use (openai|anthropic|deepseek)')
  .action(async (task, options) => {
    await executeWithValidation('plan', { task }, async () => {
      const req = buildRuntimeRequest('plan', { task, model: options.model });
      const res = await callRuntimeEnvelope(req);

      const outPath = options.output || 'artifacts/plan.json';
      const fs = await import('node:fs');
      const path = await import('node:path');
      const dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(res.result || {}, null, 2));
      console.log(`Plan saved to ${outPath}`);
    });
  });

// Generate diff for a file and optionally apply
program
  .command('diff')
  .description('Generate a diff for a file from a task')
  .requiredOption('--task <task>', 'Task description')
  .requiredOption('--file <file>', 'Target file path')
  .option('--apply', 'Apply changes after confirmation')
  .option('--no-interactive', 'Skip confirmation prompt when applying')
  .action(async (options) => {
    const { task, file } = options as { task: string; file: string };
    await executeWithValidation('diff', { task, file }, async () => {
      const req = buildRuntimeRequest('diff', { task, file });
      const res = await callRuntimeEnvelope(req);
      if (res.status !== 'ok' || !res.result) {
        console.error('Error:', res.error?.message || 'Failed to generate diff');
        process.exit(1);
      }

      const patch = (res.result as any).patch as string;
      const hasChanges = (res.result as any).hasChanges as boolean;
      const newContent = (res.result as any).new_content as string;

      if (!hasChanges) {
        console.log('No changes proposed.');
        return;
      }

      // Show patch to user
      console.log('\n--- Proposed Patch ---\n');
      console.log(patch);

      if (options.apply) {
        let confirmed = true;
        if (options.interactive !== false) {
          // Simple confirmation prompt
          const rl = await import('node:readline');
          const { stdin, stdout } = process;
          const rli = rl.createInterface({ input: stdin, output: stdout });
          await new Promise<void>((resolve) => {
            rli.question(`Apply changes to ${file}? [y/N] `, (answer) => {
              confirmed = /^y(es)?$/i.test(answer.trim());
              rli.close();
              resolve();
            });
          });
        }

        if (!confirmed) {
          console.log('Cancelled by user.');
          return;
        }

        const applyReq = buildRuntimeRequest('apply', { file, content: newContent, dry_run: false });
        const applyRes = await callRuntimeEnvelope(applyReq);
        if (applyRes.status !== 'ok') {
          console.error('Apply failed:', applyRes.error?.message);
          process.exit(1);
        }
        console.log('Changes applied.');
      }
    });
  });

program
  .command('diff')
  .description('Generate unified diff for proposed changes')
  .option('--task <task>', 'Task description for code generation')
  .option('--file <file>', 'Target file path')
  .option('--patch <file>', 'Save unified diff to file (default artifacts/patch.diff)')
  .option('--no-interactive', 'Disable interactive UI')
  .action(async (options) => {
    if (!options.task || !options.file) {
      console.error('Error: --task and --file are required');
      process.exit(4); // PRD: exit code 4 for invalid_args
    }

    await executeWithValidation('diff', { task: options.task, file: options.file }, async () => {
      const req = buildRuntimeRequest('diff', { task: options.task, file: options.file });
      const res = await callRuntimeEnvelope(req);

      if (res.status === 'ok' && res.result) {
        const patch = ((res.result as any)?.patch as string) || '';
        const outPath = options.patch || 'artifacts/patch.diff';
        const fs = await import('node:fs');
        const path = await import('node:path');
        const dir = path.dirname(outPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (patch) fs.writeFileSync(outPath, patch, 'utf8');

        if (options.interactive !== false && patch) {
          render(React.createElement(DiffPreview as any, { patch, fileName: options.file } as any));
        } else {
          console.log(patch || 'No changes');
          if (patch) console.log(`Patch saved to ${outPath}`);
        }
      } else {
        console.error('Error:', res.error?.message);
        process.exit(1);
      }
    });
  });

program
  .command('apply')
  .description('Apply diff with explicit user approval')
  .option('--file <file>', 'File to apply changes to')
  .option('--content <content>', 'New file content')
  .option('--dry-run', 'Do not write changes, only preview')
  .option('--no-interactive', 'Skip confirmation dialog')
  .action(async (options) => {
    if (!options.file || !options.content) {
      console.error('Error: --file and --content are required');
      process.exit(4); // PRD: exit code 4
    }

    await executeWithValidation('apply', { file: options.file, content: options.content }, async () => {
      if (options.interactive !== false && !options.dryRun) {
        let confirmed = false;
        const { waitUntilExit } = render(
          React.createElement(ConfirmDialog, {
            message: `Apply changes to ${options.file}?`,
            onConfirm: () => { confirmed = true; },
            onCancel: () => { confirmed = false; }
          })
        );

        await waitUntilExit();
        if (!confirmed) {
          console.log('❌ Cancelled by user');
          process.exit(0);
        }
      }

      const req = buildRuntimeRequest('apply', {
        file: options.file,
        content: options.content,
        dry_run: options.dryRun || false
      });
      const res = await callRuntimeEnvelope(req);
      console.log(JSON.stringify(res.result || {}, null, 2));
    });
  });

// Simple iteration loop: diff -> apply -> test (P1)
program
  .command('iterate')
  .description('Iterate: propose change -> apply -> test (max N loops)')
  .requiredOption('--task <task>', 'Task description')
  .requiredOption('--file <file>', 'Target file path')
  .option('--test-cmd <cmd>', 'Test command', 'npm test')
  .option('--max-loops <n>', 'Max iterations', '2')
  .option('--no-interactive', 'Do not show interactive UI during apply')
  .action(async (options) => {
    const maxLoops = parseInt(options.maxLoops);
    await executeWithValidation('diff', { task: options.task, file: options.file }, async () => {
      let currentTask = options.task as string;
      for (let i = 1; i <= maxLoops; i++) {
        console.log(`Iteration ${i}/${maxLoops}: generating diff...`);
        const diffReq = buildRuntimeRequest('diff', { task: currentTask, file: options.file });
        const diffRes = await callRuntimeEnvelope(diffReq);
        if (diffRes.status !== 'ok' || !diffRes.result) {
          console.error('Diff failed:', diffRes.error?.message);
          process.exit(1);
        }
        const patch = (diffRes.result as any).patch as string;
        const newContent = (diffRes.result as any).new_content as string;
        const hasChanges = (diffRes.result as any).hasChanges as boolean;
        if (!hasChanges || !newContent) {
          console.log('No further changes proposed.');
          break;
        }

        console.log('Applying changes...');
        const applyReq = buildRuntimeRequest('apply', { file: options.file, content: newContent, dry_run: false });
        const applyRes = await callRuntimeEnvelope(applyReq);
        if (applyRes.status !== 'ok') {
          console.error('Apply failed:', applyRes.error?.message);
          process.exit(1);
        }

        console.log('Running tests...');
        const testReq = buildRuntimeRequest('test', { cmd: options.testCmd, timeout: 300000 });
        const testRes = await callRuntimeEnvelope(testReq);
        if (testRes.status === 'ok' && (testRes.result as any)?.success) {
          console.log('Tests passed.');
          return;
        }

        const stderr = (testRes.result as any)?.stderr || '';
        const stdout = (testRes.result as any)?.stdout || '';
        console.log('Tests failed, preparing next iteration...');
        currentTask = `${options.task}\nFix failing tests using these logs (latest):\nStderr:\n${stderr}\nStdout:\n${stdout}`;
      }
      console.error('Max iterations reached without passing tests.');
      process.exit(3);
    });
  });

program
  .command('test')
  .description('Run user-defined test command')
  .option('--cmd <cmd>', 'Test command to execute', 'npm test')
  .option('--timeout <ms>', 'Test timeout in milliseconds', '300000')
  .action(async (options) => {
    await executeWithValidation('test', { cmd: options.cmd }, async () => {
      const req = buildRuntimeRequest('test', { cmd: options.cmd, timeout: parseInt(options.timeout) });
      const res = await callRuntimeEnvelope(req);

      if (res.status === 'ok' && res.result) {
        console.log(`Exit code: ${res.result.exit_code}`);
        console.log(`Success: ${res.result.success}`);
        if (res.result.stdout) console.log('\nStdout:\n', res.result.stdout);
        if (res.result.stderr) console.error('\nStderr:\n', res.result.stderr);

        // PRD: exit code 3 for test failures
        if (!res.result.success) {
          process.exit(3);
        }
      } else {
        console.error('Error:', res.error?.message);
        process.exit(1);
      }
    });
  });

program
  .command('log')
  .description('View audit log')
  .option('--json', 'JSON output')
  .option('--limit <n>', 'Number of entries to show', '50')
  .action(async (options) => {
    await executeWithValidation('log', { limit: parseInt(options.limit) }, async () => {
      const req = buildRuntimeRequest('log', { limit: parseInt(options.limit) });
      const res = await callRuntimeEnvelope(req);

      if (options.json || globalJsonEnv) {
        console.log(JSON.stringify(res.result || {}, null, 2));
      } else {
        const entries = (res.result?.entries || []) as any[];
        if (entries.length === 0) {
          console.log('No audit log entries found');
        } else {
          entries.forEach((entry: any) => {
            console.log(`[${entry.ts}] ${entry.actor} → ${entry.action} (${entry.result.status})`);
          });
        }
      }
    });
  });

program
  .command('whoami')
  .description('Print identity & effective policy hash')
  .option('--policy-trace', 'Show policy decisions')
  .option('--json', 'JSON output')
  .action(async (options) => {
    const req = buildRuntimeRequest('whoami', { policy_trace: options.policyTrace });
    const res = await callRuntimeEnvelope(req);

    if (options.json || globalJsonEnv) {
      console.log(JSON.stringify(res.result || {}, null, 2));
    } else {
      if (res.result?.identity) {
        console.log('Identity:', res.result.identity);
      }
      if (options.policyTrace) {
        const trace = (res.result as any)?.policy_trace;
        if (trace) {
          console.log('Effective Policy:', trace.effective_hash);
          const decisions = trace.decisions || [];
          if (decisions.length) {
            console.log('Decisions:');
            decisions.forEach((d: any) => console.log(`- ${d.action}: ${d.subject} -> ${d.decision} (${d.rule})`));
          }
        } else if (res.result?.policy) {
          console.log('Policy:', res.result.policy);
        }
      }
    }
  });

program
  .command('undo')
  .description('Revert last applied patch (steps configurable)')
  .option('--steps <n>', 'Number of apply operations to revert', '1')
  .action(async (options) => {
    await executeWithValidation('undo', { steps: parseInt(options.steps) }, async () => {
      const req = buildRuntimeRequest('undo', { steps: parseInt(options.steps) });
      const res = await callRuntimeEnvelope(req);

      if (res.status === 'ok' && res.result) {
        if (res.result.reverted) {
          console.log(`✓ Successfully reverted ${res.result.steps} changes via ${res.result.method}`);
        } else {
          console.log(`✗ Failed to revert: ${res.result.message || 'Unknown error'}`);
          if (res.result.conflicts) {
            console.log('Conflicts:', res.result.conflicts);
          }
        }
      } else {
        console.error('Error:', res.error?.message);
        process.exit(1);
      }
    });
  });

// CI/CD commands
const ci = program.command('ci').description('CI/CD integration commands');

ci.command('init')
  .description('Generate CI workflow file')
  .option('--provider <provider>', 'CI provider (github|gitlab)', 'github')
  .option('--force', 'Overwrite existing files')
  .action((options) => {
    const result = ciInit({
      provider: options.provider as any,
      force: options.force
    });
    console.log(JSON.stringify(result, null, 2));
  });

ci.command('run')
  .description('Run Nexxon in CI mode')
  .option('--task <task>', 'Task description')
  .option('--dry-run', 'Do not apply changes')
  .action(async (options) => {
    const result = await ciRun({
      task: options.task,
      dryRun: options.dryRun
    });
    console.log(JSON.stringify(result, null, 2));
  });

// Handle validation-only mode at program level
if (process.argv.includes('--validate-policy') && process.argv.length === 3) {
  // Standalone validation: nexxon --validate-policy
  (async () => {
    const req = buildRuntimeRequest('validate', { validate_only: true });
    const res = await callRuntimeEnvelope(req);
    if (res.status === 'ok') {
      console.log('Policy OK', res.result?.policy_trace ? `(${(res.result as any).policy_trace.effective_hash})` : '');
      process.exit(0);
    } else {
      console.error('Policy validation failed:', res.error?.message);
      process.exit(4);
    }
  })();
}

// Export program for testing
export { program };

// Only parse if not interactive mode (interactive mode handled above)
if (process.argv.length > 2) {
  program.parse(process.argv);
}
