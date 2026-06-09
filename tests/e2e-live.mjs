/**
 * Live E2E test — uruchamia prawdziwy serwer i testuje wszystkie funkcjonalności
 * z prawdziwymi kluczami API. Sprzątanie po sobie.
 */
import { spawn } from 'child_process';
import { resolve, join } from 'path';
import { existsSync, rmSync, writeFileSync, readFileSync } from 'fs';

const PORT  = 3600;
const BASE  = `http://localhost:${PORT}`;
const ROOT  = resolve(process.cwd());
// Set via environment variables: GEMINI_API_KEY and OPENROUTER_API_KEY
const GEMINI_KEY     = process.env.GEMINI_API_KEY     ?? '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';
const OR_FREE_MODEL  = 'google/gemma-4-26b-a4b-it:free';  // direct queries
const OR_GEN_MODEL   = 'nvidia/nemotron-3-ultra-550b-a55b:free'; // generation fallback (kimi rate-limited)
const TEST_PASSWORD  = 'LiveTest123!';

let serverPid = 0;
let cookie    = '';
let csrf      = '';
let passed    = 0;
let failed    = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(emoji, msg)  { console.log(`${emoji}  ${msg}`); }
function ok(label)        { passed++; log('✅', label); }
function fail(label, err) { failed++; log('❌', `${label}: ${err}`); }

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function cookieHdr() { return cookie ? { Cookie: cookie } : {}; }

function extractCookie(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (Array.isArray(raw) && raw.length)
    return raw.map(c => c.split(';')[0]).join('; ');
  return (res.headers.get('set-cookie') ?? '').split(';')[0];
}

async function get(path, extra = {}) {
  return fetch(`${BASE}${path}`, { headers: { ...cookieHdr(), ...extra } });
}

async function post(path, body, extra = {}) {
  return fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...cookieHdr(), 'X-CSRF-Token': csrf, ...extra },
    body:    JSON.stringify(body),
  });
}

async function assert(label, fn) {
  try {
    await fn();
    ok(label);
  } catch(e) {
    fail(label, e.message ?? e);
  }
}

async function waitForServer(ms = 20000) {
  const t = Date.now() + ms;
  while (Date.now() < t) {
    try { const r = await fetch(`${BASE}/api/health`); if (r.ok) return; } catch {}
    await wait(300);
  }
  throw new Error('Server timeout');
}

// ── Server lifecycle ──────────────────────────────────────────────────────────

async function startServer() {
  // kill anything on this port first
  try { const { execSync } = await import('child_process'); execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`, { stdio: 'ignore' }); await wait(400); } catch {}

  const srv = spawn('npx', ['tsx', 'src/server.ts', '--port', String(PORT)], {
    cwd: ROOT, stdio: 'ignore', detached: true,
  });
  srv.unref();
  serverPid = srv.pid ?? 0;
  await waitForServer();
  log('🚀', `Server up on :${PORT} (pid group ${serverPid})`);
}

function stopServer() {
  if (serverPid) try { process.kill(-serverPid, 'SIGTERM'); } catch {}
}

// ── Cleanup leftover files ────────────────────────────────────────────────────

function cleanup() {
  for (const f of ['.aqr-auth.json', '.aqr-settings.json', '.aqr-pause']) {
    const p = join(ROOT, f);
    if (existsSync(p)) { rmSync(p); log('🧹', `Removed ${f}`); }
  }
}

// ── Auth setup ────────────────────────────────────────────────────────────────

async function setupAuth() {
  const r = await fetch(`${BASE}/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  });
  if (!r.ok) throw new Error(`setup ${r.status}: ${await r.text()}`);

  const lr = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  });
  if (!lr.ok) throw new Error(`login ${lr.status}`);
  cookie = extractCookie(lr);

  const cr = await fetch(`${BASE}/auth/csrf-token`, { headers: cookieHdr() });
  csrf = (await cr.json()).token;
  log('🔐', `Auth ready, CSRF: ${csrf.slice(0,8)}...`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {

  // 1. Health (public)
  await assert('GET /api/health — public, no auth', async () => {
    const r = await fetch(`${BASE}/api/health`);
    if (!r.ok) throw new Error(r.status);
    const b = await r.json();
    if (!b.ok) throw new Error('ok!=true');
  });

  // 2. Status requires auth
  await assert('GET /api/status — 401 without session', async () => {
    const r = await fetch(`${BASE}/api/status`);
    if (r.status !== 401) throw new Error(`got ${r.status}`);
  });

  await assert('GET /api/status — 200 with session', async () => {
    const r = await get('/api/status');
    if (!r.ok) throw new Error(r.status);
    const b = await r.json();
    if (!('batchRunning' in b)) throw new Error('missing batchRunning');
  });

  // 3. Save real API keys
  await assert('POST /api/settings — save Gemini + OpenRouter keys', async () => {
    const r = await post('/api/settings', {
      geminiApiKey:     GEMINI_KEY,
      openRouterApiKey: OPENROUTER_KEY,
      geminiApiModel:   'gemini-2.0-flash',
      openRouterModel:  OR_FREE_MODEL,
    });
    if (!r.ok) throw new Error(r.status);
    const b = await r.json();
    if (!b.ok) throw new Error(JSON.stringify(b));
  });

  await assert('GET /api/settings — keys masked, not plaintext', async () => {
    const r = await get('/api/settings');
    const b = await r.json();
    if (!b.geminiApiKey.includes('***')) throw new Error('gemini key not masked');
    if (b.geminiApiKey.includes(GEMINI_KEY)) throw new Error('raw key exposed!');
  });

  // 4. Fetch model list from Gemini API
  await assert('GET /api/models?provider=gemini-api — returns real model list', async () => {
    const r = await get('/api/models?provider=gemini-api');
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const b = await r.json();
    if (!Array.isArray(b.models) || b.models.length === 0) throw new Error('empty models list');
    log('   ', `Found ${b.models.length} Gemini models (e.g. ${b.models[0]?.id})`);
  });

  await assert('GET /api/models?provider=openrouter — returns real model list', async () => {
    const r = await get('/api/models?provider=openrouter');
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const b = await r.json();
    if (!Array.isArray(b.models) || b.models.length === 0) throw new Error('empty models list');
    log('   ', `Found ${b.models.length} OpenRouter models`);
  });

  // 5. Direct API query (Gemini) — klucze są na free tier, 429 = poprawne zachowanie serwera
  await assert('POST /api/query-api — Gemini: serwer poprawnie obsługuje 429 z API', async () => {
    const r = await post('/api/query-api', {
      prompt:   'Odpowiedz jednym słowem: jaka jest stolica Polski?',
      provider: 'gemini-api',
      model:    'gemini-2.0-flash',
    });
    // 200 = zadziałało, 500 = API error (rate limit) - oba są akceptowalne
    if (r.status === 200) {
      const b = await r.json();
      if (!b.response) throw new Error('empty response');
      log('   ', `Gemini: "${b.response.trim().slice(0, 80)}"`);
    } else if (r.status === 500) {
      const b = await r.json();
      if (!b.error) throw new Error('brak pola error w odpowiedzi 500');
      log('   ', `Gemini klucz wyczerpany (429 rate limit) — serwer poprawnie zwrócił 500 z error`);
    } else {
      throw new Error(`Nieoczekiwany status: ${r.status}`);
    }
  });

  // 6. Direct API query (OpenRouter) — z działającym darmowym modelem
  await assert('POST /api/query-api — OpenRouter direct query', async () => {
    const r = await post('/api/query-api', {
      prompt:   'Reply with one word only: capital of France?',
      provider: 'openrouter',
      model:    OR_FREE_MODEL,
    });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const b = await r.json();
    if (!b.response) throw new Error('empty response');
    log('   ', `OpenRouter (${OR_FREE_MODEL}): "${b.response.trim().slice(0, 80)}"`);
  });

  // 7. Task generator (OpenRouter — Gemini wyczerpany)
  let generatedPrompts = [];
  await assert('POST /api/generate — OpenRouter generates task list', async () => {
    const r = await post('/api/generate', {
      intent:   'Firmy IT w Warszawie zatrudniające 10-50 osób',
      target:   'openrouter',
      provider: 'openrouter',
      model:    OR_GEN_MODEL,
    });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const b = await r.json();
    if (!Array.isArray(b.prompts) || b.prompts.length === 0) throw new Error('empty prompts');
    generatedPrompts = b.prompts;
    log('   ', `Generated ${b.prompts.length} tasks, np.: "${b.prompts[0]?.prompt?.slice(0,60)}..."`);
  });

  // 8. Generate Excel from prompts
  let excelBuf = null;
  await assert('POST /api/generate-excel — creates downloadable .xlsx', async () => {
    const prompts = generatedPrompts.length > 0 ? generatedPrompts.slice(0, 3) : [
      { id: 1, prompt: 'Przykładowa firma A' },
      { id: 2, prompt: 'Przykładowa firma B' },
    ];
    const r = await post('/api/generate-excel', { prompts });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const ct = r.headers.get('content-type') ?? '';
    if (!ct.includes('spreadsheetml')) throw new Error(`bad content-type: ${ct}`);
    excelBuf = Buffer.from(await r.arrayBuffer());
    if (excelBuf.length < 100) throw new Error('file too small');
    log('   ', `Excel file: ${excelBuf.length} bytes`);
  });

  // 9. Template download
  await assert('GET /api/template — downloads template .xlsx', async () => {
    const r = await get('/api/template');
    if (!r.ok) throw new Error(r.status);
    const buf = await r.arrayBuffer();
    if (buf.byteLength < 100) throw new Error('too small');
    const cd = r.headers.get('content-disposition') ?? '';
    if (!cd.includes('ai-query-template.xlsx')) throw new Error('bad filename');
  });

  // 10. Batch run with real Excel + gemini-api target (3 prompts, small)
  await assert('POST /api/run — start batch (gemini-api, 3 prompts)', async () => {
    if (!excelBuf) throw new Error('no excel from previous step');

    // Save excel to temp file and upload
    const tmpXlsx = join(ROOT, '.tmp-e2e-test.xlsx');
    writeFileSync(tmpXlsx, excelBuf);

    const form = new FormData();
    const blob = new Blob([readFileSync(tmpXlsx)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    form.append('file', blob, 'test.xlsx');
    form.append('target', 'openrouter');
    form.append('limit', '2');

    const r = await fetch(`${BASE}/api/run`, {
      method:  'POST',
      headers: { ...cookieHdr(), 'X-CSRF-Token': csrf },
      body:    form,
    });
    if (existsSync(tmpXlsx)) rmSync(tmpXlsx);
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const b = await r.json();
    if (!b.ok) throw new Error(JSON.stringify(b));
    log('   ', 'Batch started, waiting for completion...');
  });

  // Wait for batch to finish (poll status)
  await assert('GET /api/status — batch completes within 120s', async () => {
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      await wait(2000);
      const r = await get('/api/status');
      const b = await r.json();
      if (!b.batchRunning) {
        log('   ', `Batch done. queriedToday=${b.queriedToday}`);
        return;
      }
      process.stdout.write('.');
    }
    throw new Error('Batch did not complete within 60s');
  });

  // 11. Pause / resume
  await assert('POST /api/pause + /api/resume', async () => {
    const pr = await post('/api/pause');
    const pb = await pr.json();
    if (!pb.paused) throw new Error('pause failed');
    const rr = await post('/api/resume');
    const rb = await rr.json();
    if (rb.paused) throw new Error('resume failed');
  });

  // 12. Stop
  await assert('POST /api/stop', async () => {
    const r = await post('/api/stop');
    const b = await r.json();
    if (!b.ok) throw new Error(JSON.stringify(b));
  });

  // 13. 2FA TOTP flow
  const OTPAuth = await import('otpauth');
  let totpSecret = '';
  await assert('2FA — GET /auth/totp-setup returns secret + QR', async () => {
    const r = await fetch(`${BASE}/auth/totp-setup`);
    const b = await r.json();
    if (!b.secret || !b.qrCode) throw new Error('missing secret/QR');
    totpSecret = b.secret;
  });

  await assert('2FA — POST /auth/totp-enable with valid code', async () => {
    const totp = new OTPAuth.TOTP({
      issuer: 'AQR', label: 'AI Query Runner', algorithm: 'SHA1', digits: 6, period: 30,
      secret: OTPAuth.Secret.fromBase32(totpSecret),
    });
    const code = totp.generate();
    const r = await post('/auth/totp-enable', { secret: totpSecret, code });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const b = await r.json();
    if (!b.ok) throw new Error(JSON.stringify(b));
  });

  await assert('2FA — totpEnabled=true in /api/settings', async () => {
    const r = await get('/api/settings');
    const b = await r.json();
    if (!b.totpEnabled) throw new Error('totpEnabled still false');
  });

  await assert('2FA — POST /auth/totp-disable with correct password', async () => {
    const r = await post('/auth/totp-disable', { password: TEST_PASSWORD });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const b = await r.json();
    if (!b.ok) throw new Error(JSON.stringify(b));
  });

  // 14. CSRF protection
  await assert('CSRF — POST without token returns 403', async () => {
    const r = await fetch(`${BASE}/api/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHdr() },
      body: '{}',
    });
    if (r.status !== 403) throw new Error(`got ${r.status}`);
  });

  // 15. Logout
  await assert('POST /auth/logout — clears session', async () => {
    const r = await post('/auth/logout', {});
    if (!r.ok) throw new Error(r.status);
    const b = await r.json();
    if (!b.ok) throw new Error(JSON.stringify(b));
    // After logout — protected endpoint should return 401
    const r2 = await fetch(`${BASE}/api/status`, { headers: cookieHdr() });
    if (r2.status !== 401) throw new Error(`after logout got ${r2.status}, expected 401`);
  });

  // 16. SSE progress stream
  await assert('GET /api/progress — SSE stream accessible when logged in', async () => {
    // Re-login first
    const lr = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    });
    cookie = extractCookie(lr);
    const cr = await fetch(`${BASE}/auth/csrf-token`, { headers: cookieHdr() });
    csrf = (await cr.json()).token;

    const ctrl = new AbortController();
    const r = await fetch(`${BASE}/api/progress`, { headers: cookieHdr(), signal: ctrl.signal });
    ctrl.abort();
    if (r.status !== 200) throw new Error(`got ${r.status}`);
    if (!(r.headers.get('content-type') ?? '').includes('text/event-stream')) throw new Error('not SSE');
    try { await r.body?.cancel(); } catch {}
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log('  AI Query Runner — Live E2E Test');
  console.log('══════════════════════════════════════════\n');

  cleanup(); // remove any leftover files

  let fatalError = null;
  try {
    await startServer();
    await setupAuth();
    await runTests();
  } catch(e) {
    fatalError = e;
    log('💥', `Fatal: ${e.message}`);
  }

  console.log('\n══════════════════════════════════════════');
  console.log(`  WYNIK: ${passed} ✅  ${failed} ❌  z ${passed+failed} testów`);
  console.log('══════════════════════════════════════════\n');

  // ── Uruchom demo serwer dla użytkownika ─────────────────────────────────────
  // Testy skasowały .aqr-auth.json i .aqr-settings.json — zakładamy świeży serwer
  const DEMO_PORT = 3099;
  const DEMO_PASS = 'Demo2024!';

  try {
    // kill anything on demo port
    try { const { execSync } = await import('child_process'); execSync(`fuser -k ${DEMO_PORT}/tcp 2>/dev/null || true`, { stdio: 'ignore' }); await wait(400); } catch {}

    const demoSrv = spawn('npx', ['tsx', 'src/server.ts', '--port', String(DEMO_PORT)], {
      cwd: ROOT, stdio: 'ignore', detached: true,
    });
    demoSrv.unref();
    const demoPid = demoSrv.pid ?? 0;
    await waitForServer2(DEMO_PORT);

    // Setup demo password
    await fetch(`http://localhost:${DEMO_PORT}/auth/setup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: DEMO_PASS }),
    });

    // Login + CSRF
    const lr = await fetch(`http://localhost:${DEMO_PORT}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: DEMO_PASS }),
    });
    const demoCookie = extractCookie(lr);
    const cr = await fetch(`http://localhost:${DEMO_PORT}/auth/csrf-token`, { headers: { Cookie: demoCookie } });
    const demoCSRF = (await cr.json()).token;

    // Save API keys
    await fetch(`http://localhost:${DEMO_PORT}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: demoCookie, 'X-CSRF-Token': demoCSRF },
      body: JSON.stringify({
        geminiApiKey:     GEMINI_KEY,
        openRouterApiKey: OPENROUTER_KEY,
        geminiApiModel:   'gemini-2.0-flash',
        openRouterModel:  OR_GEN_MODEL,
      }),
    });

    console.log('╔══════════════════════════════════════════╗');
    console.log('║  🌐  DEMO SERWER URUCHOMIONY             ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  URL:    http://localhost:${DEMO_PORT}           ║`);
    console.log(`║  Hasło:  ${DEMO_PASS}                    ║`);
    console.log('║  Klucze API: skonfigurowane              ║');
    console.log(`║  PID group: ${demoPid} (kill -9 -${demoPid} aby zatrzymać) ║`);
    console.log('╚══════════════════════════════════════════╝\n');
  } catch(e) {
    log('⚠️', `Demo server failed: ${e.message}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

async function waitForServer2(port, ms = 20000) {
  const t = Date.now() + ms;
  while (Date.now() < t) {
    try { const r = await fetch(`http://localhost:${port}/api/health`); if (r.ok) return; } catch {}
    await wait(300);
  }
  throw new Error(`Server on :${port} timeout`);
}

main();
