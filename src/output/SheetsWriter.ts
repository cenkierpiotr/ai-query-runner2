/**
 * SheetsWriter — writes AI responses back to Google Sheets
 *
 * Updates columns C (response) and D (status) using batchUpdate.
 * Only modifies rows that were processed — existing data in other columns is preserved.
 */

import { google } from 'googleapis';
import { config } from '../config/config.js';
import { parseSheetsRef } from '../input/SheetsReader.js';
import type { QueryRow } from '../input/ExcelReader.js';

async function getAuthClient() {
  if (config.googleServiceAccountJson) {
    const key = JSON.parse(config.googleServiceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth.getClient();
  }
  throw new Error('Google Sheets write requires service account auth (GOOGLE_SERVICE_ACCOUNT_JSON)');
}

export async function writeResultsToSheets(
  sheetsRef: string,
  results: QueryRow[],
): Promise<void> {
  if (results.length === 0) return;

  const { spreadsheetId, range } = parseSheetsRef(sheetsRef);
  // Extract sheet name from range (e.g. "Sheet1!A:D" → "Sheet1")
  const sheetName = range.includes('!') ? range.split('!')[0] : range;

  // Extract dynamic JSON columns
  const jsonKeys = new Set<string>();
  const parsedResults = results.map(row => {
    let parsed: any = null;
    try {
      const raw = (row.response || '').trim();
      // Strip markdown code fences first (AI often wraps JSON in ```json...```)
      const mdMatch = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
      const txt = mdMatch ? mdMatch[1]!.trim() : raw;
      if ((txt.startsWith('{') && txt.endsWith('}')) || (txt.startsWith('[') && txt.endsWith(']'))) {
        const obj = JSON.parse(txt);
        parsed = Array.isArray(obj) ? obj[0] : obj;
        if (typeof parsed === 'object' && parsed !== null) {
          Object.keys(parsed).forEach(k => jsonKeys.add(k));
        }
      }
    } catch {}
    return { ...row, parsed };
  });

  const extraCols = Array.from(jsonKeys);

  // Helper to convert index (0-based) to column letter (A, B, C...)
  const colLetter = (i: number) => {
    let lettr = '';
    while (i >= 0) {
      lettr = String.fromCharCode(65 + (i % 26)) + lettr;
      i = Math.floor(i / 26) - 1;
    }
    return lettr;
  };

  const authClient = await getAuthClient();
  const sheetsApi = google.sheets({ version: 'v4', auth: authClient as any });

  // If we found extra columns, update the header row first
  if (extraCols.length > 0) {
    const headerRange = `${sheetName}!E1:${colLetter(4 + extraCols.length - 1)}1`;
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: 'RAW',
      requestBody: { values: [extraCols] },
    });
  }

  // Build batch data
  const data = parsedResults.map(row => {
    const rowData = [row.response ?? '', row.status ?? ''];
    if (extraCols.length > 0) {
      extraCols.forEach(colName => {
        let val = row.parsed ? row.parsed[colName] : '';
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        rowData.push(val ?? '');
      });
    }
    
    // Column C is index 2. End column is 2 + 1 (status) + extraCols.length = 3 + extraCols.length
    const endCol = colLetter(3 + extraCols.length);
    
    return {
      range:  `${sheetName}!C${row.rowIndex}:${endCol}${row.rowIndex}`,
      values: [rowData],
    };
  });

  await sheetsApi.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data,
    },
  });

  console.log(`[SheetsWriter] Wrote ${results.length} results to ${spreadsheetId} / ${sheetName}`);
}

/**
 * Ensures the sheet has proper headers in row 1.
 */
export async function ensureSheetsHeader(sheetsRef: string): Promise<void> {
  const { spreadsheetId, range } = parseSheetsRef(sheetsRef);
  const sheetName = range.includes('!') ? range.split('!')[0] : range;

  const authClient = await getAuthClient();
  const sheetsApi = google.sheets({ version: 'v4', auth: authClient as any });

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:D1`,
    valueInputOption: 'RAW',
    requestBody: { values: [['ID', 'Prompt', 'Response', 'Status']] },
  });
}
