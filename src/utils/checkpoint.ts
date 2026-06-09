import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';

interface CheckpointData {
  inputPath: string;
  target: string;
  completedRows: number[];
  startedAt: string;
  updatedAt: string;
}

const md5 = (s: string) => createHash('md5').update(s).digest('hex');

function checkpointPath(inputPath: string, target: string): string {
  return resolve(dirname(inputPath), '.aqr-checkpoint-' + md5(inputPath + target).slice(0, 8) + '.json');
}

export function loadCheckpoint(inputPath: string, target: string): Set<number> | null {
  try {
    const p = checkpointPath(inputPath, target);
    if (!existsSync(p)) return null;
    const data: CheckpointData = JSON.parse(readFileSync(p, 'utf-8'));
    if (data.inputPath !== inputPath || data.target !== target) return null;
    console.log(`[Checkpoint] Wznawiam od checkpointu (${data.completedRows.length} wierszy już gotowych)`);
    return new Set(data.completedRows);
  } catch { return null; }
}

export function saveCheckpoint(inputPath: string, target: string, completedRows: number[], startedAt: string): void {
  try {
    const data: CheckpointData = { inputPath, target, completedRows, startedAt, updatedAt: new Date().toISOString() };
    writeFileSync(checkpointPath(inputPath, target), JSON.stringify(data));
  } catch {}
}

export function clearCheckpoint(inputPath: string, target: string): void {
  try { unlinkSync(checkpointPath(inputPath, target)); } catch {}
}
