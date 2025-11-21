// Policy package index - clean exports
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as YAML from 'yaml';

// Export enforcer and hierarchy
export { PolicyEnforcer, type PolicyConfig } from './enforcer.js';
export { PolicyHierarchy, type MergedPolicy } from './hierarchy.js';

// Types
export interface LoadResult<T> { data: T; errors: string[] }

// Helper function
function loadYaml<T>(p: string): T {
  const txt = fs.readFileSync(p, 'utf8');
  return YAML.parse(txt) as T;
}

// Load and validate YAML against JSON schema
export function loadAndValidate<T>(dataPath: string, schemaPath: string): LoadResult<T> {
  const data = loadYaml<T>(dataPath);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new (Ajv as any)({ strict: true, allErrors: true, validateSchema: false });
  (addFormats as any)(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(data);
  const errors = ok ? [] : (validate.errors || []).map((e: any) => `${e.instancePath || '(root)'}: ${e.message}`);
  return { data, errors };
}

// Find schema directory
export function findSchemaDir(): string {
  const env = process.env.NEXXON_SCHEMA_DIR;
  if (env && fs.existsSync(env)) return env;
  const fallback = path.resolve(process.cwd(), '.nexxon', 'schemas');
  return fallback;
}
