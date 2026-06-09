import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import { join, resolve } from 'path';
import { existsSync, rmSync, readFileSync } from 'fs';
import * as OTPAuth from 'otpauth';

const PORT = 3597;
const BASE = `http://localhost:${PORT}`;
const ROOT = resolve(process.cwd());
const AUTH_FILE = join(ROOT, '.aqr-auth.json');

let server: ChildProcess;
let serverPid = 0;
let sessionCookie = '';
let csrfToken    = '';

async function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function cookieHeader(): Record<string, string> {
  return sessionCookie ? { Cookie: sessionCookie } : {};
}

function csrfHeader(): Record<string, string> {
  return csrfToken ? { 'X-CSRF-Token': csrfToken } : {};
}

async function get(path: string, extraHeaders: Record<string, string> = {}) {
  return fetch(`${BASE}${path}`, {
    headers: { ...cookieHeader(), ...extraHeaders },
  });
}

async function post(path: string, body?: object, extraHeaders: Record<string, string> = {}) {
  return fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      ...cookieHeader(),
      ...csrfHeader(),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function extractCookie(res: Response): string {
  // Node.js fetch exposes Set-Cookie via getSetCookie() or headers.get
  const raw = (res.headers as any).getSetCookie?.() ?? [];
  if (Array.isArray(raw) && raw.length) {
    return raw.map((c: string) => c.split(';')[0]).join('; ');
  }
  const single = res.headers.get('set-cookie') ?? '';
  return single ? single.split(';')[0] : '';
}

async function waitForServer(timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {
      // not up yet
    }
    await wait(200);
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

beforeAll(async () => {
  // Clean up any leftover auth file from a previous run
  if (existsSync(AUTH_FILE)) rmSync(AUTH_FILE);

  // Kill any stale process on this port before starting
  try {
    const { execSync } = await import('child_process');
    execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
    await wait(300);
  } catch {}

  server = spawn('npx', ['tsx', 'src/server.ts', '--port', String(PORT)], {
    cwd:      ROOT,
    stdio:    'ignore',
    detached: true,  // creates a new process group so we can kill the whole tree
  });
  server.unref();
  serverPid = server.pid ?? 0;

  await waitForServer();

  // ── First-run setup ──────────────────────────────────────────────────────────
  const setupRes = await fetch(`${BASE}/auth/setup`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ password: 'TestPassword123!' }),
  });
  if (!setupRes.ok) {
    const txt = await setupRes.text();
    throw new Error(`Setup failed: ${setupRes.status} ${txt}`);
  }

  // ── Login → capture session cookie ──────────────────────────────────────────
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ password: 'TestPassword123!' }),
  });
  if (!loginRes.ok) {
    const txt = await loginRes.text();
    throw new Error(`Login failed: ${loginRes.status} ${txt}`);
  }
  sessionCookie = extractCookie(loginRes);
  if (!sessionCookie) throw new Error('No session cookie received after login');

  // ── Fetch CSRF token ─────────────────────────────────────────────────────────
  const csrfRes = await fetch(`${BASE}/auth/csrf-token`, {
    headers: cookieHeader(),
  });
  if (!csrfRes.ok) throw new Error(`CSRF fetch failed: ${csrfRes.status}`);
  const csrfBody = await csrfRes.json() as any;
  csrfToken = csrfBody.token;
  if (!csrfToken) throw new Error('No CSRF token received');
}, 25000);

afterAll(async () => {
  // Kill the entire process group to ensure all child processes (tsx → node) are cleaned up
  if (serverPid) {
    try { process.kill(-serverPid, 'SIGTERM'); } catch {}
  }
  server?.kill('SIGTERM');
  if (existsSync(AUTH_FILE)) rmSync(AUTH_FILE);
  if (existsSync(join(ROOT, '.aqr-settings.json'))) rmSync(join(ROOT, '.aqr-settings.json'));
  for (const f of ['tmp-template.xlsx']) {
    const p = join(ROOT, f);
    if (existsSync(p)) rmSync(p);
  }
  await wait(500);
});

// ── Health (public — no auth needed) ─────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 with ok:true', async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
  });
});

// ── Auth endpoints ────────────────────────────────────────────────────────────

describe('Auth flow', () => {
  it('GET /setup redirects to /login after setup is complete', async () => {
    const res = await fetch(`${BASE}/setup`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toMatch(/\/login/);
  });

  it('GET /login returns 200 HTML', async () => {
    const res = await fetch(`${BASE}/login`);
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('text/html');
  });

  it('POST /auth/login with wrong password returns 401', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: 'wrong-password' }),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });

  it('GET /auth/csrf-token returns token when authenticated', async () => {
    const res = await get('/auth/csrf-token');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(10);
  });

  it('GET /auth/csrf-token returns 401 without session', async () => {
    const res = await fetch(`${BASE}/auth/csrf-token`);
    expect(res.status).toBe(401);
  });

  it('POST /auth/logout clears session', async () => {
    // Create a separate session just for this test
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: 'TestPassword123!' }),
    });
    const cookie = extractCookie(loginRes);
    const csrfRes = await fetch(`${BASE}/auth/csrf-token`, { headers: { Cookie: cookie } });
    const { token } = await csrfRes.json() as any;

    const logoutRes = await fetch(`${BASE}/auth/logout`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': token },
    });
    expect(logoutRes.status).toBe(200);
    const body = await logoutRes.json() as any;
    expect(body.ok).toBe(true);

    // After logout the session cookie no longer grants access
    const afterRes = await fetch(`${BASE}/auth/csrf-token`, { headers: { Cookie: cookie } });
    expect(afterRes.status).toBe(401);
  });
});

// ── CSRF protection ───────────────────────────────────────────────────────────

describe('CSRF protection', () => {
  it('POST /api/stop without CSRF token returns 403', async () => {
    const res = await fetch(`${BASE}/api/stop`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader() },
    });
    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.error).toMatch(/csrf/i);
  });

  it('POST /api/stop with wrong CSRF token returns 403', async () => {
    const res = await fetch(`${BASE}/api/stop`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...cookieHeader(),
        'X-CSRF-Token': 'bad-token',
      },
    });
    expect(res.status).toBe(403);
  });
});

// ── Status ────────────────────────────────────────────────────────────────────

describe('GET /api/status', () => {
  it('returns 200 with required fields', async () => {
    const res = await get('/api/status');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty('target');
    expect(body).toHaveProperty('batchRunning');
    expect(body).toHaveProperty('queriedToday');
    expect(body).toHaveProperty('dailyLimit');
  });

  it('batchRunning is false when no batch is active', async () => {
    const res = await get('/api/status');
    const body = await res.json() as any;
    expect(body.batchRunning).toBe(false);
  });

  it('returns 401 without session', async () => {
    const res = await fetch(`${BASE}/api/status`);
    expect(res.status).toBe(401);
  });
});

// ── Template ──────────────────────────────────────────────────────────────────

describe('GET /api/template', () => {
  it('returns 200 with xlsx content-type', async () => {
    const res = await get('/api/template');
    await res.arrayBuffer();
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toMatch(/spreadsheetml|octet-stream/);
  });

  it('response has content-disposition with filename', async () => {
    const res = await get('/api/template');
    await res.arrayBuffer();
    const cd = res.headers.get('content-disposition') ?? '';
    expect(cd).toContain('ai-query-template.xlsx');
  });

  it('response body is non-empty', async () => {
    const res = await get('/api/template');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(100);
  });
});

// ── Stop / Pause / Resume ─────────────────────────────────────────────────────

describe('POST /api/stop', () => {
  it('returns ok:true even with no active batch', async () => {
    const res = await post('/api/stop');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
  });
});

describe('POST /api/pause and /api/resume', () => {
  it('pause returns ok:true and paused:true', async () => {
    const res = await post('/api/pause');
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.paused).toBe(true);
  });

  it('resume returns ok:true and paused:false', async () => {
    const res = await post('/api/resume');
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.paused).toBe(false);
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────

describe('GET /api/settings', () => {
  it('returns 200 with expected fields', async () => {
    const res = await get('/api/settings');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty('dailyQueryLimit');
    expect(body).toHaveProperty('pauseMinMs');
    expect(body).toHaveProperty('pauseMaxMs');
    expect(body).toHaveProperty('geminiApiKey');
    expect(body).toHaveProperty('totpEnabled');
  });

  it('API key values are masked (never raw)', async () => {
    const res = await get('/api/settings');
    const body = await res.json() as any;
    // Keys should either be empty or masked — never contain full key text
    // If a key is set, it must contain *** masking
    if (body.geminiApiKey) expect(body.geminiApiKey).toContain('***');
    if (body.openRouterApiKey) expect(body.openRouterApiKey).toContain('***');
  });

  it('returns 401 without session', async () => {
    const res = await fetch(`${BASE}/api/settings`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/settings', () => {
  it('saves non-secret settings and returns ok:true', async () => {
    const res = await post('/api/settings', {
      dailyQueryLimit: 42,
      stripMarkdown: true,
      pauseMinMs: 1200,
      pauseMaxMs: 4000,
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
  });

  it('saved settings are reflected in GET /api/settings', async () => {
    await post('/api/settings', { dailyQueryLimit: 99 });
    const res = await get('/api/settings');
    const body = await res.json() as any;
    expect(body.dailyQueryLimit).toBe(99);
  });

  it('ignores masked placeholder values for secret fields', async () => {
    // Send a masked value — server should not overwrite the real key
    const res = await post('/api/settings', { geminiApiKey: 'AIza***...***abc' });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
  });

  it('saves DB connection settings', async () => {
    const res = await post('/api/settings', {
      dbType: 'postgresql',
      dbTable: 'ai_results',
    });
    expect(res.status).toBe(200);
    const settingsRes = await get('/api/settings');
    const body = await settingsRes.json() as any;
    expect(body.dbType).toBe('postgresql');
    expect(body.dbTable).toBe('ai_results');
  });
});

// ── Run validation ────────────────────────────────────────────────────────────

describe('POST /api/run — validation', () => {
  it('rejects request with no file and no sheetsRef', async () => {
    const form = new FormData();
    form.append('target', 'gemini');
    const res = await fetch(`${BASE}/api/run`, {
      method:  'POST',
      headers: { ...cookieHeader(), ...csrfHeader() },
      body:    form,
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });

  it('rejects invalid target name', async () => {
    const form = new FormData();
    form.append('target', 'invalid-ai-service');
    form.append('sheetsRef', 'sheets:fake:Arkusz1!A:D');
    const res = await fetch(`${BASE}/api/run`, {
      method:  'POST',
      headers: { ...cookieHeader(), ...csrfHeader() },
      body:    form,
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/invalid target/i);
  });

  it('rejects malformed sheetsRef', async () => {
    const form = new FormData();
    form.append('target', 'gemini');
    form.append('sheetsRef', 'not-a-valid-ref');
    const res = await fetch(`${BASE}/api/run`, {
      method:  'POST',
      headers: { ...cookieHeader(), ...csrfHeader() },
      body:    form,
    });
    expect(res.status).toBe(400);
  });
});

// ── Generator validation ──────────────────────────────────────────────────────

describe('POST /api/generate — validation', () => {
  it('rejects empty intent', async () => {
    const res = await post('/api/generate', { intent: '', target: 'gemini', provider: 'gemini-api' });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });

  it('rejects unknown provider', async () => {
    const res = await post('/api/generate', { intent: 'test', provider: 'unknown-ai' });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/provider/i);
  });

  it('returns 400 when no API key is configured', async () => {
    // Without a real API key configured, should return 400 not 500
    const res = await post('/api/generate', {
      intent:   'Lista firm IT w Warszawie',
      target:   'gemini',
      provider: 'gemini-api',
    });
    // Either 400 (no key) or 500 (network error) are acceptable; not 200 without a real key
    expect([400, 500]).toContain(res.status);
  });
});

// ── Generate Excel ────────────────────────────────────────────────────────────

describe('POST /api/generate-excel', () => {
  it('rejects empty prompts array', async () => {
    const res = await post('/api/generate-excel', { prompts: [] });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });

  it('rejects missing prompts field', async () => {
    const res = await post('/api/generate-excel', {});
    expect(res.status).toBe(400);
  });

  it('returns xlsx for valid prompts', async () => {
    const res = await post('/api/generate-excel', {
      prompts: [
        { id: 1, prompt: 'Firma A - jaki model biznesowy?' },
        { id: 2, prompt: 'Firma B - ile pracowników?' },
      ],
    });
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('spreadsheetml');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(100);
  });
});

// ── Query API validation ──────────────────────────────────────────────────────

describe('POST /api/query-api — validation', () => {
  it('rejects empty prompt', async () => {
    const res = await post('/api/query-api', { prompt: '', provider: 'gemini-api' });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });

  it('rejects unknown provider', async () => {
    const res = await post('/api/query-api', { prompt: 'hello', provider: 'unknown' });
    expect(res.status).toBe(400);
  });
});

// ── Models listing ────────────────────────────────────────────────────────────

describe('GET /api/models', () => {
  it('returns 400 for unknown provider', async () => {
    const res = await get('/api/models?provider=unknown');
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });

  it('returns 400 for gemini-api when no key configured', async () => {
    const res = await get('/api/models?provider=gemini-api');
    // Without a real key this should be 400 (no key) or 500 (API error)
    expect([400, 500]).toContain(res.status);
  });
});

// ── SSE progress ──────────────────────────────────────────────────────────────

describe('GET /api/progress (SSE)', () => {
  it('accepts SSE connection and sends connected event', async () => {
    const ctrl = new AbortController();
    let res: Response;
    try {
      res = await fetch(`${BASE}/api/progress`, {
        headers: cookieHeader(),
        signal:  ctrl.signal,
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');
    } finally {
      ctrl.abort();
      try { await res!.body?.cancel(); } catch {}
    }
  });

  it('returns 401 without session', async () => {
    const res = await fetch(`${BASE}/api/progress`, { signal: AbortSignal.timeout(1000) }).catch(() => null);
    if (res) {
      expect(res.status).toBe(401);
    }
  });
});

// ── Password change validation ────────────────────────────────────────────────

describe('POST /auth/change-password', () => {
  it('rejects wrong current password', async () => {
    const res = await post('/auth/change-password', {
      currentPassword: 'WrongPassword!',
      newPassword:     'NewPassword456!',
    });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });

  it('rejects new password shorter than 8 chars', async () => {
    const res = await post('/auth/change-password', {
      currentPassword: 'TestPassword123!',
      newPassword:     'short',
    });
    expect(res.status).toBe(400);
  });

  it('requires CSRF token', async () => {
    const res = await fetch(`${BASE}/auth/change-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader() },
      body:    JSON.stringify({ currentPassword: 'TestPassword123!', newPassword: 'NewPassword456!' }),
    });
    expect(res.status).toBe(403);
  });
});

// ── 2FA TOTP flow ─────────────────────────────────────────────────────────────

describe('2FA TOTP', () => {
  it('GET /auth/totp-setup returns secret and QR code (no session required)', async () => {
    const res = await fetch(`${BASE}/auth/totp-setup`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(typeof body.secret).toBe('string');
    expect(body.secret.length).toBeGreaterThan(10);
    expect(body.qrCode).toMatch(/^data:image\/png;base64,/);
  });

  it('POST /auth/totp-enable rejects invalid code', async () => {
    const setupRes = await fetch(`${BASE}/auth/totp-setup`);
    const { secret } = await setupRes.json() as any;
    const res = await post('/auth/totp-enable', { secret, code: '000000' });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });

  it('POST /auth/totp-enable activates 2FA with a valid code', async () => {
    // Get a fresh TOTP secret from the server
    const setupRes = await fetch(`${BASE}/auth/totp-setup`);
    const { secret } = await setupRes.json() as any;

    // Generate a valid TOTP code using the same library the server uses
    const totp = new OTPAuth.TOTP({
      issuer:    'AQR',
      label:     'AI Query Runner',
      algorithm: 'SHA1',
      digits:    6,
      period:    30,
      secret:    OTPAuth.Secret.fromBase32(secret),
    });
    const code = totp.generate();

    const res = await post('/auth/totp-enable', { secret, code });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);

    // Verify totpEnabled is now true in settings
    const settingsRes = await get('/api/settings');
    const settings = await settingsRes.json() as any;
    expect(settings.totpEnabled).toBe(true);
  });

  it('POST /auth/totp-disable requires correct password and disables 2FA', async () => {
    const res = await post('/auth/totp-disable', { password: 'TestPassword123!' });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);

    // Verify totpEnabled is now false
    const settingsRes = await get('/api/settings');
    const settings = await settingsRes.json() as any;
    expect(settings.totpEnabled).toBe(false);
  });

  it('POST /auth/totp-disable rejects wrong password', async () => {
    const res = await post('/auth/totp-disable', { password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body).toHaveProperty('error');
  });
});

// ── API key encryption round-trip ─────────────────────────────────────────────

describe('API key encryption at rest', () => {
  const SETTINGS_FILE = join(ROOT, '.aqr-settings.json');
  const TEST_KEY = 'AIzaSyFakeKeyForTestingEncryption12345';

  it('saves API key encrypted in .aqr-settings.json (enc:v1: prefix)', async () => {
    const res = await post('/api/settings', { geminiApiKey: TEST_KEY });
    expect(res.status).toBe(200);

    // Read the raw file — key must be stored encrypted, never plaintext
    expect(existsSync(SETTINGS_FILE)).toBe(true);
    const raw = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'));
    expect(raw.geminiApiKey).toMatch(/^enc:v1:/);
    expect(raw.geminiApiKey).not.toContain(TEST_KEY);
  });

  it('GET /api/settings returns masked value, not plaintext or ciphertext', async () => {
    const res = await get('/api/settings');
    const body = await res.json() as any;
    // Must be masked (contains ***), not the raw key or enc:v1: blob
    expect(body.geminiApiKey).toContain('***');
    expect(body.geminiApiKey).not.toContain(TEST_KEY);
    expect(body.geminiApiKey).not.toMatch(/^enc:v1:/);
  });

  it('sending masked value back does not overwrite the stored key', async () => {
    // POST the masked placeholder back (as app.js does when saving settings after opening panel)
    await post('/api/settings', { geminiApiKey: 'AIza***...***345' });

    // Key must still be stored encrypted (not as the masked placeholder or plaintext)
    const raw = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'));
    expect(raw.geminiApiKey).toMatch(/^enc:v1:/);
    expect(raw.geminiApiKey).not.toContain('***');
    expect(raw.geminiApiKey).not.toContain(TEST_KEY);

    // And GET /api/settings must still return it masked (key still present)
    const res = await get('/api/settings');
    const body = await res.json() as any;
    expect(body.geminiApiKey).toContain('***');
  });

  it('dbUrl is also encrypted at rest when saved', async () => {
    const res = await post('/api/settings', {
      dbType: 'postgresql',
      dbUrl:  'postgresql://user:password@localhost:5432/mydb',
      dbTable: 'results',
    });
    expect(res.status).toBe(200);

    const raw = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'));
    expect(raw.dbUrl).toMatch(/^enc:v1:/);
    expect(raw.dbUrl).not.toContain('password');
  });

  it('GET /api/settings masks dbUrl when set', async () => {
    const res = await get('/api/settings');
    const body = await res.json() as any;
    // When dbUrl is set, server returns '***' as placeholder
    expect(body.dbUrl).toBe('***');
    expect(body.dbUrl).not.toContain('password');
  });
});
