#!/usr/bin/env node
/**
 * index.ts — unified entry point for portable binary.
 *
 * When compiled with `bun build --compile`, this file is the single binary
 * entry point. It decides whether to start the web server or run a batch job:
 *
 *   ./ai-query-runner              → starts the panel server (default)
 *   ./ai-query-runner --batch ...  → runs a batch job (spawned by server.ts)
 */

const isBatch = process.argv.includes('--batch');

if (isBatch) {
  // Strip the --batch flag and run main.ts logic in-process
  process.argv = process.argv.filter(a => a !== '--batch');
  await import('./main.js');
} else {
  await import('./server.js');
}
