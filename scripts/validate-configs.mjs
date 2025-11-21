#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

function usage() {
  console.error('Usage: node scripts/validate-configs.mjs --file <data.(yaml|json)> --schema <schema.json>');
  process.exit(2);
}

function loadSchema(schemaPath) {
  try {
    const txt = fs.readFileSync(schemaPath, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    console.error(`Schema load error: ${schemaPath}\n${e.message}`);
    process.exit(1);
  }
}

function loadData(dataPath) {
  try {
    const txt = fs.readFileSync(dataPath, 'utf8');
    const ext = path.extname(dataPath).toLowerCase();
    if (ext === '.yaml' || ext === '.yml') {
      return YAML.parse(txt);
    }
    return JSON.parse(txt);
  } catch (e) {
    console.error(`Data load error: ${dataPath}\n${e.message}`);
    process.exit(1);
  }
}

function printErrors(errors) {
  for (const err of errors ?? []) {
    const instancePath = err.instancePath || '(root)';
    const message = err.message || 'validation error';
    console.error(`- ${instancePath}: ${message}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  let dataPath = null;
  let schemaPath = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--file') {
      dataPath = args[++i];
    } else if (a === '--schema') {
      schemaPath = args[++i];
    }
  }
  if (!dataPath || !schemaPath) usage();

  const schema = loadSchema(schemaPath);
  const data = loadData(dataPath);

  const ajv = new Ajv({ strict: true, allErrors: true, validateSchema: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(data);
  if (ok) {
    console.log(`OK: ${dataPath} ✓`);
    process.exit(0);
  } else {
    console.error(`Validation failed: ${dataPath}`);
    printErrors(validate.errors);
    process.exit(3);
  }
}

main();

