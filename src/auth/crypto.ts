import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const ENC_PREFIX = 'enc:v1:';

export function deriveKey(secret: string): Buffer {
  return scryptSync(secret, 'aqr-fixed-salt-v1', 32);
}

export function encrypt(plaintext: string, key: Buffer): string {
  const iv        = randomBytes(16);
  const cipher    = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag       = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(value: string, key: Buffer): string {
  if (!value.startsWith(ENC_PREFIX)) return value;
  const data      = Buffer.from(value.slice(ENC_PREFIX.length), 'base64');
  const iv        = data.subarray(0, 16);
  const tag       = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher  = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

export function maskKey(value: string): string {
  if (!value || value.length < 8) return '***';
  return value.slice(0, 4) + '***' + value.slice(-4);
}
