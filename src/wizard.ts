#!/usr/bin/env node
/**
 * wizard.ts — Kreator konfiguracji AI Query Runner
 * Uruchom: npm run wizard   lub   npx tsx src/wizard.ts
 */

import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────

const W = Math.min(process.stdout.columns || 60, 70);

function stripAnsi(s: string): string {
  return s.replace(/\u001b\[[0-9;]*m/g, '');
}

function banner(lines: string[]): void {
  const inner = W - 2;
  console.log(chalk.cyan('╔' + '═'.repeat(inner) + '╗'));
  for (const line of lines) {
    const pad = inner - stripAnsi(line).length;
    console.log(chalk.cyan('║') + line + ' '.repeat(Math.max(0, pad)) + chalk.cyan('║'));
  }
  console.log(chalk.cyan('╚' + '═'.repeat(inner) + '╝'));
}

function stepHeader(n: number, total: number, title: string): void {
  console.log('\n' + chalk.bold.blue(`─── Krok ${n}/${total}: ${title} `));
}

const ok   = (m: string) => console.log(chalk.green('  ✓ ') + m);
const warn = (m: string) => console.log(chalk.yellow('  ⚠ ') + m);
const fail = (m: string) => console.log(chalk.red('  ✗ ') + m);
const info = (m: string) => console.log(chalk.gray('    → ') + m);

// ── Wizard ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.clear();

  banner([
    '',
    chalk.bold.white('   🤖  AI Query Runner — Kreator instalacji'),
    '',
    chalk.gray('   Wersja 1.0.0  |  Excel/Sheets → AI → Excel/Sheets'),
    '',
  ]);

  console.log();
  console.log('  Witaj! Ten kreator pomoże Ci skonfigurować narzędzie w kilka minut.');
  console.log('  Wystarczy odpowiadać na pytania — resztą zajmie się kreator.\n');

  const go = await confirm({ message: 'Zaczynamy?', default: true });
  if (!go) { console.log(chalk.yellow('\nAnulowano.')); process.exit(0); }

  // ── KROK 1: Wymagania ────────────────────────────────────────────────────
  stepHeader(1, 5, 'Sprawdzanie wymagań systemowych');

  const nodeMajor = parseInt(process.version.slice(1));
  if (nodeMajor >= 18) {
    ok(`Node.js ${process.version}`);
  } else {
    fail(`Node.js ${process.version} — wymagana wersja 18+`);
    info('Pobierz aktualizację z: https://nodejs.org');
    process.exit(1);
  }

  try {
    const npmVer = execSync('npm --version', { encoding: 'utf8' }).trim();
    ok(`npm ${npmVer}`);
  } catch {
    fail('npm niedostępny — zainstaluj Node.js z https://nodejs.org');
    process.exit(1);
  }

  // ── KROK 2: Instalacja pakietów ──────────────────────────────────────────
  stepHeader(2, 5, 'Instalacja komponentów');

  if (!existsSync(resolve(ROOT, 'node_modules'))) {
    console.log('  Instalowanie pakietów npm (poczekaj chwilę)...');
    try {
      execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
      ok('Pakiety npm zainstalowane');
    } catch {
      fail('npm install nie powiódł się');
      process.exit(1);
    }
  } else {
    ok('Pakiety npm — już zainstalowane');
  }

  const installBrowser = await confirm({
    message: 'Zainstalować/zaktualizować przeglądarkę Chromium? (wymagana do pracy)',
    default: true,
  });

  if (installBrowser) {
    console.log('  Pobieranie Chromium (może potrwać kilka minut)...\n');
    try {
      execSync('npx playwright install chromium', { cwd: ROOT, stdio: 'inherit' });
      ok('Chromium zainstalowany');
    } catch {
      warn('Chromium nie mógł być zainstalowany automatycznie');
      info('Uruchom ręcznie po zakończeniu: npx playwright install chromium');
    }
  }

  // ── KROK 3: Konfiguracja AI ──────────────────────────────────────────────
  stepHeader(3, 5, 'Wybór serwisu AI');

  console.log(chalk.gray('  Możesz zmienić serwis w dowolnym momencie edytując plik .env\n'));

  const targetSite = await select({
    message: 'Którego serwisu AI chcesz używać?',
    choices: [
      { name: '🔵 Gemini (Google)    — gemini.google.com', value: 'gemini' },
      { name: '🟣 Perplexity         — perplexity.ai',     value: 'perplexity' },
      { name: '🟠 Claude (Anthropic) — claude.ai',          value: 'claude' },
      { name: '🔍 Google Search      — google.com',         value: 'google' },
    ],
    default: 'gemini',
  });

  const headless = await confirm({
    message: 'Uruchamiać przeglądarkę w tle (bez widocznego okna)?',
    default: false,
  });
  if (headless) {
    warn('Tryb headless na Linux wymaga uruchomionego serwera X (DISPLAY).');
  }

  const dailyLimitRaw = await input({
    message: 'Dzienny limit zapytań do AI:',
    default: '150',
    validate: (v) => (!isNaN(parseInt(v)) && parseInt(v) > 0) || 'Wpisz liczbę > 0',
  });

  const nightQuiet = await confirm({
    message: 'Włączyć nocną przerwę (brak zapytań między 23:00 a 7:00)?',
    default: true,
  });

  // ── KROK 4: Google Sheets ────────────────────────────────────────────────
  stepHeader(4, 5, 'Integracja z Google Sheets (opcjonalna)');

  console.log(chalk.gray('  Pomiń ten krok jeśli chcesz używać tylko plików Excel.\n'));

  const useSheets = await confirm({
    message: 'Chcesz skonfigurować Google Sheets?',
    default: false,
  });

  let googleServiceAccountJson = '';
  let googleApiKey = '';

  if (useSheets) {
    const authMethod = await select({
      message: 'Metoda dostępu do Sheets:',
      choices: [
        { name: 'Service Account JSON (odczyt + zapis, prywatne arkusze)', value: 'sa' },
        { name: 'API Key              (tylko odczyt, publiczne arkusze)',    value: 'key' },
      ],
    });

    if (authMethod === 'sa') {
      info('Wklej zawartość pliku JSON konta serwisowego (wszystko w jednej linii):');
      googleServiceAccountJson = await input({
        message: 'Service Account JSON:',
        validate: (v) => {
          if (!v.trim()) return 'Pole wymagane';
          try { JSON.parse(v); return true; } catch { return 'Nieprawidłowy JSON'; }
        },
      });
    } else {
      googleApiKey = await input({
        message: 'Google API Key (opcjonalnie):',
        validate: (v) => v.trim().length > 10 || 'Klucz wydaje się być za krótki',
      });
    }
  }

  // ── KROK 5: Zapis konfiguracji ───────────────────────────────────────────
  stepHeader(5, 5, 'Zapisywanie konfiguracji');

  const envLines = [
    `# ai-query-runner — konfiguracja wygenerowana ${new Date().toLocaleString('pl-PL')}`,
    '',
    `TARGET_SITE=${targetSite}`,
    `HEADLESS=${headless}`,
    `DAILY_LIMIT=${dailyLimitRaw}`,
    `PAUSE_MIN_MS=5000`,
    `PAUSE_MAX_MS=15000`,
    nightQuiet ? `NIGHT_START=23` : `# NIGHT_START=23`,
    nightQuiet ? `NIGHT_END=7`    : `# NIGHT_END=7`,
    `BRIDGE_PORT=3535`,
    '',
  ];
  if (googleServiceAccountJson) envLines.push(`GOOGLE_SERVICE_ACCOUNT_JSON=${googleServiceAccountJson}`);
  if (googleApiKey)             envLines.push(`GOOGLE_API_KEY=${googleApiKey}`);

  writeFileSync(resolve(ROOT, '.env'), envLines.join('\n') + '\n', 'utf8');
  ok('Plik .env zapisany');

  const createXlsx = await confirm({
    message: 'Utworzyć przykładowy plik Excel (queries.xlsx)?',
    default: true,
  });

  if (createXlsx) {
    try {
      execSync('npx tsx src/main.ts --create-template queries.xlsx', { cwd: ROOT, stdio: 'pipe' });
      ok('Plik queries.xlsx utworzony');
    } catch {
      warn('Nie udało się stworzyć queries.xlsx — spróbuj ręcznie:');
      info('npx tsx src/main.ts --create-template queries.xlsx');
    }
  }

  // ── Podsumowanie ──────────────────────────────────────────────────────────
  console.log('\n');
  banner([
    '',
    chalk.bold.green('  ✅  Konfiguracja zakończona pomyślnie!'),
    '',
  ]);

  console.log(`
  ${chalk.bold('📋 Jak zacząć:')}

  ${chalk.white('1.')} Otwórz plik ${chalk.cyan('queries.xlsx')} i wpisz zapytania w kolumnie ${chalk.cyan('B (Prompt)')}.

  ${chalk.white('2.')} Uruchom przetwarzanie:
     ${chalk.cyan('npx tsx src/main.ts --input queries.xlsx')}

  ${chalk.white('3.')} Przy pierwszym uruchomieniu zaloguj się do ${chalk.bold(targetSite.toUpperCase())}
     w oknie przeglądarki — sesja zostanie zapamiętana.

  ${chalk.white('4.')} Wyniki pojawią się w kolumnie ${chalk.cyan('C (Response)')} pliku Excel.

  ${chalk.gray('─ Opcje: npx tsx src/main.ts --help')}
  ${chalk.gray('─ Ustawienia: .env')}
  ${chalk.gray('─ Dokumentacja: README.md')}
`);
}

main().catch((e) => {
  if (e?.name === 'ExitPromptError') {
    console.log(chalk.yellow('\nInstalacja przerwana.'));
    process.exit(0);
  }
  console.error(chalk.red('\n[Kreator] Błąd:'), e?.message ?? e);
  process.exit(1);
});
