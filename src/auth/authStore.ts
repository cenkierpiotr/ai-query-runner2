import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import { deriveKey } from './crypto.js';
import { DATA_DIR } from '../utils/portable.js';

const AUTH_FILE = join(DATA_DIR, '.aqr-auth.json');

export interface AuthConfig {
  passwordHash:      string;
  encryptionSecret:  string;
  sessionSecret:     string;
  totpSecret?:       string;
  totpEnabled:       boolean;
  setupComplete:     boolean;
}

let _cached: AuthConfig | null = null;

export function loadAuthConfig(): AuthConfig | null {
  if (_cached) return _cached;
  if (!existsSync(AUTH_FILE)) return null;
  try {
    _cached = JSON.parse(readFileSync(AUTH_FILE, 'utf8'));
    return _cached;
  } catch {
    return null;
  }
}

export function saveAuthConfig(cfg: AuthConfig): void {
  _cached = cfg;
  writeFileSync(AUTH_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export async function createAuth(password: string): Promise<AuthConfig> {
  const passwordHash = await bcrypt.hash(password, 12);
  const cfg: AuthConfig = {
    passwordHash,
    encryptionSecret: randomBytes(32).toString('hex'),
    sessionSecret:    randomBytes(32).toString('hex'),
    totpEnabled:      false,
    setupComplete:    true,
  };
  saveAuthConfig(cfg);
  return cfg;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const cfg = loadAuthConfig();
  if (!cfg) return false;
  const ok = await verifyPassword(currentPassword, cfg.passwordHash);
  if (!ok) return false;
  cfg.passwordHash = await bcrypt.hash(newPassword, 12);
  saveAuthConfig(cfg);
  return true;
}

export function getEncryptionKey(): Buffer | null {
  const cfg = loadAuthConfig();
  if (!cfg) return null;
  return deriveKey(cfg.encryptionSecret);
}

export function getSessionSecret(): string {
  const cfg = loadAuthConfig();
  return cfg?.sessionSecret ?? randomBytes(32).toString('hex');
}

export function isSetupComplete(): boolean {
  return loadAuthConfig()?.setupComplete === true;
}

// TOTP helpers using otpauth
export function generateTotpSecret(): string {
  return new OTPAuth.Secret().base32;
}

export function getTotpUri(secret: string, label = 'AI Query Runner'): string {
  const totp = new OTPAuth.TOTP({
    issuer:    'AQR',
    label,
    algorithm: 'SHA1',
    digits:    6,
    period:    30,
    secret:    OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

export function verifyTotp(token: string, secret: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer:    'AQR',
    label:     'user',
    algorithm: 'SHA1',
    digits:    6,
    period:    30,
    secret:    OTPAuth.Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

export function enableTotp(secret: string): void {
  const cfg = loadAuthConfig();
  if (!cfg) throw new Error('No auth config');
  cfg.totpSecret  = secret;
  cfg.totpEnabled = true;
  saveAuthConfig(cfg);
}

export function disableTotp(): void {
  const cfg = loadAuthConfig();
  if (!cfg) throw new Error('No auth config');
  cfg.totpSecret  = undefined;
  cfg.totpEnabled = false;
  saveAuthConfig(cfg);
}
