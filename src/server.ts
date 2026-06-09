#!/usr/bin/env node
/**
 * server.ts — Web management panel + HTTP API
 *
 * GET  /             → panel zarządzania (wymaga sesji)
 * GET  /login        → strona logowania
 * GET  /setup        → pierwsze uruchomienie
 * POST /auth/login   → weryfikacja hasła + opcjonalnie TOTP
 * POST /auth/logout  → wylogowanie
 * POST /auth/setup   → jednorazowe tworzenie hasła
 * GET  /auth/totp-setup   → generuje QR kod 2FA
 * POST /auth/totp-enable  → aktywuje 2FA
 * POST /auth/totp-disable → dezaktywuje 2FA
 * POST /auth/change-password
 * GET  /auth/csrf-token   → CSRF token dla bieżącej sesji
 * GET  /api/status   → stan bridge + statystyki kolejki
 * GET  /api/health   → 200 jeśli gotowy (publiczny)
 * POST /api/run      → uruchom batch (multipart: plik Excel lub sheetsRef)
 * GET  /api/progress → SSE stream postępu bieżącego batch
 * POST /api/stop     → zatrzymaj bieżący batch
 */

import { Command } from 'commander';
import express from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { join, dirname, resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import { spawn, type ChildProcess } from 'child_process';
import { unlink, writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';

import { config } from './config/config.js';
import { loadSettings, saveSettings, type UserSettings } from './config/settingsStore.js';
import { getQueueStats } from './queue/QueryQueue.js';
import { createTemplateExcel } from './output/ExcelWriter.js';
import { generateTasks, type GeneratorProvider } from './api/TaskGenerator.js';
import { queryGeminiApi }     from './api/GeminiApiTarget.js';
import { queryOpenRouter }    from './api/OpenRouterTarget.js';
import { queryOllama, listOllamaModels } from './api/OllamaTarget.js';
import { queryCustomEndpoint } from './api/CustomEndpointTarget.js';
import { maskKey } from './auth/crypto.js';
import {
  loadAuthConfig, createAuth, verifyPassword, changePassword,
  isSetupComplete, getSessionSecret,
  generateTotpSecret, getTotpUri, verifyTotp, enableTotp, disableTotp,
} from './auth/authStore.js';
import { requireAuth, checkCsrf, requireSetup } from './auth/middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const PUBLIC    = join(__dirname, 'public');
const UPLOADS   = join(ROOT, '.tmp-uploads');
const PAUSE_FLAG = resolve(ROOT, '.aqr-pause');

// ── CLI ──────────────────────────────────────────────────────────────────────
const program = new Command();
program
  .name('ai-query-runner-server')
  .version('1.0.0')
  .option('-t, --target <name>',  'AI target', 'gemini')
  .option('-p, --port <n>',       'HTTP server port', parseInt)
  .option('--headless',           'Run browser in headless mode', false);

program.parse(process.argv);
const opts = program.opts();
if (opts['target'])   (config as any).targetSite = opts['target'];
if (opts['headless']) (config as any).headless    = true;
if (opts['port'])     (config as any).bridgePort  = opts['port'];

// ── Express setup ────────────────────────────────────────────────────────────
const app    = express();
const upload = multer({ dest: UPLOADS });

// Serve static assets publicly (CSS, JS, images) — but NOT index.html
app.use(express.static(PUBLIC, { index: false }));
app.use(express.json({ limit: '2mb' }));

// Session
app.use(session({
  secret:            getSessionSecret(),
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly:  true,
    sameSite:  'strict',
    maxAge:    8 * 60 * 60 * 1000, // 8 hours
  },
}));

// Rate limiter for login endpoint — 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs:            15 * 60 * 1000,
  max:                 10,
  skipSuccessfulRequests: true,
  message:             { error: 'Za dużo prób logowania. Spróbuj za 15 minut.' },
  standardHeaders:     true,
  legacyHeaders:       false,
});

// ── SSE ──────────────────────────────────────────────────────────────────────
const sseClients = new Set<express.Response>();
let   activeBatch: ChildProcess | null = null;
let   lastTmpFile: string | null = null;
let   lastOutputFile: string | null = null;

// ── Run history ───────────────────────────────────────────────────────────────
interface RunRecord {
  id:         string;
  timestamp:  number;
  target:     string;
  label:      string;   // file name or sheets ref
  rows:       number;
  exitCode:   number | null;
  stopped:    boolean;
  outputFile: string | null;
}

const HISTORY_FILE = resolve(ROOT, '.results', 'history.json');

function loadHistory(): RunRecord[] {
  try {
    mkdirSync(resolve(ROOT, '.results'), { recursive: true });
    if (!existsSync(HISTORY_FILE)) return [];
    return JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
  } catch { return []; }
}

function saveHistory(records: RunRecord[]): void {
  try {
    writeFileSync(HISTORY_FILE, JSON.stringify(records.slice(-200), null, 2));
  } catch {}
}

let currentRunRecord: RunRecord | null = null;

function broadcast(data: object): void {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const c of sseClients) {
    try { c.write(msg); } catch { sseClients.delete(c); }
  }
}

// ── Auth routes (no auth required) ───────────────────────────────────────────

app.get('/login', (req, res) => {
  if (!isSetupComplete()) return void res.redirect('/setup');
  if ((req.session as any)?.authenticated) return void res.redirect('/');
  res.sendFile(join(PUBLIC, 'login.html'));
});

app.get('/setup', (req, res) => {
  if (isSetupComplete()) return void res.redirect('/login');
  res.sendFile(join(PUBLIC, 'setup.html'));
});

// First-run: create password
app.post('/auth/setup', async (req, res) => {
  if (isSetupComplete()) return void res.status(403).json({ error: 'Konfiguracja już ukończona.' });
  const { password } = req.body ?? {};
  if (!password || password.length < 8) {
    return void res.status(400).json({ error: 'Hasło musi mieć minimum 8 znaków.' });
  }
  await createAuth(password);
  res.json({ ok: true });
});

// TOTP setup — generate secret + QR (no session required — called during setup wizard)
app.get('/auth/totp-setup', async (_req, res) => {
  const secret = generateTotpSecret();
  const uri    = getTotpUri(secret);
  const qrCode = await QRCode.toDataURL(uri);
  res.json({ secret, qrCode });
});

// TOTP enable — verify code then save (called from setup wizard OR from settings panel)
app.post('/auth/totp-enable', (req, res) => {
  const { secret, code } = req.body ?? {};
  if (!secret || !code) return void res.status(400).json({ error: 'Brak danych.' });
  if (!verifyTotp(String(code), String(secret))) {
    return void res.status(400).json({ error: 'Nieprawidłowy kod — sprawdź czy czas na telefonie jest zsynchronizowany.' });
  }
  enableTotp(String(secret));
  res.json({ ok: true });
});

// Login
app.post('/auth/login', loginLimiter, async (req, res) => {
  if (!isSetupComplete()) return void res.status(403).json({ error: 'Panel nie jest jeszcze skonfigurowany.' });
  const { password, totpCode } = req.body ?? {};
  const cfg = loadAuthConfig();
  if (!cfg) return void res.status(500).json({ error: 'Błąd konfiguracji.' });

  const passwordOk = await verifyPassword(String(password ?? ''), cfg.passwordHash);
  if (!passwordOk) {
    return void res.status(401).json({ error: 'Nieprawidłowe hasło.' });
  }

  if (cfg.totpEnabled) {
    if (!totpCode) return void res.status(200).json({ totpRequired: true });
    if (!verifyTotp(String(totpCode), cfg.totpSecret!)) {
      return void res.status(401).json({ error: 'Nieprawidłowy kod 2FA.' });
    }
  }

  const sess = req.session as any;
  sess.authenticated = true;
  sess.csrfToken     = randomBytes(24).toString('hex');
  res.json({ ok: true });
});

// Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

// ── Public health check (before auth walls — needed by tests and monitors) ────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, batchRunning: activeBatch !== null });
});

// ── All routes below require setup to be complete ────────────────────────────
app.use(requireSetup);
app.use('/api', requireAuth);
app.use('/auth/csrf-token', requireAuth);
app.use('/auth/totp-disable', requireAuth, checkCsrf);
app.use('/auth/change-password', requireAuth, checkCsrf);

// CSRF token for current session (fetched by app.js on load)
app.get('/auth/csrf-token', (req, res) => {
  const sess = req.session as any;
  if (!sess.csrfToken) sess.csrfToken = randomBytes(24).toString('hex');
  res.json({ token: sess.csrfToken });
});

// Change password
app.post('/auth/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!newPassword || newPassword.length < 8) {
    return void res.status(400).json({ error: 'Nowe hasło musi mieć minimum 8 znaków.' });
  }
  const ok = await changePassword(String(currentPassword ?? ''), String(newPassword));
  if (!ok) return void res.status(401).json({ error: 'Nieprawidłowe aktualne hasło.' });
  res.json({ ok: true });
});

// Disable 2FA
app.post('/auth/totp-disable', async (req, res) => {
  const { password } = req.body ?? {};
  const cfg = loadAuthConfig();
  if (!cfg) return void res.status(500).json({ error: 'Błąd konfiguracji.' });
  const ok = await verifyPassword(String(password ?? ''), cfg.passwordHash);
  if (!ok) return void res.status(401).json({ error: 'Nieprawidłowe hasło.' });
  disableTotp();
  res.json({ ok: true });
});

// ── Public route ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, batchRunning: activeBatch !== null });
});

// ── Protected API routes (CSRF on all POST) ───────────────────────────────────
app.use('/api', checkCsrf);

app.get('/', requireAuth, (_, res) => {
  res.sendFile(join(PUBLIC, 'index.html'));
});

app.get('/api/status', (_, res) => {
  res.json({
    target:       config.targetSite,
    batchRunning: activeBatch !== null,
    ...getQueueStats(),
  });
});

// Settings — read current values (API keys are masked in response)
app.get('/api/settings', (_req, res) => {
  const s   = loadSettings();
  const cfg = loadAuthConfig();
  res.json({
    dailyQueryLimit:  s.dailyQueryLimit  ?? config.dailyQueryLimit,
    pauseMinMs:       s.pauseMinMs       ?? config.pauseMinMs,
    pauseMaxMs:       s.pauseMaxMs       ?? config.pauseMaxMs,
    nightQuietStart:  s.nightQuietStart  ?? config.nightQuietStart,
    nightQuietEnd:    s.nightQuietEnd    ?? config.nightQuietEnd,
    headless:         s.headless         ?? config.headless,
    stripMarkdown:    s.stripMarkdown    ?? config.stripMarkdown,
    maxResponseChars: s.maxResponseChars ?? config.maxResponseChars,
    retryCount:       s.retryCount       ?? config.retryCount,
    retryDelayMs:     s.retryDelayMs     ?? config.retryDelayMs,
    googleCseId:      s.googleCseId      ?? config.googleCseId ?? '',
    openRouterModel:  s.openRouterModel  ?? config.openRouterModel,
    geminiApiModel:   s.geminiApiModel   ?? config.geminiApiModel,
    dbType:              s.dbType           ?? '',
    dbTable:             s.dbTable          ?? '',
    dbUrl:               s.dbUrl ? '***' : '',
    // Ollama
    ollamaUrl:           s.ollamaUrl        ?? 'http://localhost:11434',
    ollamaModel:         s.ollamaModel      ?? 'llama3.2',
    // Custom endpoint
    customEndpointUrl:   s.customEndpointUrl  ?? '',
    customEndpointModel: s.customEndpointModel ?? '',
    customEndpointKey:   s.customEndpointKey ? '***' : '',
    // Groq
    groqModel:           s.groqModel ?? 'llama-3.3-70b-versatile',
    groqApiKey:          s.groqApiKey ? '***' : '',
    // xAI
    xaiModel:            s.xaiModel ?? 'grok-3-mini',
    xaiApiKey:           s.xaiApiKey ? '***' : '',
    totpEnabled:         cfg?.totpEnabled   ?? false,
    // Keys are masked — never send raw values to browser
    googleApiKey:             maskKey(s.googleApiKey             ?? process.env['GOOGLE_API_KEY'] ?? ''),
    googleServiceAccountJson: (s.googleServiceAccountJson ?? config.googleServiceAccountJson ?? '') ? '***' : '',
    geminiApiKey:             maskKey(s.geminiApiKey             ?? config.geminiApiKey      ?? ''),
    openRouterApiKey:         maskKey(s.openRouterApiKey         ?? config.openRouterApiKey   ?? ''),
  });
});

// Settings — save
app.post('/api/settings', (req, res) => {
  try {
    const body    = req.body as UserSettings & Record<string, unknown>;
    const current = loadSettings();
    const MASKED  = '***';
    const allowed: (keyof UserSettings)[] = [
      'dailyQueryLimit', 'pauseMinMs', 'pauseMaxMs',
      'nightQuietStart', 'nightQuietEnd',
      'headless', 'stripMarkdown', 'maxResponseChars',
      'retryCount', 'retryDelayMs',
      'googleApiKey', 'googleCseId', 'googleServiceAccountJson',
      'geminiApiKey', 'openRouterApiKey', 'openRouterModel', 'geminiApiModel',
      'dbType', 'dbUrl', 'dbTable',
      'ollamaUrl', 'ollamaModel',
      'customEndpointUrl', 'customEndpointKey', 'customEndpointModel',
      'groqApiKey', 'groqModel',
      'xaiApiKey', 'xaiModel',
    ];
    const next: UserSettings = { ...current };
    for (const key of allowed) {
      if (!(key in body)) continue;
      const val = body[key];
      // Skip masked placeholders — keep existing value
      if (typeof val === 'string' && val === MASKED) continue;
      if (typeof val === 'string' && val.includes('***')) continue;
      (next as any)[key] = val;
    }
    saveSettings(next);
    // Apply immediately to live config
    const s = next;
    if (s.dailyQueryLimit  != null) (config as any).dailyQueryLimit  = s.dailyQueryLimit;
    if (s.pauseMinMs       != null) (config as any).pauseMinMs       = s.pauseMinMs;
    if (s.pauseMaxMs       != null) (config as any).pauseMaxMs       = s.pauseMaxMs;
    if (s.nightQuietStart  != null) (config as any).nightQuietStart  = s.nightQuietStart;
    if (s.nightQuietEnd    != null) (config as any).nightQuietEnd    = s.nightQuietEnd;
    if (s.headless         != null) (config as any).headless         = s.headless;
    if (s.stripMarkdown    != null) (config as any).stripMarkdown    = s.stripMarkdown;
    if (s.maxResponseChars != null) (config as any).maxResponseChars = s.maxResponseChars;
    if (s.retryCount       != null) (config as any).retryCount       = s.retryCount;
    if (s.retryDelayMs     != null) (config as any).retryDelayMs     = s.retryDelayMs;
    if (s.googleCseId      != null) (config as any).googleCseId      = s.googleCseId || null;
    if (s.googleServiceAccountJson != null) (config as any).googleServiceAccountJson = s.googleServiceAccountJson || null;
    if (s.geminiApiKey     != null) (config as any).geminiApiKey     = s.geminiApiKey || null;
    if (s.openRouterApiKey != null) (config as any).openRouterApiKey = s.openRouterApiKey || null;
    if (s.openRouterModel  != null) (config as any).openRouterModel  = s.openRouterModel || config.openRouterModel;
    if (s.geminiApiModel   != null) (config as any).geminiApiModel   = s.geminiApiModel  || config.geminiApiModel;
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch available models
app.get('/api/models', async (req, res) => {
  const provider = req.query['provider'] as string;
  try {
    if (provider === 'gemini-api') {
      if (!config.geminiApiKey) return void res.status(400).json({ error: 'Brak klucza Gemini API.' });
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiApiKey}`);
      const data = await r.json() as any;
      const models = (data.models ?? [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({ id: m.name.replace('models/', ''), name: m.displayName ?? m.name }));
      return void res.json({ models });
    }
    if (provider === 'openrouter') {
      const headers: Record<string, string> = {};
      if (config.openRouterApiKey) headers['Authorization'] = `Bearer ${config.openRouterApiKey}`;
      const r = await fetch('https://openrouter.ai/api/v1/models', { headers });
      const data = await r.json() as any;
      const models = (data.data ?? []).map((m: any) => ({ id: m.id, name: m.name ?? m.id }));
      return void res.json({ models });
    }
    if (provider === 'ollama') {
      const s = loadSettings();
      const names = await listOllamaModels(s.ollamaUrl ?? 'http://localhost:11434');
      return void res.json({ models: names.map(n => ({ id: n, name: n })) });
    }
    if (provider === 'groq') {
      if (!config.groqApiKey) return void res.status(400).json({ error: 'Brak klucza Groq API.' });
      const r = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${config.groqApiKey}` },
      });
      const data = await r.json() as any;
      const models = (data.data ?? []).map((m: any) => ({ id: m.id, name: m.id }));
      return void res.json({ models });
    }
    if (provider === 'xai') {
      if (!config.xaiApiKey) return void res.status(400).json({ error: 'Brak klucza xAI API.' });
      try {
        const r = await fetch('https://api.x.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${config.xaiApiKey}` },
        });
        const data = await r.json() as any;
        const fetched = (data.data ?? []).map((m: any) => ({ id: m.id, name: m.id }));
        if (fetched.length > 0) return void res.json({ models: fetched });
      } catch {}
      // Fallback to known xAI models
      const xaiModels = ['grok-3','grok-3-mini','grok-3-fast','grok-3-mini-fast','grok-2-1212','grok-2-vision-1212','grok-beta'];
      return void res.json({ models: xaiModels.map(id => ({ id, name: id })) });
    }
    res.status(400).json({ error: 'Nieznany provider.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Generate Excel from prompt list
app.post('/api/generate-excel', async (req, res) => {
  const { prompts } = req.body ?? {};
  if (!Array.isArray(prompts) || !prompts.length) {
    return void res.status(400).json({ error: 'Brak promptów.' });
  }
  const tmpPath = join(ROOT, `.tmp-generated-${Date.now()}.xlsx`);
  try {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Queries');
    const header = ws.addRow(['ID', 'Prompt', 'Response', 'Status']);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    for (const p of prompts) ws.addRow([p.id, p.prompt, '', 'pending']);
    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 80;
    ws.getColumn(3).width = 80;
    ws.getColumn(4).width = 12;
    await wb.xlsx.writeFile(tmpPath);
    const buf = readFileSync(tmpPath);
    unlink(tmpPath, () => {});
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="generated-tasks.xlsx"');
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Task Generator
app.post('/api/generate', async (req, res) => {
  const { intent, target, provider, model, outputFormat } = req.body ?? {};
  if (!intent?.trim()) return void res.status(400).json({ error: 'Podaj intencję.' });

  const VALID_PROVIDERS = ['gemini-api', 'openrouter', 'ollama', 'custom', 'groq', 'xai'];
  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return void res.status(400).json({ error: `provider musi być jednym z: ${VALID_PROVIDERS.join(', ')}.` });
  }

  const s = loadSettings();
  let apiKey = '';
  if (provider === 'gemini-api')  apiKey = config.geminiApiKey     ?? '';
  if (provider === 'openrouter')  apiKey = config.openRouterApiKey  ?? '';
  if (provider === 'custom')      apiKey = s.customEndpointKey      ?? '';
  if (provider === 'groq')        apiKey = s.groqApiKey             ?? '';
  if (provider === 'xai')         apiKey = s.xaiApiKey              ?? '';

  if (['gemini-api', 'openrouter', 'groq', 'xai'].includes(provider) && !apiKey) {
    return void res.status(400).json({ error: `Brak klucza API dla ${provider}. Ustaw go w ⚙️ Ustawienia.` });
  }
  if (provider === 'custom' && !s.customEndpointUrl) {
    return void res.status(400).json({ error: 'Brak URL custom endpoint. Skonfiguruj go w ⚙️ Ustawienia.' });
  }

  try {
    const prompts = await generateTasks(
      intent,
      target ?? 'gemini',
      provider as GeneratorProvider,
      apiKey,
      model,
      { ollamaUrl: s.ollamaUrl, customEndpointUrl: s.customEndpointUrl },
      outputFormat,
    );
    res.json({ prompts });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Direct API query
app.post('/api/query-api', async (req, res) => {
  const { prompt, provider, model, systemPrompt } = req.body ?? {};
  if (!prompt?.trim()) return void res.status(400).json({ error: 'Podaj prompt.' });

  const VALID = ['gemini-api', 'openrouter', 'ollama', 'custom', 'groq', 'xai'];
  if (!provider || !VALID.includes(provider)) {
    return void res.status(400).json({ error: `provider musi być jednym z: ${VALID.join(', ')}.` });
  }

  const s = loadSettings();
  try {
    let response = '';
    if (provider === 'gemini-api') {
      if (!config.geminiApiKey) return void res.status(400).json({ error: 'Brak klucza Gemini API.' });
      response = await queryGeminiApi(prompt, config.geminiApiKey, model ?? config.geminiApiModel, systemPrompt);
    } else if (provider === 'openrouter') {
      if (!config.openRouterApiKey) return void res.status(400).json({ error: 'Brak klucza OpenRouter.' });
      response = await queryOpenRouter(prompt, config.openRouterApiKey, model ?? config.openRouterModel, systemPrompt);
    } else if (provider === 'groq') {
      if (!s.groqApiKey) return void res.status(400).json({ error: 'Brak klucza Groq. Ustaw go w ⚙️ Ustawienia.' });
      const { queryGroq } = await import('./api/GroqTarget.js');
      response = await queryGroq(prompt, s.groqApiKey, model ?? s.groqModel ?? 'llama-3.3-70b-versatile', systemPrompt);
    } else if (provider === 'xai') {
      if (!s.xaiApiKey) return void res.status(400).json({ error: 'Brak klucza xAI. Ustaw go w ⚙️ Ustawienia.' });
      const { queryXAI } = await import('./api/XAITarget.js');
      response = await queryXAI(prompt, s.xaiApiKey, model ?? s.xaiModel ?? 'grok-3-mini', systemPrompt);
    } else if (provider === 'ollama') {
      response = await queryOllama(prompt, model ?? s.ollamaModel ?? 'llama3.2', systemPrompt, s.ollamaUrl ?? 'http://localhost:11434');
    } else if (provider === 'custom') {
      if (!s.customEndpointUrl) return void res.status(400).json({ error: 'Brak URL custom endpoint.' });
      response = await queryCustomEndpoint(prompt, s.customEndpointUrl, s.customEndpointKey ?? '', model ?? s.customEndpointModel ?? '', systemPrompt);
    }
    res.json({ response });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// SSE progress stream
app.get('/api/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  sseClients.add(res);
  broadcast({ type: 'connected' });
  req.on('close', () => sseClients.delete(res));
});

// Download Excel template
app.get('/api/template', async (_req, res) => {
  const tmpPath = join(ROOT, `.tmp-template-${Date.now()}.xlsx`);
  try {
    await createTemplateExcel(tmpPath);
    const buf = readFileSync(tmpPath);
    unlink(tmpPath, () => {});
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ai-query-template.xlsx"');
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Stop batch
app.post('/api/stop', (_req, res) => {
  if (activeBatch) {
    // Save record immediately — don't wait for close event (process may not flush)
    if (currentRunRecord) {
      currentRunRecord.stopped  = true;
      currentRunRecord.exitCode = null;
      currentRunRecord.rows     = 0; // partial — will be overwritten by close if it fires
      const history = loadHistory();
      history.push(currentRunRecord);
      saveHistory(history);
      currentRunRecord = null;
    }
    activeBatch.kill('SIGTERM');
    activeBatch = null;
  }
  try { unlinkSync(PAUSE_FLAG); } catch {}
  res.json({ ok: true });
});

// Pause / resume
app.post('/api/pause',  (_req, res) => { try { writeFileSync(PAUSE_FLAG, ''); } catch {} res.json({ ok: true, paused: true }); });
app.post('/api/resume', (_req, res) => { try { unlinkSync(PAUSE_FLAG); } catch {} res.json({ ok: true, paused: false }); });

// Start batch
app.post('/api/run', upload.single('file'), async (req, res) => {
  if (activeBatch) {
    return void res.status(409).json({ error: 'Zadanie już trwa — najpierw zatrzymaj bieżące.' });
  }

  const {
    target, skipDone, headless: hl, limit, sheetsRef, sheetsOut,
    jsonFormat, systemPrompt, schStart, schEnd, schDays, pauseMin, pauseMax,
    targets, exportFormats, preview, stripMarkdown,
  } = req.body ?? {};
  const file = req.file;

  const VALID_TARGETS = ['gemini', 'perplexity', 'claude', 'google', 'copilot', 'mistral', 'deepseek', 'google-api', 'duckduckgo', 'gemini-api', 'openrouter', 'ollama', 'groq', 'xai', 'custom'];
  if (target && !VALID_TARGETS.includes(target)) {
    return void res.status(400).json({ error: `Invalid target "${target}". Valid: ${VALID_TARGETS.join(', ')}` });
  }

  let inputArg: string;
  let outputArg: string | null = null;
  if (file) {
    // Validate filename to prevent path traversal
    const safeName = basename(file.path) + '.xlsx';
    const safePath = join(UPLOADS, safeName);
    const { renameSync, mkdirSync } = await import('fs');
    renameSync(file.path, safePath);
    inputArg  = safePath;
    lastTmpFile = safePath;
    // Write results to a separate output file so we can serve it after completion
    const resultsDir = join(ROOT, '.results');
    mkdirSync(resultsDir, { recursive: true });
    outputArg = join(resultsDir, `result-${Date.now()}.xlsx`);
    lastOutputFile = outputArg;
    // Pre-copy input → output so ExcelWriter can open an existing file on first write
    copyFileSync(safePath, outputArg);
  } else if (sheetsRef) {
    if (!/^sheets:[A-Za-z0-9_-]+:.+/.test(sheetsRef)) {
      return void res.status(400).json({ error: 'Nieprawidłowy format Sheets. Użyj: sheets:SPREADSHEET_ID:Arkusz!A:D' });
    }
    inputArg    = sheetsRef;
    lastTmpFile = null;
    lastOutputFile = null;
  } else {
    return void res.status(400).json({ error: 'Wymagany plik Excel lub adres Google Sheets.' });
  }

  const args: string[] = ['tsx', 'src/main.ts', '--input', inputArg, '--target', target || 'gemini'];
  if (outputArg)        args.push('--output', outputArg);
  else if (sheetsOut)   args.push('--output', sheetsOut);
  if (skipDone === '1') args.push('--skip-done');
  if (hl === '1')       args.push('--headless');
  if (limit && parseInt(limit) > 0) args.push('--limit', limit);
  if (jsonFormat === '1') args.push('--json-format');
  if (systemPrompt)     args.push('--system-prompt', systemPrompt);
  if (schStart)         args.push('--sch-start', schStart);
  if (schEnd)           args.push('--sch-end', schEnd);
  if (schDays)          args.push('--sch-days', schDays);
  if (pauseMin)         args.push('--pause-min', pauseMin);
  if (pauseMax)         args.push('--pause-max', pauseMax);
  if (targets)              args.push('--targets', targets);
  if (exportFormats)        args.push('--export', exportFormats);
  if (preview === '1')      args.push('--preview');
  if (stripMarkdown === '1') args.push('--strip-markdown');

  // Create history record for this run
  const runId = `run-${Date.now()}`;
  const runLabel = file ? (file.originalname || 'plik.xlsx') : (sheetsRef ?? 'arkusz');
  currentRunRecord = {
    id:         runId,
    timestamp:  Date.now(),
    target:     target || 'gemini',
    label:      runLabel,
    rows:       0,
    exitCode:   null,
    stopped:    false,
    outputFile: outputArg,
  };

  res.json({ ok: true });

  activeBatch = spawn('npx', args, { cwd: ROOT, env: { ...process.env }, stdio: 'pipe' });

  let doneCount = 0;
  const totalRx = /Przetwarzam (\d+) zapytań|Processing (\d+) queries/;
  const doneRx  = /\[(\d+)\/(\d+)\]/;

  function handleOutput(raw: string, level?: string): void {
    broadcast({ type: 'log', text: raw, level });
    const tm = raw.match(totalRx);
    if (tm) broadcast({ type: 'prog', done: 0, total: parseInt(tm[1] ?? tm[2] ?? '0') });
    const dm = raw.match(doneRx);
    if (dm) {
      doneCount = parseInt(dm[1]);
      broadcast({ type: 'prog', done: doneCount, total: parseInt(dm[2]) });
    }
  }

  activeBatch.stdout?.on('data', (d: Buffer) => handleOutput(d.toString()));
  activeBatch.stderr?.on('data', (d: Buffer) => handleOutput(d.toString(), 'error'));
  activeBatch.on('close', (code) => {
    const fileExists = !!(lastOutputFile && existsSync(lastOutputFile));
    broadcast({ type: 'done', code, hasFile: fileExists });
    activeBatch = null;
    if (lastTmpFile) { unlink(lastTmpFile, () => {}); lastTmpFile = null; }
    if (currentRunRecord) {
      // Normal completion — save full record
      currentRunRecord.exitCode = code ?? 0;
      currentRunRecord.rows     = doneCount;
      const history = loadHistory();
      history.push(currentRunRecord);
      saveHistory(history);
      currentRunRecord = null;
    } else {
      // Stopped — update rows count in the already-saved record
      const history = loadHistory();
      const last = history[history.length - 1];
      if (last?.stopped) {
        last.rows = doneCount;
        saveHistory(history);
      }
    }
  });
});

// Download last result file (legacy — for the run panel button)
app.get('/api/download-result', requireAuth, (_req, res) => {
  if (!lastOutputFile || !existsSync(lastOutputFile)) {
    return void res.status(404).json({ error: 'Brak pliku wynikowego.' });
  }
  res.download(lastOutputFile, 'wyniki.xlsx');
});

// History list
app.get('/api/history', requireAuth, (_req, res) => {
  const records = loadHistory().reverse(); // newest first
  res.json(records.map(r => ({
    ...r,
    hasFile: !!(r.outputFile && existsSync(r.outputFile)),
  })));
});

// Download result by run ID
app.get('/api/download-result/:id', requireAuth, (req, res) => {
  const records = loadHistory();
  const record  = records.find(r => r.id === req.params.id);
  if (!record || !record.outputFile) {
    return void res.status(404).json({ error: 'Nie znaleziono wyników dla tego uruchomienia.' });
  }
  if (!existsSync(record.outputFile)) {
    return void res.status(404).json({ error: 'Plik wynikowy został usunięty.' });
  }
  const safeName = `wyniki-${record.target}-${new Date(record.timestamp).toISOString().slice(0,10)}.xlsx`;
  res.download(record.outputFile, safeName);
});

// ── Start ────────────────────────────────────────────────────────────────────
const port = config.bridgePort;

app.listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}`;
  console.log(`\n[Server] ✅  Listening on :${port}`);
  if (!isSetupComplete()) {
    console.log(`[Server] ⚠️  Pierwsze uruchomienie — skonfiguruj hasło: ${url}/setup`);
  } else {
    console.log(`[Server] 🌐  Panel: ${url}`);
  }
});

process.on('SIGTERM', () => { if (activeBatch) activeBatch.kill('SIGTERM'); process.exit(0); });
process.on('SIGINT',  () => { if (activeBatch) activeBatch.kill('SIGTERM'); process.exit(0); });
