/**
 * config.ts — Runtime configuration for ai-query-runner
 *
 * Reads from environment variables or config.json (gitignored).
 * Override via CLI flags or .env file.
 */

import { config as dotenvConfig } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { loadSettings } from './settingsStore.js';

// Load .env from project root (silently ignored if not present)
dotenvConfig({ path: resolve(process.cwd(), '.env') });

interface Config {
  // Browser
  targetSite: 'gemini' | 'perplexity' | 'claude' | 'google' | 'google-api' | 'duckduckgo' | 'copilot' | 'mistral' | 'deepseek' | 'gemini-api' | 'openrouter' | 'ollama' | 'groq' | 'xai' | 'custom';
  headless: boolean;
  chromiumPath: string | null;
  profileDir: string;

  // Rate limiting
  dailyQueryLimit: number;
  pauseMinMs: number;
  pauseMaxMs: number;
  nightQuietStart: number;  // hour 0-23
  nightQuietEnd: number;    // hour 0-23
  workingDays: number[];    // 0=Sun, 1=Mon ... 6=Sat

  // Google Sheets auth
  googleServiceAccountJson: string | null;
  googleOAuthCredentialsJson: string | null;
  googleCseId: string | null;

  // Bridge server (when running in server mode)
  bridgePort: number;

  // Retry & output limits
  retryCount: number;
  retryDelayMs: number;
  maxResponseChars: number;
  stripMarkdown: boolean;

  // Direct API keys
  geminiApiKey: string | null;
  openRouterApiKey: string | null;
  openRouterModel: string;
  geminiApiModel: string;

  // Ollama
  ollamaUrl: string | null;
  ollamaModel: string | null;

  // Groq
  groqApiKey: string | null;
  groqModel: string | null;

  // xAI
  xaiApiKey: string | null;
  xaiModel: string | null;

  // Custom OpenAI-compatible endpoint
  customEndpointUrl: string | null;
  customEndpointKey: string | null;
  customEndpointModel: string | null;
}

// ── Load optional config.json ──────────────────────────────────────────────────
const configFile = resolve(process.cwd(), 'config.json');
const fileConfig: Partial<Config> = existsSync(configFile)
  ? JSON.parse(readFileSync(configFile, 'utf8'))
  : {};

// ── Load user settings (written by panel — highest priority) ──────────────────
const s = loadSettings();

// ── Cross-platform Chromium detection ─────────────────────────────────────────
function detectChromium(): string | null {
  const platform = process.platform;

  // Portable build: check for bundled Chromium next to the binary first
  const execBinDir = dirname(process.execPath);
  const portableChromium: Record<string, string> = {
    linux:  join(execBinDir, 'chromium', 'chrome'),
    darwin: join(execBinDir, 'chromium', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
    win32:  join(execBinDir, 'chromium', 'chrome.exe'),
  };
  const pp = portableChromium[platform] ?? portableChromium['linux']!;
  if (existsSync(pp)) return pp;

  const candidates: Record<string, string[]> = {
    linux: [
      '/usr/lib/chromium/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/opt/homebrew/bin/chromium',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env['LOCALAPPDATA']}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES']}\\Google\\Chrome\\Application\\chrome.exe`,
    ],
  };
  const paths = candidates[platform] ?? candidates['linux']!;
  for (const p of paths) {
    if (p && existsSync(p)) return p;
  }
  return null; // Playwright will use its own bundled browser
}

// ── Profile directory — platform-specific default ─────────────────────────────
function defaultProfileDir(): string {
  const platform = process.platform;
  if (platform === 'win32') {
    return `${process.env['APPDATA']}\\ai-query-runner\\browser-profile`;
  }
  if (platform === 'darwin') {
    return `${process.env['HOME']}/Library/Application Support/ai-query-runner/browser-profile`;
  }
  return `${process.env['HOME'] ?? '/root'}/.config/ai-query-runner/browser-profile`;
}

export const config: Config = {
  targetSite:      (process.env['TARGET_SITE'] as Config['targetSite']) ?? fileConfig.targetSite ?? 'gemini',
  headless:        s.headless         ?? ((process.env['HEADLESS'] === 'true') || fileConfig.headless || false),
  chromiumPath:    process.env['CHROMIUM_PATH'] ?? fileConfig.chromiumPath ?? detectChromium(),
  profileDir:      process.env['PROFILE_DIR']  ?? fileConfig.profileDir   ?? defaultProfileDir(),

  dailyQueryLimit: s.dailyQueryLimit  ?? (Number(process.env['DAILY_LIMIT'])      || fileConfig.dailyQueryLimit || 150),
  pauseMinMs:      s.pauseMinMs       ?? (Number(process.env['PAUSE_MIN_MS'])     || fileConfig.pauseMinMs      || 5_000),
  pauseMaxMs:      s.pauseMaxMs       ?? (Number(process.env['PAUSE_MAX_MS'])     || fileConfig.pauseMaxMs      || 15_000),
  nightQuietStart: s.nightQuietStart  ?? (Number(process.env['NIGHT_START'])      || fileConfig.nightQuietStart || 23),
  nightQuietEnd:   s.nightQuietEnd    ?? (Number(process.env['NIGHT_END'])        || fileConfig.nightQuietEnd   || 7),
  workingDays:     (process.env['WORKING_DAYS'] ? process.env['WORKING_DAYS'].split(',').map(Number) : fileConfig.workingDays) || [1,2,3,4,5],

  googleServiceAccountJson:   s.googleServiceAccountJson ?? process.env['GOOGLE_SERVICE_ACCOUNT_JSON'] ?? fileConfig.googleServiceAccountJson ?? null,
  googleOAuthCredentialsJson: process.env['GOOGLE_OAUTH_CREDENTIALS_JSON'] ?? fileConfig.googleOAuthCredentialsJson ?? null,
  googleCseId:                s.googleCseId              ?? process.env['GOOGLE_CSE_ID']               ?? fileConfig.googleCseId              ?? null,

  bridgePort: Number(process.env['BRIDGE_PORT']) || fileConfig.bridgePort || 3535,

  retryCount:       s.retryCount       ?? (Number(process.env['RETRY_COUNT'])        || (fileConfig as any).retryCount       || 2),
  retryDelayMs:     s.retryDelayMs     ?? (Number(process.env['RETRY_DELAY_MS'])     || (fileConfig as any).retryDelayMs     || 30_000),
  maxResponseChars: s.maxResponseChars ?? (Number(process.env['MAX_RESPONSE_CHARS']) || (fileConfig as any).maxResponseChars || 0),
  stripMarkdown:    s.stripMarkdown    ?? ((process.env['STRIP_MARKDOWN'] === 'true') || (fileConfig as any).stripMarkdown   || false),

  geminiApiKey:     s.geminiApiKey     ?? process.env['GEMINI_API_KEY']      ?? null,
  openRouterApiKey: s.openRouterApiKey ?? process.env['OPENROUTER_API_KEY']  ?? null,
  openRouterModel:  s.openRouterModel  ?? process.env['OPENROUTER_MODEL']    ?? 'google/gemini-2.0-flash-exp:free',
  geminiApiModel:   s.geminiApiModel   ?? process.env['GEMINI_API_MODEL']    ?? 'gemini-2.0-flash',

  ollamaUrl:           s.ollamaUrl           ?? process.env['OLLAMA_URL']            ?? null,
  ollamaModel:         s.ollamaModel         ?? process.env['OLLAMA_MODEL']          ?? null,
  groqApiKey:          s.groqApiKey          ?? process.env['GROQ_API_KEY']          ?? null,
  groqModel:           s.groqModel           ?? process.env['GROQ_MODEL']            ?? null,
  xaiApiKey:           s.xaiApiKey           ?? process.env['XAI_API_KEY']           ?? null,
  xaiModel:            s.xaiModel            ?? process.env['XAI_MODEL']             ?? null,
  customEndpointUrl:   s.customEndpointUrl   ?? process.env['CUSTOM_ENDPOINT_URL']   ?? null,
  customEndpointKey:   s.customEndpointKey   ?? process.env['CUSTOM_ENDPOINT_KEY']   ?? null,
  customEndpointModel: s.customEndpointModel ?? process.env['CUSTOM_ENDPOINT_MODEL'] ?? null,
};
