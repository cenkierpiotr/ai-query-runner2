/**
 * QueryQueue — sequential execution with rate limiting, daily quota, and night pause.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config } from '../config/config.js';
import { DATA_DIR } from '../utils/portable.js';

// ── Daily query counter — persisted to disk across restarts ───────────────────
const STATS_FILE = join(DATA_DIR, '.aqr-stats.json');

let _queryCountToday = 0;
let _queryDay = new Date().toDateString();
let _rateLimitedUntil = 0;

function _loadPersistedStats(): void {
  try {
    if (!existsSync(STATS_FILE)) return;
    const data = JSON.parse(readFileSync(STATS_FILE, 'utf8'));
    if (data.date === new Date().toDateString()) {
      _queryCountToday = data.count ?? 0;
    }
  } catch {}
}

function _savePersistedStats(): void {
  try {
    writeFileSync(STATS_FILE, JSON.stringify({ date: new Date().toDateString(), count: _queryCountToday }));
  } catch {}
}

_loadPersistedStats();

function _checkDailyLimit(): boolean {
  const today = new Date().toDateString();
  if (today !== _queryDay) { _queryCountToday = 0; _queryDay = today; _savePersistedStats(); }
  return _queryCountToday < config.dailyQueryLimit;
}

function _recordQuery(): void {
  _queryCountToday++;
  _savePersistedStats();
  if (_queryCountToday >= config.dailyQueryLimit) {
    _rateLimitedUntil = Date.now() + 60 * 60 * 1000;
    console.warn(`[Queue] Daily limit of ${config.dailyQueryLimit} queries reached — pausing 1h`);
  }
}

// ── Schedule restrictions ─────────────────────────────────────────────────────────
function _isOutsideWorkingHours(): { suspended: boolean, reason?: string } {
  const d = new Date();
  const day = d.getDay();
  const h = d.getHours();

  if (!config.workingDays.includes(day)) {
    return { suspended: true, reason: 'Dzień wolny' };
  }

  const start = config.nightQuietStart;
  const end   = config.nightQuietEnd;
  let isNight = false;
  if (start > end) {
    isNight = h >= start || h < end;
  } else {
    isNight = h >= start && h < end;
  }

  if (isNight) return { suspended: true, reason: 'Cisza nocna' };
  return { suspended: false };
}

// ── Natural pause between queries ──────────────────────────────────────────────
function _naturalPause(): Promise<void> {
  const ms = config.pauseMinMs + Math.random() * (config.pauseMaxMs - config.pauseMinMs);
  return new Promise(r => setTimeout(r, ms));
}

// ── Circuit breaker ────────────────────────────────────────────────────────────
let _consecutiveTimeouts = 0;
let _pauseUntil = 0;

function _checkCircuitBreaker(): void {
  if (Date.now() < _pauseUntil) {
    const minLeft = Math.ceil((_pauseUntil - Date.now()) / 60_000);
    throw new Error(`Circuit breaker active — paused for ~${minLeft} more min`);
  }
}

function _recordTimeout(): void {
  _consecutiveTimeouts++;
  console.warn(`[Queue] Timeout #${_consecutiveTimeouts}`);
  if (_consecutiveTimeouts >= 3) {
    console.warn('[Queue] Circuit breaker: 3 consecutive timeouts → 5 min pause');
    _pauseUntil = Date.now() + 5 * 60_000;
    _consecutiveTimeouts = 0;
  }
}

function _recordSuccess(): void {
  _consecutiveTimeouts = 0;
}

// ── Public interface ───────────────────────────────────────────────────────────

export interface QueueStats {
  queriedToday: number;
  dailyLimit: number;
  rateLimitedUntil: number;
  circuitBreakerUntil: number;
  isNightQuiet: boolean;
}

export function getQueueStats(): QueueStats {
  return {
    queriedToday:       _queryCountToday,
    dailyLimit:         config.dailyQueryLimit,
    rateLimitedUntil:   _rateLimitedUntil,
    circuitBreakerUntil: _pauseUntil,
    isNightQuiet:       _isOutsideWorkingHours().suspended,
  };
}

/**
 * Wraps a bridge `ask()` call with:
 * - rate limit check
 * - night quiet check
 * - circuit breaker check
 * - natural pause after each call
 */
export async function executeWithLimits<T>(
  fn: () => Promise<T>,
  opts: { respectNightQuiet?: boolean } = {}
): Promise<T> {
  if (opts.respectNightQuiet !== false) {
    const { suspended, reason } = _isOutsideWorkingHours();
    if (suspended) {
      throw new Error(`Harmonogram: ${reason} — zapytania wstrzymane`);
    }
  }
  if (Date.now() < _rateLimitedUntil) {
    const minLeft = Math.ceil((_rateLimitedUntil - Date.now()) / 60_000);
    throw new Error(`Daily limit reached — retry in ~${minLeft} min`);
  }
  if (!_checkDailyLimit()) {
    _rateLimitedUntil = Date.now() + 60 * 60 * 1000;
    throw new Error('Daily query limit reached');
  }
  _checkCircuitBreaker();
  _recordQuery();

  try {
    const result = await fn();
    _recordSuccess();
    await _naturalPause();
    return result;
  } catch (e: any) {
    const isTimeout = e?.name === 'TimeoutError' || String(e?.message).includes('TIMEOUT');
    if (isTimeout) _recordTimeout();
    throw e;
  }
}

// ── Sequential job queue ───────────────────────────────────────────────────────

let _chain: Promise<void> = Promise.resolve();
const _inPipeline = new Set<string>();

/**
 * Enqueue a named job. Returns false if job with same key is already queued.
 * The job function receives an `index` (position in queue for logging).
 */
export function enqueueJob(key: string, fn: () => Promise<void>): boolean {
  if (_inPipeline.has(key)) return false;
  _inPipeline.add(key);
  _chain = _chain.then(async () => {
    try {
      await fn();
    } catch (e: any) {
      console.error(`[Queue] Job [${key}] error:`, e.message?.slice(0, 120));
    } finally {
      _inPipeline.delete(key);
    }
  });
  return true;
}
