#!/usr/bin/env node
//@ts-check
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = resolve(__dirname, '..');

async function run() {
  // Build demo bundle
  await build({
    entryPoints: [resolve(root, 'demoEditableSVGuitar', 'app.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2018'],
    sourcemap: true,
    outfile: resolve(root, 'demoEditableSVGuitar', 'bundle.js'),
    logLevel: 'info',
  });
    
  const demoSize = readFileSync(resolve(root, 'demoEditableSVGuitar', 'bundle.js')).length;
  console.log(`EditableSVGuitar demo bundle written: ${demoSize} bytes`);
}

run().catch((err) => { console.error(err); process.exit(1); });
