import { google } from 'googleapis';
import { config } from '../config/config.js';
import type { QueryRow } from './ExcelReader.js';

async function getAuthClient() {
  if (config.googleServiceAccountJson) {
    const key = JSON.parse(config.googleServiceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth.getClient();
  }
  const apiKey = process.env['GOOGLE_API_KEY'];
  if (apiKey) return null;
  throw new Error('Google Sheets auth not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_API_KEY in environment.');
}

export function parseSheetsRef(ref: string): { spreadsheetId: string; range: string } {
  const clean = ref.startsWith('sheets:') ? ref.slice(7) : ref;
  const colonIdx = clean.indexOf(':');
  if (colonIdx === -1) throw new Error(`Invalid sheets reference: "${ref}". Use "SPREADSHEET_ID:Sheet1!A:D"`);
  return { spreadsheetId: clean.slice(0, colonIdx), range: clean.slice(colonIdx + 1) };
}

export async function readQueriesFromSheets(sheetsRef: string): Promise<QueryRow[]> {
  const { spreadsheetId, range } = parseSheetsRef(sheetsRef);
  const authClient = await getAuthClient();
  const sheetsApi = google.sheets({ version: 'v4', auth: authClient as any });
  const apiKey = process.env['GOOGLE_API_KEY'];

  const response = await sheetsApi.spreadsheets.values.get({
    spreadsheetId, range,
    ...(apiKey && !authClient ? { key: apiKey } : {}),
  });

  const values = response.data.values ?? [];
  const rows: QueryRow[] = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i]!;

    const rawCols: Record<string, string> = {};
    row.forEach((val, idx) => {
      if (idx < 26) rawCols[String.fromCharCode(65 + idx)] = String(val ?? '').trim();
    });

    const promptRaw = rawCols['B'] ?? '';
    if (!promptRaw) continue;

    rows.push({
      rowIndex: i + 1,
      id:       rawCols['A'] || String(i),
      prompt:   promptRaw,
      response: rawCols['C'] || undefined,
      status:   rawCols['D'] || undefined,
      rawCols,
    });
  }

  console.log(`[SheetsReader] Read ${rows.length} queries from ${spreadsheetId} / ${range}`);
  return rows;
}
