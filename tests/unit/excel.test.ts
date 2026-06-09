import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { createTemplateExcel, writeResultsToExcel } from '../../src/output/ExcelWriter.js';
import { readQueriesFromExcel } from '../../src/input/ExcelReader.js';
import type { QueryRow } from '../../src/input/ExcelReader.js';

const TMP = join(process.cwd(), '.tmp-test-excel');

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('createTemplateExcel', () => {
  it('creates a valid xlsx file', async () => {
    const path = join(TMP, 'template.xlsx');
    await createTemplateExcel(path);
    const rows = await readQueriesFromExcel(path);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('template has correct headers (ID, Prompt)', async () => {
    const path = join(TMP, 'template.xlsx');
    await createTemplateExcel(path);
    const rows = await readQueriesFromExcel(path);
    // Rows have ids starting at '1'
    expect(rows[0]!.id).toBe('1');
  });

  it('template rows have non-empty prompts', async () => {
    const path = join(TMP, 'template.xlsx');
    await createTemplateExcel(path);
    const rows = await readQueriesFromExcel(path);
    expect(rows.every(r => r.prompt.length > 0)).toBe(true);
  });
});

describe('readQueriesFromExcel + writeResultsToExcel round-trip', () => {
  it('writes results and reads them back', async () => {
    const path = join(TMP, 'roundtrip.xlsx');
    await createTemplateExcel(path);

    const rows = await readQueriesFromExcel(path);
    const updated: QueryRow[] = rows.map(r => ({ ...r, response: 'Answer for ' + r.id, status: 'done' }));
    await writeResultsToExcel(path, updated);

    const reloaded = await readQueriesFromExcel(path);
    expect(reloaded[0]!.response).toBe('Answer for 1');
    expect(reloaded[0]!.status).toBe('done');
  });

  it('JSON expansion creates extra columns', async () => {
    const path = join(TMP, 'json-expand.xlsx');
    await createTemplateExcel(path);

    const rows = await readQueriesFromExcel(path);
    const updated: QueryRow[] = rows.slice(0, 1).map(r => ({
      ...r,
      response: '{"Name":"Alice","Age":30}',
      status: 'done',
    }));
    await writeResultsToExcel(path, updated);

    // Re-read the workbook raw to check extra columns exist
    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.default.Workbook();
    await wb.xlsx.readFile(path);
    const sheet = wb.worksheets[0]!;
    const header = sheet.getRow(1);
    const colNames = [1, 2, 3, 4, 5, 6].map(c => String(header.getCell(c).value ?? ''));
    expect(colNames).toContain('Name');
    expect(colNames).toContain('Age');
  });

  it('A/B mode writes to offset columns', async () => {
    const path = join(TMP, 'ab-mode.xlsx');
    await createTemplateExcel(path);

    const rows = await readQueriesFromExcel(path);
    const updated: QueryRow[] = rows.slice(0, 1).map(r => ({ ...r, response: 'B-answer', status: 'done' }));
    await writeResultsToExcel(path, updated, { colOffset: 2, targetLabel: ' [deepseek]' });

    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.default.Workbook();
    await wb.xlsx.readFile(path);
    const sheet = wb.worksheets[0]!;
    const header = sheet.getRow(1);
    // colOffset=2 → Response at col 5, Status at col 6
    expect(String(header.getCell(5).value)).toContain('Response');
    expect(String(header.getCell(5).value)).toContain('deepseek');
  });

  it('skips rows with empty prompt', async () => {
    const path = join(TMP, 'skip-empty.xlsx');
    await createTemplateExcel(path);
    const rows = await readQueriesFromExcel(path);
    expect(rows.every(r => r.prompt.trim().length > 0)).toBe(true);
  });
});

describe('rawCols mapping', () => {
  it('maps column A to rawCols.A', async () => {
    const path = join(TMP, 'rawcols.xlsx');
    await createTemplateExcel(path);
    const rows = await readQueriesFromExcel(path);
    expect(rows[0]!.rawCols['A']).toBeDefined();
    expect(rows[0]!.rawCols['B']).toBe(rows[0]!.prompt);
  });
});
