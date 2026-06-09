import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { encrypt, decrypt, isEncrypted } from '../auth/crypto.js';
import { getEncryptionKey } from '../auth/authStore.js';

const SETTINGS_FILE = resolve(process.cwd(), '.aqr-settings.json');

export interface UserSettings {
  dailyQueryLimit?:          number;
  pauseMinMs?:               number;
  pauseMaxMs?:               number;
  nightQuietStart?:          number;
  nightQuietEnd?:            number;
  headless?:                 boolean;
  stripMarkdown?:            boolean;
  maxResponseChars?:         number;
  retryCount?:               number;
  retryDelayMs?:             number;
  googleApiKey?:             string;
  googleCseId?:              string;
  googleServiceAccountJson?: string;
  geminiApiKey?:             string;
  openRouterApiKey?:         string;
  openRouterModel?:          string;
  geminiApiModel?:           string;
  dbType?:                   string;
  dbUrl?:                    string;
  dbTable?:                  string;
  // Ollama
  ollamaUrl?:                string;
  ollamaModel?:              string;
  // Custom OpenAI-compatible endpoint
  customEndpointUrl?:        string;
  customEndpointKey?:        string;
  customEndpointModel?:      string;
  // Groq
  groqApiKey?:               string;
  groqModel?:                string;
  // xAI (Grok)
  xaiApiKey?:                string;
  xaiModel?:                 string;
}

// Fields that contain secrets and should be encrypted at rest
const SECRET_FIELDS: (keyof UserSettings)[] = [
  'googleApiKey',
  'googleServiceAccountJson',
  'geminiApiKey',
  'openRouterApiKey',
  'dbUrl',
  'customEndpointKey',
  'groqApiKey',
  'xaiApiKey',
];

export function loadSettings(): UserSettings {
  try {
    if (!existsSync(SETTINGS_FILE)) return {};
    const raw: UserSettings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'));
    const key = getEncryptionKey();
    if (!key) return raw;
    for (const field of SECRET_FIELDS) {
      const val = raw[field] as string | undefined;
      if (val && isEncrypted(val)) {
        try {
          (raw as any)[field] = decrypt(val, key);
        } catch {
          (raw as any)[field] = '';
        }
      }
    }
    return raw;
  } catch {
    return {};
  }
}

export function saveSettings(settings: UserSettings): void {
  const key    = getEncryptionKey();
  const stored = { ...settings };
  if (key) {
    for (const field of SECRET_FIELDS) {
      const val = stored[field] as string | undefined;
      if (val && !isEncrypted(val)) {
        (stored as any)[field] = encrypt(val, key);
      }
    }
  }
  writeFileSync(SETTINGS_FILE, JSON.stringify(stored, null, 2));
}
