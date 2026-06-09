import { writeFileSync } from 'fs';
import type { QueryRow } from '../input/ExcelReader.js';

function csvCell(val: string): string {
  if (/[",\n\r]/.test(val)) return '"' + val.replace(/"/g, '""') + '"';
  return val;
}

export function exportToCsv(results: QueryRow[], outputPath: string): void {
  const header = 'ID,Prompt,Response,Status';
  const rows = results.map(r =>
    [csvCell(r.id), csvCell(r.prompt), csvCell(r.response ?? ''), csvCell(r.status ?? '')].join(',')
  );
  writeFileSync(outputPath, '﻿' + [header, ...rows].join('\n'), 'utf-8');
  console.log(`[CsvExporter] Zapisano ${results.length} wierszy → ${outputPath}`);
}

export function exportToJson(results: QueryRow[], outputPath: string): void {
  const data = results.map(r => ({ id: r.id, prompt: r.prompt, response: r.response ?? '', status: r.status ?? '' }));
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[JsonExporter] Zapisano ${results.length} wierszy → ${outputPath}`);
}
