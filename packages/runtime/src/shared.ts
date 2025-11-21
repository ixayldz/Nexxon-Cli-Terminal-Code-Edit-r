// Runtime-safe bridge to shared module (types + values)
// Uses dynamic path selection so compiled dist can resolve without workspace path aliases
const sharedPath = process.env.NODE_ENV === 'production'
  ? '../../shared/dist/index.js'
  : '@nexxon/shared/src/index.js';

// Top-level await is supported in our Node target
const shared: any = await (import(sharedPath as any) as Promise<any>);

export const NexxonErrorClass = shared.NexxonErrorClass as typeof shared.NexxonErrorClass;
export const createErrorResponse = shared.createErrorResponse as typeof shared.createErrorResponse;
export const ERROR_CODES = shared.ERROR_CODES as typeof shared.ERROR_CODES;

