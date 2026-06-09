import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint } from '../../src/utils/checkpoint.js';

const TMP = join(process.cwd(), '.tmp-test-checkpoint');
const FAKE_INPUT = join(TMP, 'test-queries.xlsx');
const TARGET = 'gemini';

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('checkpoint', () => {
  it('returns null when no checkpoint exists', () => {
    expect(loadCheckpoint(FAKE_INPUT, TARGET)).toBeNull();
  });

  it('saves and loads completed rows', () => {
    saveCheckpoint(FAKE_INPUT, TARGET, [2, 3, 5], new Date().toISOString());
    const result = loadCheckpoint(FAKE_INPUT, TARGET);
    expect(result).not.toBeNull();
    expect(result!.has(2)).toBe(true);
    expect(result!.has(3)).toBe(true);
    expect(result!.has(5)).toBe(true);
    expect(result!.has(4)).toBe(false);
  });

  it('returns null for mismatched target', () => {
    saveCheckpoint(FAKE_INPUT, TARGET, [2, 3], new Date().toISOString());
    expect(loadCheckpoint(FAKE_INPUT, 'perplexity')).toBeNull();
  });

  it('clears checkpoint file', () => {
    saveCheckpoint(FAKE_INPUT, TARGET, [2, 3], new Date().toISOString());
    expect(loadCheckpoint(FAKE_INPUT, TARGET)).not.toBeNull();
    clearCheckpoint(FAKE_INPUT, TARGET);
    expect(loadCheckpoint(FAKE_INPUT, TARGET)).toBeNull();
  });

  it('different targets produce different checkpoint files', () => {
    saveCheckpoint(FAKE_INPUT, 'gemini',     [1, 2], new Date().toISOString());
    saveCheckpoint(FAKE_INPUT, 'perplexity', [3, 4], new Date().toISOString());
    const g = loadCheckpoint(FAKE_INPUT, 'gemini');
    const p = loadCheckpoint(FAKE_INPUT, 'perplexity');
    expect(g!.has(1)).toBe(true);
    expect(g!.has(3)).toBe(false);
    expect(p!.has(3)).toBe(true);
    expect(p!.has(1)).toBe(false);
  });

  it('handles clearing a non-existent checkpoint without error', () => {
    expect(() => clearCheckpoint(FAKE_INPUT, TARGET)).not.toThrow();
  });
});
