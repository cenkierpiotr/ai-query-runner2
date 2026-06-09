#!/usr/bin/env node
import { Command } from 'commander';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from './config/config.js';
import { bridge } from './browser/BrowserBridge.js';
import { executeWithLimits, getQueueStats } from './queue/QueryQueue.js';
import { readQueriesFromExcel } from './input/ExcelReader.js';
import { writeResultsToExcel, createTemplateExcel } from './output/ExcelWriter.js';
import { readQueriesFromSheets } from './input/SheetsReader.js';
import { writeResultsToSheets, ensureSheetsHeader } from './output/SheetsWriter.js';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint } from './utils/checkpoint.js';
import { exportToCsv, exportToJson } from './output/CsvJsonExporter.js';
import { stripMarkdown } from './utils/textUtils.js';
import type { QueryRow } from './input/ExcelReader.js';

// ── SIGTERM: flush partial results on stop ─────────────────────────────────────
let _flushOutput: string | null = null;
let _flushRows:   QueryRow[]    = [];
process.on('SIGTERM', async () => {
  if (_flushOutput && _flushRows.length > 0) {
    try { await writeResultsToExcel(_flushOutput, _flushRows); } catch {}
  }
  process.exit(0);
});

// ── CLI ────────────────────────────────────────────────────────────────────────

const program = new Command();
program
  .name('ai-query-runner')
  .description('Wysyłaj zapytania z Excel/Google Sheets do AI i zapisuj wyniki')
  .version('1.0.0')
  .option('-i, --input <path>',     'Plik wejściowy (.xlsx) lub adres Sheets (sheets:ID:Sheet1!A:D)')
  .option('-o, --output <path>',    'Plik wyjściowy (domyślnie: nadpisuje wejściowy)')
  .option('-t, --target <name>',    'Serwis AI: gemini | perplexity | claude | google | copilot | mistral | deepseek | google-api | duckduckgo', 'gemini')
  .option('--targets <list>',       'Tryb A/B: kilka serwisów po przecinku, np. gemini,deepseek')
  .option('--headless',             'Przeglądarka bez okna (tryb headless)', false)
  .option('--skip-done',            'Pomiń wiersze ze statusem "done"', false)
  .option('--limit <n>',            'Przetwórz maksymalnie N wierszy', parseInt)
  .option('--preview',              'Testuj na 1 wierszu przed pełnym uruchomieniem', false)
  .option('--system-prompt <text>', 'Dodatkowe instrukcje dołączane do każdego promptu')
  .option('--json-format',          'Poproś AI o odpowiedź w formacie JSON (auto-rozbicie na kolumny)', false)
  .option('--export <formats>',     'Eksportuj wyniki: csv, json lub csv,json')
  .option('--strip-markdown',       'Usuń formatowanie Markdown z odpowiedzi AI (**, ##, ` itd.)', false)
  .option('--sch-start <n>',        'Godzina rozpoczęcia pracy (0-23)', parseInt)
  .option('--sch-end <n>',          'Godzina zakończenia pracy (0-23)', parseInt)
  .option('--sch-days <days>',      'Dni robocze po przecinku (1=Pon … 6=Sob, 0=Ndz)')
  .option('--pause-min <n>',        'Minimalna przerwa między zapytaniami (sekundy)', parseInt)
  .option('--pause-max <n>',        'Maksymalna przerwa między zapytaniami (sekundy)', parseInt)
  .option('--dry-run',              'Pokaż co zostałoby przetworzone — nie uruchamia AI', false)
  .option('--no-night-quiet',       'Wyłącz ciszę nocną')
  .option('--create-template <file>', 'Utwórz pusty plik szablonu Excel i zakończ')
  .option('--server',               'Uruchom jako serwer HTTP (tryb panel)')
  .option('--port <n>',             'Port serwera HTTP (domyślnie: 3535)', parseInt)
  .option('--status',               'Wyświetl statystyki kolejki i zakończ');

program.parse(process.argv);
const opts = program.opts();

// Apply CLI overrides to config
if (opts['target'])   (config as any).targetSite  = opts['target'];
if (opts['headless']) (config as any).headless     = true;
if (opts['port'])     (config as any).bridgePort   = opts['port'];
if (opts['schStart'] !== undefined) config.nightQuietStart = opts['schStart'] as number;
if (opts['schEnd']   !== undefined) config.nightQuietEnd   = opts['schEnd']   as number;
if (opts['schDays']  !== undefined) config.workingDays = String(opts['schDays']).split(',').map(Number);
if (opts['pauseMin'] !== undefined) config.pauseMinMs = (opts['pauseMin'] as number) * 1000;
if (opts['pauseMax'] !== undefined) config.pauseMaxMs = (opts['pauseMax'] as number) * 1000;

// ── Helpers ────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function isSheetsRef(s: string): boolean {
  return s.startsWith('sheets:') || (s.split(':').length >= 2 && !s.endsWith('.xlsx') && !s.endsWith('.xls'));
}

async function readQueries(input: string): Promise<QueryRow[]> {
  return isSheetsRef(input) ? readQueriesFromSheets(input) : readQueriesFromExcel(input);
}

async function writeResults(output: string, rows: QueryRow[], options?: { colOffset?: number; targetLabel?: string }): Promise<void> {
  if (isSheetsRef(output)) return writeResultsToSheets(output, rows);
  return writeResultsToExcel(output, rows, options);
}

function applyTemplateVars(text: string, row: QueryRow): string {
  return text.replace(/\{\{([A-Za-z])\}\}/g, (_, col) => row.rawCols[col.toUpperCase()] ?? '');
}

const REJECTION_PATTERNS = [
  /^(przepraszam|niestety)[,\s]/i,
  /^(i'm sorry|i cannot|i can't|as an ai[,\s])/i,
  /nie mogę (pomóc|odpowiedzieć|udzielić)/i,
  /this (request|content) (violates|is against)/i,
];

function isRejection(response: string): boolean {
  const preview = response.slice(0, 300);
  return REJECTION_PATTERNS.some(p => p.test(preview));
}


// ── Batch runner ───────────────────────────────────────────────────────────────

async function runBatch(colOffset = 0, targetLabel = ''): Promise<QueryRow[]> {
  const input  = opts['input']  as string;
  const output = (opts['output'] as string | undefined) ?? input;

  if (!input) { console.error('Błąd: --input jest wymagany.'); process.exit(1); }

  if (isSheetsRef(output)) await ensureSheetsHeader(output).catch(() => {});

  if (opts['preview']) {
    (opts as any)['limit'] = 3;
    console.log('[Runner] Tryb podglądu — przetwarzam tylko 3 wiersze\n');
  }

  console.log(`\n[Runner] Serwis: ${config.targetSite.toUpperCase()}${targetLabel} | Wejście: ${input} | Wyjście: ${output}`);

  // Dry-run
  if (opts['dryRun']) {
    let rows = await readQueries(input);
    if (opts['skipDone']) rows = rows.filter(r => r.status?.toLowerCase() !== 'done');
    if (opts['limit'])    rows = rows.slice(0, opts['limit'] as number);
    console.log(`[DryRun] Zostałoby przetworzonych ${rows.length} wierszy:`);
    rows.forEach((r, i) =>
      console.log(`  [${i + 1}] id=${r.id} status=${r.status ?? 'brak'} prompt=${r.prompt.slice(0, 80)}`)
    );
    console.log('[DryRun] Brak uruchomienia AI. Zakończono.');
    return [];
  }

  // Resolve executor
  const isApiTarget = ['google-api', 'duckduckgo', 'gemini-api', 'openrouter', 'ollama', 'groq', 'xai', 'custom'].includes(config.targetSite);
  let executeQuery: (prompt: string) => Promise<string>;

  if (config.targetSite === 'google-api') {
    const { googleCustomSearch } = await import('./api/GoogleSearchApi.js');
    executeQuery = googleCustomSearch;
    console.log('[Runner] Tryb: Google Custom Search API (bez przeglądarki)\n');
  } else if (config.targetSite === 'duckduckgo') {
    const { duckDuckGoSearch } = await import('./api/DuckDuckGoApi.js');
    executeQuery = duckDuckGoSearch;
    console.log('[Runner] Tryb: DuckDuckGo Search (bez przeglądarki, bez klucza)\n');
  } else if (config.targetSite === 'gemini-api') {
    const { queryGeminiApi } = await import('./api/GeminiApiTarget.js');
    if (!config.geminiApiKey) { console.error('[Runner] Brak GEMINI_API_KEY. Ustaw w .env lub w panelu ⚙️.'); process.exit(1); }
    const sysPrompt = (opts as any)['systemPrompt'] || undefined;
    executeQuery = (prompt) => queryGeminiApi(prompt, config.geminiApiKey!, config.geminiApiModel, sysPrompt);
    console.log(`[Runner] Tryb: Gemini API (${config.geminiApiModel}, bez przeglądarki)\n`);
  } else if (config.targetSite === 'openrouter') {
    const { queryOpenRouter } = await import('./api/OpenRouterTarget.js');
    if (!config.openRouterApiKey) { console.error('[Runner] Brak OPENROUTER_API_KEY. Ustaw w .env lub w panelu ⚙️.'); process.exit(1); }
    const sysPrompt = (opts as any)['systemPrompt'] || undefined;
    executeQuery = (prompt) => queryOpenRouter(prompt, config.openRouterApiKey!, config.openRouterModel, sysPrompt);
    console.log(`[Runner] Tryb: OpenRouter API (${config.openRouterModel}, bez przeglądarki)\n`);
  } else if (config.targetSite === 'ollama') {
    const { queryOllama } = await import('./api/OllamaTarget.js');
    const sysPrompt = (opts as any)['systemPrompt'] || undefined;
    executeQuery = (prompt) => queryOllama(prompt, config.ollamaModel ?? undefined, sysPrompt, config.ollamaUrl ?? undefined);
    console.log(`[Runner] Tryb: Ollama (${config.ollamaModel ?? 'domyślny'} @ ${config.ollamaUrl ?? 'localhost'}, bez przeglądarki)\n`);
  } else if (config.targetSite === 'groq') {
    const { queryGroq } = await import('./api/GroqTarget.js');
    if (!config.groqApiKey) { console.error('[Runner] Brak Groq API Key. Ustaw w panelu ⚙️.'); process.exit(1); }
    const sysPrompt = (opts as any)['systemPrompt'] || undefined;
    executeQuery = (prompt) => queryGroq(prompt, config.groqApiKey!, config.groqModel ?? undefined, sysPrompt);
    console.log(`[Runner] Tryb: Groq API (${config.groqModel ?? 'domyślny'}, bez przeglądarki)\n`);
  } else if (config.targetSite === 'xai') {
    const { queryXAI } = await import('./api/XAITarget.js');
    if (!config.xaiApiKey) { console.error('[Runner] Brak xAI API Key. Ustaw w panelu ⚙️.'); process.exit(1); }
    const sysPrompt = (opts as any)['systemPrompt'] || undefined;
    executeQuery = (prompt) => queryXAI(prompt, config.xaiApiKey!, config.xaiModel ?? undefined, sysPrompt);
    console.log(`[Runner] Tryb: xAI / Grok (${config.xaiModel ?? 'domyślny'}, bez przeglądarki)\n`);
  } else if (config.targetSite === 'custom') {
    const { queryCustomEndpoint } = await import('./api/CustomEndpointTarget.js');
    if (!config.customEndpointUrl) { console.error('[Runner] Brak Custom Endpoint URL. Ustaw w panelu ⚙️.'); process.exit(1); }
    const sysPrompt = (opts as any)['systemPrompt'] || undefined;
    executeQuery = (prompt) => queryCustomEndpoint(prompt, config.customEndpointUrl!, config.customEndpointKey ?? undefined, config.customEndpointModel ?? undefined, sysPrompt);
    console.log(`[Runner] Tryb: Custom Endpoint (${config.customEndpointUrl}, bez przeglądarki)\n`);
  } else {
    console.log('[Runner] Inicjalizuję przeglądarkę...\n');
    await bridge.init();
    if (!bridge.isReady) { console.error('[Runner] Bridge nie uruchomił się. Zakończono.'); process.exit(1); }
    executeQuery = (prompt) => bridge.ask(prompt);
  }

  // Read + filter rows
  let rows = await readQueries(input);

  // Checkpoint-based resume (more reliable than status column alone)
  const doneFromCheckpoint = opts['skipDone'] ? loadCheckpoint(input, config.targetSite) : null;
  if (doneFromCheckpoint) {
    rows = rows.filter(r => !doneFromCheckpoint.has(r.rowIndex));
  } else if (opts['skipDone']) {
    const before = rows.length;
    rows = rows.filter(r => r.status?.toLowerCase() !== 'done');
    console.log(`[Runner] Pomijam ${before - rows.length} ukończonych wierszy. Pozostało: ${rows.length}`);
  }

  if (opts['limit']) rows = rows.slice(0, opts['limit'] as number);

  if (rows.length === 0) {
    console.log('[Runner] Brak wierszy do przetworzenia. Zakończono.');
    if (!isApiTarget) await bridge.close();
    return [];
  }

  console.log(`[Runner] Przetwarzam ${rows.length} zapytań...\n`);

  const checkpointStartedAt = new Date().toISOString();
  const completedRowIndices: number[] = [];
  const processed: QueryRow[] = [];
  _flushOutput = output;
  _flushRows   = processed; // reference — updated in-place
  let done = 0, errors = 0;
  const PAUSE_FLAG = resolve(process.cwd(), '.aqr-pause');
  let wasPaused = false;

  for (let i = 0; i < rows.length; i++) {
    // Pause support — check flag file
    if (existsSync(PAUSE_FLAG)) {
      if (!wasPaused) {
        console.log('[Runner] ⏸ Wstrzymano — czekam na wznowienie...');
        wasPaused = true;
      }
      await sleep(2000);
      i--; // retry same row
      continue;
    }
    if (wasPaused) {
      console.log('[Runner] ▶ Wznawianie...');
      wasPaused = false;
    }

    const row = rows[i]!;
    const label = `[${i + 1}/${rows.length}]${targetLabel} ID=${row.id}`;
    console.log(`${label} Zapytanie: ${row.prompt.slice(0, 80)}${row.prompt.length > 80 ? '…' : ''}`);

    // Apply template variables
    let finalPrompt = applyTemplateVars(row.prompt, row);
    if (opts['systemPrompt']) {
      const sysPrompt = applyTemplateVars(opts['systemPrompt'] as string, row);
      finalPrompt = `${sysPrompt}\n\nInput / task:\n${finalPrompt}`;
    }
    if (opts['jsonFormat']) {
      finalPrompt += `\n\nIMPORTANT: Return the result ONLY as raw JSON, without \`\`\`json markers, without any surrounding text — raw JSON only.`;
    }

    // Retry loop
    let attempt = 0;
    let succeeded = false;
    while (attempt <= config.retryCount) {
      try {
        const raw = await executeWithLimits(
          () => executeQuery(finalPrompt),
          { respectNightQuiet: opts['nightQuiet'] !== false }
        );

        if (raw === 'TIMEOUT') throw new Error('TIMEOUT');

        let response = raw;
        if (opts['stripMarkdown']) response = stripMarkdown(response);
        if (config.maxResponseChars > 0 && response.length > config.maxResponseChars) {
          response = response.slice(0, config.maxResponseChars) + '\n[...]';
        }

        row.response = response;
        if (isRejection(response)) {
          row.status = 'rejected';
          console.log(`${label} → REJECTED (AI odmówiło)`);
        } else {
          row.status = 'done';
          console.log(`${label} → ${response.slice(0, 100).replace(/\n/g, ' ')}…`);
        }
        done++;
        succeeded = true;
        break;
      } catch (e: any) {
        attempt++;
        if (attempt <= config.retryCount) {
          console.warn(`${label} Retry ${attempt}/${config.retryCount}...`);
          await sleep(config.retryDelayMs);
        } else {
          console.error(`${label} → BŁĄD: ${e.message?.slice(0, 120)}`);
          row.response = '';
          row.status   = `error: ${e.message?.slice(0, 60)}`;
          errors++;
        }
      }
    }

    processed.push(row);

    // Checkpoint update
    if (succeeded || row.status === 'rejected') {
      completedRowIndices.push(row.rowIndex);
      saveCheckpoint(input, config.targetSite, completedRowIndices, checkpointStartedAt);
    }

    // Progressive save after every row (ensures partial results survive a stop)
    await writeResults(output, processed, { colOffset, targetLabel }).catch(e =>
      console.warn('[Runner] Zapis pośredni nieudany:', e.message?.slice(0, 60))
    );
  }

  await writeResults(output, processed, { colOffset, targetLabel });
  clearCheckpoint(input, config.targetSite);

  console.log(`\n[Runner] ✅ Ukończono: ${done} | ❌ Błędy: ${errors} | Łącznie: ${rows.length}`);
  const stats = getQueueStats();
  console.log(`[Runner] Zapytania dziś: ${stats.queriedToday}/${stats.dailyLimit}`);

  if (!isApiTarget) await bridge.close();
  return processed;
}

// ── HTTP bridge server (--server mode) ────────────────────────────────────────

async function runServer(): Promise<void> {
  const port = config.bridgePort;
  const { default: express } = await import('express');
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  bridge.initAsync();

  app.get('/status', (_req, res) => {
    res.json({ ...bridge.status, ...getQueueStats() });
  });

  app.post('/init', (_req, res) => {
    bridge.initAsync();
    res.json({ ok: true, state: bridge.status.state });
  });

  app.post('/ask', async (req, res) => {
    const { prompt } = req.body ?? {};
    if (!prompt) return void res.status(400).json({ error: 'prompt required' });
    if (!bridge.isReady) return void res.status(503).json({ error: `not ready: ${bridge.status.state}` });
    try {
      const response = await executeWithLimits(() => bridge.ask(prompt));
      res.json({ response });
    } catch (e: any) {
      res.status(503).json({ error: e.message });
    }
  });

  app.post('/close', async (_req, res) => {
    await bridge.close();
    res.json({ ok: true });
  });

  app.listen(port, '127.0.0.1', () => {
    console.log(`[Server] Nasłuchuję na :${port} | Serwis: ${config.targetSite} | Headless: ${config.headless}`);
  });
}

// ── Entry point ────────────────────────────────────────────────────────────────

(async () => {
  if (opts['createTemplate']) {
    await createTemplateExcel(opts['createTemplate'] as string);
    process.exit(0);
  }

  if (opts['status']) {
    console.log('Statystyki kolejki:', JSON.stringify(getQueueStats(), null, 2));
    process.exit(0);
  }

  if (opts['server']) {
    await runServer();
    return;
  }

  // A/B mode: run batch for each target with separate column pairs
  const targetList: string[] = opts['targets']
    ? String(opts['targets']).split(',').map(s => s.trim()).filter(Boolean)
    : [(opts['target'] as string | undefined) ?? 'gemini'];

  let finalResults: QueryRow[] = [];

  for (let ti = 0; ti < targetList.length; ti++) {
    (config as any).targetSite = targetList[ti];
    // Reset bridge target for each pass in A/B mode
    if (ti > 0) (bridge as any)._targetInstance = undefined;

    const colOffset   = ti * 2;
    const targetLabel = targetList.length > 1 ? ` [${targetList[ti]}]` : '';
    finalResults = await runBatch(colOffset, targetLabel);
  }

  // Optional CSV/JSON export
  if (opts['export'] && finalResults.length > 0) {
    const inputArg = opts['input'] as string;
    const outputArg = (opts['output'] as string | undefined) ?? inputArg;
    const base = isSheetsRef(outputArg) ? 'results' : outputArg.replace(/\.[^.]+$/, '');
    const formats = String(opts['export']);
    if (formats.includes('csv'))  exportToCsv(finalResults, base + '_results.csv');
    if (formats.includes('json')) exportToJson(finalResults, base + '_results.json');
  }

  process.exit(0);
})().catch(e => {
  console.error('[Runner] Błąd krytyczny:', e.message);
  process.exit(1);
});
