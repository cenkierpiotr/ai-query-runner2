import ExcelJS from 'exceljs';
import type { QueryRow } from '../input/ExcelReader.js';

const QUERY_SHEET_NAMES = ['Queries', 'Zapytania', 'Prompts', 'Input', 'Sheet1', 'Arkusz1'];

export async function writeResultsToExcel(
  filePath: string,
  results: QueryRow[],
  options?: { colOffset?: number; targetLabel?: string },
): Promise<void> {
  const colOffset   = options?.colOffset   ?? 0;
  const targetLabel = options?.targetLabel ?? '';

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  let sheet = wb.worksheets[0];
  for (const name of QUERY_SHEET_NAMES) {
    const found = wb.getWorksheet(name);
    if (found) { sheet = found; break; }
  }
  if (!sheet) throw new Error('No worksheet found in Excel file');

  // JSON expansion only for the primary (first) target column pair
  const jsonKeys = new Set<string>();
  const parsedResults = results.map(row => {
    let parsed: any = null;
    if (colOffset === 0) {
      try {
        const raw = (row.response || '').trim();
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
    }
    return { ...row, parsed };
  });

  const extraCols = colOffset === 0 ? Array.from(jsonKeys) : [];

  const headerRow = sheet.getRow(1);
  // ID and Prompt headers: set only once, no target suffix
  if (!headerRow.getCell(1).value) headerRow.getCell(1).value = 'ID';
  if (!headerRow.getCell(2).value) headerRow.getCell(2).value = 'Prompt';
  // Response/Status headers: always set (allows overwrite for A/B columns)
  headerRow.getCell(3 + colOffset).value = 'Response' + targetLabel;
  headerRow.getCell(4 + colOffset).value = 'Status'   + targetLabel;

  extraCols.forEach((colName, i) => {
    headerRow.getCell(5 + i).value = colName;
  });
  headerRow.commit();

  for (const row of parsedResults) {
    const sheetRow = sheet.getRow(row.rowIndex);
    sheetRow.getCell(3 + colOffset).value = row.response ?? '';
    sheetRow.getCell(4 + colOffset).value = row.status   ?? '';

    if (row.parsed) {
      extraCols.forEach((colName, i) => {
        let val = row.parsed[colName];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        sheetRow.getCell(5 + i).value = val ?? '';
      });
    }
    sheetRow.commit();
  }

  await wb.xlsx.writeFile(filePath);
  console.log(`[ExcelWriter] Wrote ${results.length} results to ${filePath}`);
}

export async function createTemplateExcel(filePath: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Queries');

  const header = sheet.addRow(['ID', 'Prompt', 'Response', 'Status']);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  sheet.addRow(['1', 'Opisz OpenAI w 3 zdaniach.', '', 'pending']);
  sheet.addRow(['2', 'Jaka jest stolica Polski?', '', 'pending']);
  sheet.addRow(['3', 'Wymień 5 najpopularniejszych języków programowania w 2025.', '', 'pending']);

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 60;
  sheet.getColumn(3).width = 80;
  sheet.getColumn(4).width = 12;

  await wb.xlsx.writeFile(filePath);
  console.log(`[ExcelWriter] Template created: ${filePath}`);
}
