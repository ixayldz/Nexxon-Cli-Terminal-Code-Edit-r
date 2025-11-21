import fg from 'fast-glob';
import ignore from 'ignore';
import fs from 'node:fs';
import path from 'node:path';

export interface IndexOptions {
  cwd: string;
  useGitignore?: boolean;
}

export async function scan(opts: IndexOptions): Promise<string[]> {
  const patterns = ['**/*'];
  const ig = (ignore as unknown as () => any)();
  if (opts.useGitignore) {
    const giPath = path.join(opts.cwd, '.gitignore');
    if (fs.existsSync(giPath)) ig.add(fs.readFileSync(giPath, 'utf8'));
  }
  const runner: any = (fg as any).default ?? (fg as any);
  const entries: string[] = await runner(patterns, { cwd: opts.cwd, dot: true, onlyFiles: true, unique: true });
  const filtered = entries.filter((e: string) => !ig.ignores(e));
  return filtered;
}
