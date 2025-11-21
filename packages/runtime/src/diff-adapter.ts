const diffPath = process.env.NODE_ENV === 'production'
  ? '../../diff/dist/index.js'
  : '@nexxon/diff/src/index.js';

const diffMod: any = await (import(diffPath as any) as Promise<any>);

export const buildUnifiedDiff = diffMod.buildUnifiedDiff as typeof diffMod.buildUnifiedDiff;

