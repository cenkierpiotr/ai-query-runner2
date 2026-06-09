import ExcelJS from 'exceljs';

export interface QueryRow {
  rowIndex: number;
  id: string;
  prompt: string;
  response?: string;
  status?: string;
  rawCols: Record<string, string>;
}

const QUERY_SHEET_NAMES = ['Queries', 'Zapytania', 'Prompts', 'Input', 'Sheet1', 'Arkusz1'];

export async function readQueriesFromExcel(filePath: string): Promise<QueryRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  let sheet = wb.worksheets[0];
  for (const name of QUERY_SHEET_NAMES) {
    const found = wb.getWorksheet(name);
    if (found) { sheet = found; break; }
  }
  if (!sheet) throw new Error('No worksheet found in Excel file');

  const rows: QueryRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rawCols: Record<string, string> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 26) {
        rawCols[String.fromCharCode(64 + colNumber)] = String(cell.value ?? '').trim();
      }
    });

    const promptRaw = rawCols['B'] ?? '';
    if (!promptRaw) return;

    rows.push({
      rowIndex: rowNumber,
      id:       rawCols['A'] || String(rowNumber - 1),
      prompt:   promptRaw,
      response: rawCols['C'] || undefined,
      status:   rawCols['D'] || undefined,
      rawCols,
    });
  });

  console.log(`[ExcelReader] Read ${rows.length} queries from "${sheet.name}" (${filePath})`);
  return rows;
}
