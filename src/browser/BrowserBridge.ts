/**
 * BrowserBridge — manages the persistent browser session and query lifecycle.
 *
 * Responsibilities:
 * - Launch / auto-recover Chromium via Playwright
 * - Manage persistent profile (session survives restarts)
 * - Delegate prompt send/receive to the configured BrowserTarget
 * - Expose simple `ask(prompt)` method for callers
 */

import * as fs from 'fs';
import { join } from 'path';
import { config } from '../config/config.js';
import type { BrowserTarget } from './BrowserTarget.js';
import { GeminiTarget } from './targets/GeminiTarget.js';
import { PerplexityTarget } from './targets/PerplexityTarget.js';
import { ClaudeTarget } from './targets/ClaudeTarget.js';
import { GoogleTarget } from './targets/GoogleTarget.js';
import { CopilotTarget } from './targets/CopilotTarget.js';
import { MistralTarget } from './targets/MistralTarget.js';
import { DeepSeekTarget } from './targets/DeepSeekTarget.js';
import { OpenWebUITarget } from './targets/OpenWebUITarget.js';

export type BridgeState = 'idle' | 'launching' | 'waiting_login' | 'ready' | 'error';

export interface BridgeStatus {
  state: BridgeState;
  message: string;
  ready: boolean;
  target: string;
}

function getTarget(): BrowserTarget {
  switch (config.targetSite) {
    case 'perplexity': return new PerplexityTarget();
    case 'claude':     return new ClaudeTarget();
    case 'google':     return new GoogleTarget();
    case 'copilot':    return new CopilotTarget();
    case 'mistral':    return new MistralTarget();
    case 'deepseek':   return new DeepSeekTarget();
    case 'openwebui':  return new OpenWebUITarget(config.openwebuiUrl);
    default:           return new GeminiTarget();
  }
}

class BrowserBridge {
  private _state: BridgeState = 'idle';
  private _stateMsg = 'Not initialized';
  private _page: any = null;
  private _ctx:  any = null;
  private _targetInstance?: BrowserTarget;

  private get target(): BrowserTarget {
    if (!this._targetInstance) this._targetInstance = getTarget();
    return this._targetInstance;
  }

  // Serialized request queue
  private _chain: Promise<any> = Promise.resolve();
  private _queueDepth = 0;
  private readonly MAX_QUEUE = 10;

  get status(): BridgeStatus {
    return {
      state:   this._state,
      message: this._stateMsg,
      ready:   this._state === 'ready',
      target:  this.target.name,
    };
  }

  get isReady(): boolean { return this._state === 'ready'; }

  // ── Initialization ──────────────────────────────────────────────────────────

  async init(): Promise<void> {
    if (['launching', 'waiting_login', 'ready'].includes(this._state)) return;
    await this._launch();
  }

  initAsync(): void {
    this.init().catch(e => {
      this._state    = 'error';
      this._stateMsg = e.message;
      console.error(`[Bridge/${this.target.name}] Init error:`, e.message);
    });
  }

  private async _launch(): Promise<void> {
    // Each AI service gets its own profile subdirectory so sessions don't interfere
    const profilePath = join(config.profileDir, config.targetSite);
    if (!fs.existsSync(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
    }

    // Kill stale Chromium instances locking the profile
    try {
      const { spawnSync } = await import('child_process');
      spawnSync('pkill', ['-f', profilePath], { stdio: 'pipe' });
      await this._sleep(1500);
    } catch {}

    for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
      try { fs.unlinkSync(`${profilePath}/${f}`); } catch {}
    }

    this._state    = 'launching';
    this._stateMsg = 'Launching browser...';
    console.log(`[Bridge/${this.target.name}] Launching browser (headless=${config.headless}, profile=${profilePath})...`);

    const { chromium } = await import('playwright');
    const launchOpts: Record<string, any> = {
      headless:         config.headless,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled',
             '--disable-dev-shm-usage', '--window-size=1280,900'],
      viewport:         { width: 1280, height: 900 },
      ignoreHTTPSErrors: true,
    };
    if (config.chromiumPath) {
      launchOpts['executablePath'] = config.chromiumPath;
    }
    // Linux webtop needs DISPLAY env
    if (process.platform === 'linux' && process.env['DISPLAY']) {
      launchOpts['env'] = { DISPLAY: process.env['DISPLAY'] };
    }

    this._ctx = await chromium.launchPersistentContext(profilePath, launchOpts);
    const pages = this._ctx.pages();
    this._page = pages.length ? pages[0] : await this._ctx.newPage();

    this._ctx.on('close', () => {
      this._state = 'idle';
      this._stateMsg = 'Browser closed — auto-restart in 30s';
      this._page = null;
      this._ctx  = null;
      console.log(`[Bridge/${this.target.name}] Browser closed. Auto-restart in 30s...`);
      setTimeout(() => { if (this._state === 'idle') this.initAsync(); }, 30_000);
    });

    // Check if already logged in
    const sessionActive = await this.target.isSessionActive(this._page);
    if (sessionActive) {
      this._state    = 'ready';
      this._stateMsg = `Session active (loaded from profile).`;
      console.log(`[Bridge/${this.target.name}] Session loaded from profile — ready.`);
      return;
    }

    // Not logged in — wait for user to log in manually
    this._state    = 'waiting_login';
    this._stateMsg = `Please log in to ${this.target.name} in the browser window (timeout: 10 min)...`;
    console.log(`[Bridge/${this.target.name}] No session found — waiting for manual login...`);
    console.log(`>>> Please log in to ${this.target.name} in the opened browser window <<<`);

    await this.target.waitForInput(this._page);
    this._state    = 'ready';
    this._stateMsg = 'Session active (new login).';
    console.log(`[Bridge/${this.target.name}] Login successful!`);
  }

  // ── Query ───────────────────────────────────────────────────────────────────

  async ask(prompt: string): Promise<string> {
    if (this._state !== 'ready') {
      throw new Error(`Bridge not ready: ${this._state} — ${this._stateMsg}`);
    }
    if (this._queueDepth >= this.MAX_QUEUE) {
      throw new Error(`Queue full (${this._queueDepth} pending) — try later`);
    }

    this._queueDepth++;
    const result = this._chain.then(async () => {
      try {
        await this.target.submitPrompt(this._page, prompt);
        return await this.target.extractResponse(this._page);
      } finally {
        this._queueDepth--;
      }
    });
    this._chain = result.catch(() => {});
    return result;
  }

  // ── Close ───────────────────────────────────────────────────────────────────

  async close(): Promise<void> {
    this._state = 'idle';
    if (this._ctx) await this._ctx.close().catch(() => {});
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

// Singleton
export const bridge = new BrowserBridge();
