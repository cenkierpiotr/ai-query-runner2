/**
 * portable.ts — runtime detection of portable vs. dev mode.
 *
 * Portable binary is detected by the presence of a `.portable` marker file
 * placed next to the compiled executable during the build process.
 *
 * In portable mode all user data (settings, auth, results, uploads) is stored
 * next to the binary so the entire folder can be moved / run from a USB drive.
 */

import { existsSync } from 'fs';
import { dirname, join } from 'path';

/**
 * Directory containing the running executable.
 * In compiled Bun binaries process.execPath points to the Bun internal /$bunfs
 * virtual fs, so we use process.argv[0] which always reflects the real path.
 */
export const EXEC_DIR = dirname(
  process.argv[0] && !process.argv[0].startsWith('/$bunfs')
    ? process.argv[0]
    : process.execPath
);

/**
 * True when running as a compiled portable binary.
 * Detected by the `.portable` marker file placed next to the binary at build time.
 */
export const IS_PORTABLE: boolean = existsSync(join(EXEC_DIR, '.portable'));

/**
 * Root directory for all user data files.
 * - Portable mode : folder containing the binary  (e.g. C:\Downloads\ai-query-runner\)
 * - Dev mode      : process.cwd()  (project root, same behaviour as before)
 */
export const DATA_DIR: string = IS_PORTABLE ? EXEC_DIR : process.cwd();

/**
 * Directory where bundled Chromium lives (portable mode only).
 * Layout expected by build scripts:
 *   <exec_dir>/chromium/chrome          (Linux)
 *   <exec_dir>/chromium/chrome.exe      (Windows)
 *   <exec_dir>/chromium/Chromium.app/…  (macOS)
 */
export const PORTABLE_CHROMIUM_DIR: string = join(EXEC_DIR, 'chromium');

/** Resolve a path relative to DATA_DIR. */
export function dataPath(...segments: string[]): string {
  return join(DATA_DIR, ...segments);
}
