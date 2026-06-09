import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { exportToCsv, exportToJson } from '../../src/output/CsvJsonExporter.js';
import type { QueryRow } from '../../src/input/ExcelReader.js';

const TMP = join(process.cwd(), '.tmp-test-csv');

const ROWS: QueryRow[] = [
  { rowIndex: 2, id: '1', prompt: 'What is AI?',      response: 'AI is...', status: 'done',         rawCols: {} },
  { rowIndex: 3, id: '2', prompt: 'Comma, test',      response: 'A, B, C',  status: 'done',         rawCols: {} },
  { rowIndex: 4, id: '3', prompt: 'Quote "test"',     response: 'He said "hi"', status: 'done',     rawCols: {} },
  { rowIndex: 5, id: '4', prompt: 'Newline\ntest',    response: 'Line1\nLine2', status: 'error',    rawCols: {} },
  { rowIndex: 6, id: '5', prompt: 'Empty response',   response: undefined,  status: undefined,      rawCols: {} },
];

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('exportToCsv', () => {
  it('writes UTF-8 BOM as first 3 bytes', () => {
    const path = join(TMP, 'out.csv');
    exportToCsv(ROWS, path);
    const raw = readFileSync(path);
    expect(raw[0]).toBe(0xEF);
    expect(raw[1]).toBe(0xBB);
    expect(raw[2]).toBe(0xBF);
  });

  it('first non-BOM line is the header', () => {
    const path = join(TMP, 'out.csv');
    exportToCsv(ROWS, path);
    // Strip BOM before splitting so header comparison is exact
    const content = readFileSync(path, 'utf-8').replace(/^﻿/, '');
    const firstLine = content.split('\n')[0]!;
    expect(firstLine).toBe('ID,Prompt,Response,Status');
  });

  it('quotes values containing commas', () => {
    const path = join(TMP, 'out.csv');
    exportToCsv(ROWS, path);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('"Comma, test"');
  });

  it('escapes internal double-quotes', () => {
    const path = join(TMP, 'out.csv');
    exportToCsv(ROWS, path);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('"He said ""hi"""');
  });

  it('quotes values containing newlines', () => {
    const path = join(TMP, 'out.csv');
    exportToCsv(ROWS, path);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('"Newline\ntest"');
  });

  it('contains all row IDs', () => {
    const path = join(TMP, 'out.csv');
    exportToCsv(ROWS, path);
    const content = readFileSync(path, 'utf-8');
    for (const row of ROWS) {
      expect(content).toContain(row.id);
    }
  });

  it('handles undefined response and status as empty string', () => {
    const path = join(TMP, 'out.csv');
    exportToCsv(ROWS, path);
    const content = readFileSync(path, 'utf-8');
    // Row with empty response: ends in two trailing commas (empty response, empty status)
    expect(content).toContain('Empty response,,');
  });
});

describe('exportToJson', () => {
  it('writes valid JSON array', () => {
    const path = join(TMP, 'out.json');
    exportToJson(ROWS, path);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(ROWS.length);
  });

  it('each item has id, prompt, response, status', () => {
    const path = join(TMP, 'out.json');
    exportToJson(ROWS, path);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const first = data[0];
    expect(first).toHaveProperty('id', '1');
    expect(first).toHaveProperty('prompt', 'What is AI?');
    expect(first).toHaveProperty('response', 'AI is...');
    expect(first).toHaveProperty('status', 'done');
  });

  it('converts undefined response/status to empty string', () => {
    const path = join(TMP, 'out.json');
    exportToJson(ROWS, path);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const last = data[4];
    expect(last.response).toBe('');
    expect(last.status).toBe('');
  });

  it('is pretty-printed (multi-line)', () => {
    const path = join(TMP, 'out.json');
    exportToJson(ROWS, path);
    const raw = readFileSync(path, 'utf-8');
    expect(raw.split('\n').length).toBeGreaterThan(2);
  });
});
