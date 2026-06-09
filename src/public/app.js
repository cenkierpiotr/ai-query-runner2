/* ═══════════════════════════════════════════════════════════════════
   i18n — tłumaczenia PL (domyślny) / EN
   ═══════════════════════════════════════════════════════════════════ */

const TRANSLATIONS = {
  pl: {
    // Header / status
    'status.connecting':      'Łączenie...',
    'status.ready':           'Gotowy',
    'status.running':         'Trwa zadanie...',
    'status.noConnection':    'Brak połączenia',
    // Cards
    'card.status':            'Status systemu',
    'card.run':               'Uruchom zadanie',
    // Stats
    'stat.target':            'Serwis AI',
    'stat.state':             'Stan',
    'stat.today':             'Zapytania dziś',
    'stat.night':             'Cisza nocna',
    'stat.dailyLimit':        'Limit dzienny',
    // State values
    'state.processing':       '⚙️ Przetwarzanie',
    'state.idle':             '✅ Bezczynny',
    'night.yes':              '🌙 Tak',
    'night.no':               '☀️ Nie',
    // Tabs
    'tab.excel':              '📊 Plik Excel',
    'tab.sheets':             '🔗 Google Sheets',
    // Dropzone
    'dropzone.title':         'Przeciągnij plik Excel tutaj',
    'dropzone.sub':           'lub kliknij, aby wybrać',
    // Sheets
    'sheets.idLabel':         'ID arkusza Google Sheets',
    'sheets.idPlaceholder':   'sheets:SPREADSHEET_ID:Sheet1!A:D',
    'sheets.formatHint':      'Format:',
    'sheets.outLabel':        'Arkusz wyjściowy (opcjonalnie)',
    'sheets.outPlaceholder':  '= ten sam co wejściowy',
    // Fields
    'field.target':           'Serwis AI',
    'opt.skipDone':           'Pomiń gotowe (done)',
    'opt.headless':           'Tryb headless',
    'opt.json':               '💻 Wymuś JSON (Auto-rozbicie na kolumny)',
    'hint.json':              'Zaznacz to, a my poprosimy AI o JSON (np. <code>{"Imie":"Jan","Wiek":30}</code>) i automatycznie stworzymy z tych danych osobne kolumny w Twoim pliku.',
    'field.sysPrompt':        'Dodatkowe instrukcje / Kontekst',
    'field.sysPromptPlaceholder': 'Np. Przetłumacz na polski i sformatuj wynik zwięźle... (opcjonalnie)',
    'field.limit':            'Limit wierszy (0 = bez limitu)',
    // Schedule
    'schedule.title':         '🕒 Harmonogram i limity czasowe',
    'schedule.start':         'Początek pracy (godzina 0-23)',
    'schedule.end':           'Koniec pracy (godzina 0-23)',
    'schedule.days':          'Dni robocze (1=Pon, 2=Wt … 6=Sob, 0=Ndz)',
    'schedule.pauseMin':      'Przerwa MIN (sekundy)',
    'schedule.pauseMax':      'Przerwa MAX (sekundy)',
    // Buttons
    'btn.run':                '▶ Uruchom',
    'btn.stop':               '⏹ Zatrzymaj',
    // Terminal
    'terminal.empty':         'Brak aktywnego zadania...',
    // Progress / done
    'progress.text':          'Przetwarzanie...',
    'batch.running':          '⚙️ Trwa...',
    'done.ok':                '✅ Zakończono! {done} / {total} zapytań.',
    'done.err':               '❌ Zakończono z błędem (kod {code}).',
    'done.label.ok':          '✅ Gotowe',
    'done.label.err':         '❌ Błąd',
    // Error messages
    'err.noFile':             'Wybierz plik Excel.',
    'err.noSheets':           'Podaj adres Google Sheets.',
    'err.startFail':          'Błąd startu: ',
    'err.connect':            'Błąd połączenia: ',
    'err.format':             'Nieobsługiwany format. Użyj .xlsx lub .xls',
    'stop.user':              'Zatrzymano przez użytkownika.',
    'link.template':          '⬇ Pobierz przykładowy szablon Excel',
    'btn.pause':              '⏸ Pauza',
    'btn.resume':             '▶ Wznów',
    'opt.exportCsv':          '📄 Eksport CSV',
    'opt.exportJson':         '📋 Eksport JSON',
    'hint.export':            'Tworzy dodatkowe pliki CSV/JSON obok pliku Excel — do otwarcia w innych programach.',
    'ab.label':               'Porównaj z innymi serwisami A/B (opcjonalnie)',
    'ab.placeholder':         'np. deepseek,mistral',
    'ab.hint':                'Wyniki każdego serwisu trafią do osobnych kolumn w pliku.',
    // Preview & strip markdown
    'opt.preview':            'Tryb podglądu — tylko 3 wiersze',
    'hint.preview':           'Przetworzy wyłącznie 3 pierwsze wiersze. Sprawdź wyniki przed puszczeniem całego pliku.',
    'opt.stripMarkdown':      'Usuń formatowanie Markdown',
    'hint.stripMarkdown':     'Usuwa z odpowiedzi **pogrubienie**, ## nagłówki, `kod` i inne znaczniki — zostawia czysty tekst.',
    'btn.resetConfig':        '↩ Przywróć domyślne',
    'config.saved':           'Ustawienia zapisane',
    // Steps
    'step.source':            'Wybierz plik lub arkusz',
    'step.ai':                'Wybierz serwis AI',
    'step.instructions':      'Instrukcje dla AI (opcjonalne)',
    'step.advanced':          '⚙️ Opcje zaawansowane',
    // Advanced sub-labels
    'adv.behavior':           'Zachowanie',
    'adv.format':             'Format odpowiedzi',
    'adv.export':             'Eksport dodatkowy',
    'adv.limit':              'Limit wierszy',
    'adv.schedule':           'Harmonogram i przerwy',
    // Updated option labels
    'opt.headless':           'Ukryta przeglądarka',
    'opt.skipDone':           'Pomiń ukończone',
    'opt.json':               'Rozbij JSON na kolumny',
    // Hints for toggles
    'hint.skipDone':          'Pomija wiersze ze statusem "done". Przydatne przy wznawianiu przerwanego zadania.',
    'hint.headless':          'Przeglądarka działa w tle bez okna. Zalecane po pierwszym logowaniu.',
    'hint.exportCsv':         'Tworzy plik .csv obok pliku Excel — otwieralny w każdym arkuszu kalkulacyjnym.',
    'hint.exportJson':        'Tworzy plik .json obok pliku Excel — do integracji z innymi aplikacjami.',
    'hint.limit':             '0 = przetwórz wszystkie wiersze',
    'hint.templateVars':      '💡 Zmienne: <code>{{A}}</code> = kol. A, <code>{{B}}</code> = kol. B, <code>{{C}}</code> = kol. C',
    // Schedule
    'schedule.start':         'Praca od godziny',
    'schedule.end':           'Do godziny',
    'schedule.pauseMin':      'Min. przerwa (sek)',
    'schedule.pauseMax':      'Max. przerwa (sek)',
    // Settings modal
    'settings.title':         '⚙️ Ustawienia',
    'settings.section.limits':'Limity',
    'settings.dailyLimit':    'Maks. zapytań dziennie',
    'settings.maxChars':      'Limit długości odpowiedzi (0 = bez limitu)',
    'settings.section.pauses':'Przerwy między zapytaniami',
    'settings.pauseMin':      'Minimalna (sekundy)',
    'settings.pauseMax':      'Maksymalna (sekundy)',
    'settings.section.night': 'Cisza nocna',
    'settings.nightHint':     'Narzędzie nie wysyła zapytań w godzinach ciszy nocnej.',
    'settings.nightStart':    'Od godziny',
    'settings.nightEnd':      'Do godziny',
    'settings.section.retry': 'Ponowne próby przy błędzie',
    'settings.retryCount':    'Liczba prób',
    'settings.retryDelay':    'Przerwa między próbami (sekundy)',
    'settings.section.browser':'Przeglądarka i format',
    'settings.headless':      'Tryb headless (przeglądarka w tle, niewidoczna)',
    'settings.stripMd':       'Usuń formatowanie Markdown z odpowiedzi',
    'settings.section.google':'Google API',
    'settings.optional':      '(opcjonalne)',
    'settings.googleHint':    'Wymagane tylko do trybu google-api i Google Sheets.',
    'settings.googleKey':     'Google API Key',
    'settings.googleCse':     'Google CSE ID (Search Engine ID)',
    'settings.serviceAccount':'Service Account JSON (Google Sheets)',
    'settings.cancel':        'Anuluj',
    'settings.save':          'Zapisz ustawienia',
    'settings.saved':         '✓ Zapisano',
    'settings.error':         '✗ Błąd zapisu',
    'settings.section.aiapi': 'Bezpośrednie API (Generator zadań)',
    'settings.aiapiHint':     'Wymagane do zakładki „Generator zadań" oraz targetów gemini-api i openrouter.',
    'settings.geminiKey':     'Gemini API Key',
    'settings.geminiModel':   'Domyślny model Gemini API',
    'settings.openRouterKey': 'OpenRouter API Key',
    'settings.openRouterModel':'Domyślny model OpenRouter',
    'settings.internetWarning': 'Nie wszystkie modele mają dostęp do internetu. Modele bez web search bazują wyłącznie na wiedzy z treningu — wyniki mogą być nieaktualne lub nieprecyzyjne. Sprawdź dokumentację modelu przed użyciem do wyszukiwania aktualnych danych.',
    'gen.internetNotice':     '⚠️ Generowanie promptów nie wymaga internetu — to zwykłe zadanie dla LLM. Pamiętaj jednak, że wybrany target może nie mieć dostępu do aktualnych danych, jeśli nie jest wyszukiwarką.',
    // Mode tabs
    'mode.run':               '📋 Uruchom zadanie',
    'mode.generator':         '🧠 Generator zadań',
    // Generator
    'gen.title':              '🧠 Generator zadań',
    'gen.desc':               'Opisz co chcesz osiągnąć — AI przygotuje gotową listę promptów dopasowaną do wybranego serwisu. Możesz przejrzeć wynik przed uruchomieniem.',
    'gen.intentLabel':        'Twoja intencja',
    'gen.intentPlaceholder':  'Np. Znajdź firmy zajmujące się produkcją kredek w 20 największych miastach Polski. Zwróć nazwę firmy, NIP, adres i telefon.',
    'gen.targetLabel':        'Target (gdzie trafią prompty)',
    'gen.providerLabel':      'Model do generowania promptów',
    'gen.modelLabel':         'Model (opcjonalnie)',
    'gen.modelHint':          'Zostaw puste — użyje domyślnego modelu z ustawień.',
    'gen.btnGenerate':        'Generuj prompty',
    'gen.previewEmpty':       'Wygenerowane prompty pojawią się tutaj.',
    'gen.previewCount':       'Wygenerowano {n} promptów',
    'gen.btnDownload':        '⬇ Pobierz Excel',
    'gen.btnRun':             '▶ Uruchom zadanie',
    'gen.colPrompt':          'Prompt',
    'gen.generating':         'Generuję prompty…',
    'gen.noKey':              'Brak klucza API. Ustaw go w ⚙️ Ustawienia.',
    'gen.noIntent':           'Wpisz intencję przed generowaniem.',
  },
  en: {
    'status.connecting':      'Connecting...',
    'status.ready':           'Ready',
    'status.running':         'Running...',
    'status.noConnection':    'No connection',
    'card.status':            'System status',
    'card.run':               'Run task',
    'stat.target':            'AI service',
    'stat.state':             'State',
    'stat.today':             'Queries today',
    'stat.night':             'Night quiet',
    'stat.dailyLimit':        'Daily limit',
    'state.processing':       '⚙️ Processing',
    'state.idle':             '✅ Idle',
    'night.yes':              '🌙 Yes',
    'night.no':               '☀️ No',
    'tab.excel':              '📊 Excel File',
    'tab.sheets':             '🔗 Google Sheets',
    'dropzone.title':         'Drag Excel file here',
    'dropzone.sub':           'or click to select',
    'sheets.idLabel':         'Google Sheets ID',
    'sheets.idPlaceholder':   'sheets:SPREADSHEET_ID:Sheet1!A:D',
    'sheets.formatHint':      'Format:',
    'sheets.outLabel':        'Output sheet (optional)',
    'sheets.outPlaceholder':  '= same as input',
    'field.target':           'AI service',
    'opt.skipDone':           'Skip done rows',
    'opt.headless':           'Headless mode',
    'opt.json':               '💻 Force JSON (auto-expand to columns)',
    'hint.json':              'Enable this and the AI will return JSON (e.g. <code>{"Name":"Jan","Age":30}</code>). The tool will automatically split it into separate columns in your file.',
    'field.sysPrompt':        'Additional instructions / Context',
    'field.sysPromptPlaceholder': 'E.g. Translate to English and format concisely... (optional)',
    'field.limit':            'Row limit (0 = unlimited)',
    'schedule.title':         '🕒 Schedule & time limits',
    'schedule.start':         'Start hour (0-23)',
    'schedule.end':           'End hour (0-23)',
    'schedule.days':          'Working days (1=Mon, 2=Tue … 6=Sat, 0=Sun)',
    'schedule.pauseMin':      'Min pause (seconds)',
    'schedule.pauseMax':      'Max pause (seconds)',
    'btn.run':                '▶ Run',
    'btn.stop':               '⏹ Stop',
    'terminal.empty':         'No active task...',
    'progress.text':          'Processing...',
    'batch.running':          '⚙️ Running...',
    'done.ok':                '✅ Done! {done} / {total} queries.',
    'done.err':               '❌ Finished with error (code {code}).',
    'done.label.ok':          '✅ Done',
    'done.label.err':         '❌ Error',
    'err.noFile':             'Please select an Excel file.',
    'err.noSheets':           'Enter a Google Sheets reference.',
    'err.startFail':          'Start error: ',
    'err.connect':            'Connection error: ',
    'err.format':             'Unsupported format. Use .xlsx or .xls',
    'stop.user':              'Stopped by user.',
    'link.template':          '⬇ Download Excel template',
    'btn.pause':              '⏸ Pause',
    'btn.resume':             '▶ Resume',
    'opt.exportCsv':          '📄 Export CSV',
    'opt.exportJson':         '📋 Export JSON',
    'hint.export':            'Creates additional CSV/JSON files next to your Excel file — ready to open in other programs.',
    'ab.label':               'Compare with other A/B services (optional)',
    'ab.placeholder':         'e.g. deepseek,mistral',
    'ab.hint':                'Results from each service will be written to separate columns in the file.',
    // Preview & strip markdown
    'opt.preview':            'Preview mode — 3 rows only',
    'hint.preview':           'Processes only the first 3 rows. Check results before running the full file.',
    'opt.stripMarkdown':      'Remove Markdown formatting',
    'hint.stripMarkdown':     'Strips **bold**, ## headings, `code` and other Markdown markers from responses — returns plain text.',
    'btn.resetConfig':        '↩ Reset to defaults',
    'config.saved':           'Settings saved',
    // Steps
    'step.source':            'Choose file or spreadsheet',
    'step.ai':                'Choose AI service',
    'step.instructions':      'AI instructions (optional)',
    'step.advanced':          '⚙️ Advanced options',
    // Advanced sub-labels
    'adv.behavior':           'Behavior',
    'adv.format':             'Response format',
    'adv.export':             'Additional export',
    'adv.limit':              'Row limit',
    'adv.schedule':           'Schedule & delays',
    // Updated option labels
    'opt.headless':           'Hidden browser',
    'opt.skipDone':           'Skip completed',
    'opt.json':               'Expand JSON to columns',
    // Hints for toggles
    'hint.skipDone':          'Skips rows with status "done". Useful for resuming an interrupted task.',
    'hint.headless':          'Browser runs in background without a visible window. Recommended after first login.',
    'hint.exportCsv':         'Creates a .csv file next to your Excel file — opens in any spreadsheet app.',
    'hint.exportJson':        'Creates a .json file next to your Excel file — for integration with other apps.',
    'hint.limit':             '0 = process all rows',
    'hint.templateVars':      '💡 Variables: <code>{{A}}</code> = col. A, <code>{{B}}</code> = col. B, <code>{{C}}</code> = col. C',
    // Schedule
    'schedule.start':         'Work from hour',
    'schedule.end':           'Until hour',
    'schedule.pauseMin':      'Min. delay (sec)',
    'schedule.pauseMax':      'Max. delay (sec)',
    // Mode tabs
    'mode.run':               '📋 Run task',
    'mode.generator':         '🧠 Task Generator',
    // Generator
    'gen.title':              '🧠 Task Generator',
    'gen.desc':               'Describe what you want to achieve — AI will prepare a ready-made list of prompts tailored to your chosen service. You can review the result before running.',
    'gen.intentLabel':        'Your intent',
    'gen.intentPlaceholder':  'E.g. Find companies that manufacture pencils in the 20 largest cities in Poland. Return company name, NIP, address and phone.',
    'gen.targetLabel':        'Target (where prompts will run)',
    'gen.providerLabel':      'Model for generating prompts',
    'gen.modelLabel':         'Model (optional)',
    'gen.modelHint':          'Leave empty to use the default model from settings.',
    'gen.btnGenerate':        'Generate prompts',
    'gen.previewEmpty':       'Generated prompts will appear here.',
    'gen.previewCount':       '{n} prompts generated',
    'gen.btnDownload':        '⬇ Download Excel',
    'gen.btnRun':             '▶ Run task',
    'gen.colPrompt':          'Prompt',
    'gen.generating':         'Generating prompts…',
    'gen.noKey':              'No API key. Set it in ⚙️ Settings.',
    'gen.noIntent':           'Enter your intent before generating.',
    // Settings AI API section
    'settings.section.aiapi': 'Direct API (Task Generator)',
    'settings.aiapiHint':     'Required for the Task Generator tab and the gemini-api / openrouter targets.',
    'settings.geminiKey':     'Gemini API Key',
    'settings.geminiModel':   'Default Gemini API model',
    'settings.openRouterKey': 'OpenRouter API Key',
    'settings.openRouterModel':'Default OpenRouter model',
    'settings.internetWarning': 'Not all models have internet access. Models without web search rely solely on training data — results may be outdated or imprecise. Check the model documentation before using it to search for current data.',
    'gen.internetNotice':     '⚠️ Generating prompts does not require internet access — it is a standard LLM task. However, the selected target may not have access to current data if it is not a search engine.',
    // Settings modal
    'settings.title':         '⚙️ Settings',
    'settings.section.limits':'Limits',
    'settings.dailyLimit':    'Max queries per day',
    'settings.maxChars':      'Max response length (0 = unlimited)',
    'settings.section.pauses':'Pauses between queries',
    'settings.pauseMin':      'Minimum (seconds)',
    'settings.pauseMax':      'Maximum (seconds)',
    'settings.section.night': 'Night quiet hours',
    'settings.nightHint':     'No queries are sent during night quiet hours.',
    'settings.nightStart':    'From hour',
    'settings.nightEnd':      'Until hour',
    'settings.section.retry': 'Retry on error',
    'settings.retryCount':    'Number of retries',
    'settings.retryDelay':    'Delay between retries (seconds)',
    'settings.section.browser':'Browser & format',
    'settings.headless':      'Headless mode (browser runs invisibly in background)',
    'settings.stripMd':       'Strip Markdown formatting from responses',
    'settings.section.google':'Google API',
    'settings.optional':      '(optional)',
    'settings.googleHint':    'Required only for google-api target and Google Sheets.',
    'settings.googleKey':     'Google API Key',
    'settings.googleCse':     'Google CSE ID (Search Engine ID)',
    'settings.serviceAccount':'Service Account JSON (Google Sheets)',
    'settings.cancel':        'Cancel',
    'settings.save':          'Save settings',
    'settings.saved':         '✓ Saved',
    'settings.error':         '✗ Save failed',
  }
};

/* ── Language management ────────────────────────────────────────── */

let currentLang = localStorage.getItem('lang') || 'pl';

function t(key, vars) {
  let str = (TRANSLATIONS[currentLang] || TRANSLATIONS['pl'])[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace('{' + k + '}', v);
    }
  }
  return str;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = currentLang;
  document.getElementById('langBtn').textContent = currentLang === 'pl' ? 'EN' : 'PL';
  updateTargetHint();
}

function toggleLang() {
  currentLang = currentLang === 'pl' ? 'en' : 'pl';
  localStorage.setItem('lang', currentLang);
  applyTranslations();
}

/* ── Target hints ──────────────────────────────────────────────── */

const TARGET_HINTS = {
  pl: {
    gemini:      '✅ Wymaga konta Google. Przy pierwszym uruchomieniu zaloguj się ręcznie w oknie przeglądarki.',
    perplexity:  '✅ Działa bez konta. Przy pierwszym użyciu może poprosić o logowanie — możesz je pominąć.',
    claude:      '✅ Wymaga konta Anthropic (claude.ai). Zaloguj się raz przy wyłączonym trybie Headless.',
    google:      '✅ Działa bez konta. Pobiera fragmenty z wyników wyszukiwania (nie pełne odpowiedzi AI).',
    copilot:     '✅ Działa bez konta (~20 zapytań/sesję) lub z kontem Microsoft (więcej zapytań).\n💡 Przy pierwszym uruchomieniu zaloguj się ręcznie przy wyłączonym trybie Headless.',
    mistral:     '✅ Wymaga konta Mistral (darmowe na mistral.ai). Europejski model AI, GDPR-friendly.\n💡 Mniejsze ryzyko blokady automatyzacji niż u OpenAI.',
    deepseek:    '✅ Wymaga konta DeepSeek (darmowe na chat.deepseek.com). Dobry do analizy i kodu.\n⚠️ Serwer może być wolny w godzinach szczytu — zalecana przerwa ≥ 8s.',
    duckduckgo:  '⚡ Bez klucza. Pobiera top 5 wyników DuckDuckGo bez uruchamiania przeglądarki.\n⚠️ Może nie działać na środowiskach serwerowych/VPN (bot detection). Na domowym łączu zwykle działa.\n💡 Zalecana przerwa ≥ 10s między zapytaniami.',
    'google-api':'🔑 Wymaga klucza API (bezpłatny). Skonfiguruj GOOGLE_API_KEY i GOOGLE_CSE_ID w pliku .env.\n📖 Instrukcja: console.cloud.google.com → Custom Search JSON API + programmablesearchengine.google.com\n📊 Limit: 100 zapytań/dzień gratis. Niezawodny, wyniki Google.',
  },
  en: {
    gemini:      '✅ Requires a Google account. On first run, log in manually in the browser window.',
    perplexity:  '✅ Works without an account. May ask for login on first use — you can skip it.',
    claude:      '✅ Requires an Anthropic account (claude.ai). Log in once with Headless mode off.',
    google:      '✅ No account required. Fetches snippets from search results (not full AI answers).',
    copilot:     '✅ Works without an account (~20 queries/session) or with a Microsoft account (more queries).\n💡 On first run, log in manually with Headless mode off.',
    mistral:     '✅ Requires a Mistral account (free at mistral.ai). European AI, GDPR-friendly.\n💡 Lower risk of bot detection than OpenAI.',
    deepseek:    '✅ Requires a DeepSeek account (free at chat.deepseek.com). Great for analysis and code.\n⚠️ Server may be slow during peak hours — recommended pause ≥ 8s.',
    duckduckgo:  '⚡ No API key. Fetches top 5 DuckDuckGo results without a browser.\n⚠️ May not work on server/VPN environments (bot detection). Usually works on home networks.\n💡 Recommended pause ≥ 10s between queries.',
    'google-api':'🔑 Requires API key (free tier). Set GOOGLE_API_KEY and GOOGLE_CSE_ID in your .env file.\n📖 Setup: console.cloud.google.com → Custom Search JSON API + programmablesearchengine.google.com\n📊 Limit: 100 free queries/day. Reliable, real Google results.',
  },
};

function updateTargetHint() {
  const target = document.getElementById('target').value;
  const hints  = TARGET_HINTS[currentLang] || TARGET_HINTS['pl'];
  const hint   = hints[target] || '';
  const el     = document.getElementById('targetHint');
  el.style.display    = hint ? 'block' : 'none';
  el.style.whiteSpace = 'pre-line';
  el.textContent      = hint;
}

/* ── State ─────────────────────────────────────────────────────── */
let activeTab    = 'excel';
let selectedFile = null;
let eventSource  = null;
let batchRunning = false;
let isPaused     = false;
let doneCount = 0, totalCount = 0;

/* ── Tab switch ────────────────────────────────────────────────── */
function switchTab(tab) {
  activeTab = tab;
  document.getElementById('paneExcel').classList.toggle('active', tab === 'excel');
  document.getElementById('paneSheets').classList.toggle('active', tab === 'sheets');
  document.getElementById('tabA').classList.toggle('active', tab === 'excel');
  document.getElementById('tabB').classList.toggle('active', tab === 'sheets');
}

/* ── File handling ─────────────────────────────────────────────── */
function onFileChange(input) {
  setFile(input.files[0]);
}
function onDrop(ev) {
  ev.preventDefault();
  document.getElementById('dropzone').classList.remove('over');
  const f = ev.dataTransfer.files[0];
  if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) setFile(f);
  else logLine(t('err.format'), 'err');
}
function setFile(f) {
  selectedFile = f;
  document.getElementById('fileName').textContent = '✓ ' + f.name;
  document.getElementById('dropzone').querySelector('.dropzone-icon').textContent = '📄';
}

/* ── Status polling ────────────────────────────────────────────── */
async function fetchStatus() {
  try {
    const r = await fetch('/api/status');
    if (!r.ok) return;
    const d = await r.json();

    const dot   = document.getElementById('dot');
    const label = document.getElementById('statusLabel');

    if (d.batchRunning) {
      dot.className = 'dot launching';
      label.textContent = t('status.running');
    } else {
      dot.className = 'dot ready';
      label.textContent = t('status.ready');
    }

    document.getElementById('sTarget').textContent = (d.target || '—').toUpperCase();
    document.getElementById('sState').textContent  = d.batchRunning ? t('state.processing') : t('state.idle');
    document.getElementById('sToday').textContent  = d.queriedToday ?? '—';
    document.getElementById('sNight').textContent  = d.isNightQuiet ? t('night.yes') : t('night.no');

    const pct = d.dailyLimit > 0 ? Math.min(100, Math.round((d.queriedToday / d.dailyLimit) * 100)) : 0;
    document.getElementById('quotaBar').style.width = pct + '%';
    document.getElementById('quotaTxt').textContent = `${d.queriedToday ?? 0} / ${d.dailyLimit ?? '—'}`;
  } catch {
    document.getElementById('dot').className = 'dot error';
    document.getElementById('statusLabel').textContent = t('status.noConnection');
  }
}

/* ── Batch control ─────────────────────────────────────────────── */
async function startBatch() {
  if (batchRunning) return;

  const target   = document.getElementById('target').value;
  const skipDone = document.getElementById('chkSkipDone').checked;
  const headless = document.getElementById('chkHeadless').checked;
  const jsonFmt  = document.getElementById('chkJsonFormat').checked;
  const limit    = parseInt(document.getElementById('limitRows').value) || 0;
  const sysPrmpt = document.getElementById('systemPrompt').value.trim();

  const schStart = document.getElementById('schStart').value;
  const schEnd   = document.getElementById('schEnd').value;
  const schDays  = document.getElementById('schDays').value.trim();
  const pauseMin = document.getElementById('pauseMin').value;
  const pauseMax = document.getElementById('pauseMax').value;

  const body = new FormData();
  body.append('target',     target);
  body.append('skipDone',   skipDone ? '1' : '0');
  body.append('headless',   headless ? '1' : '0');
  body.append('jsonFormat', jsonFmt ? '1' : '0');
  if (sysPrmpt) body.append('systemPrompt', sysPrmpt);
  if (limit > 0) body.append('limit', String(limit));

  if (schStart) body.append('schStart', schStart);
  if (schEnd)   body.append('schEnd', schEnd);
  if (schDays)  body.append('schDays', schDays);
  if (pauseMin) body.append('pauseMin', pauseMin);
  if (pauseMax) body.append('pauseMax', pauseMax);

  const exportCsv      = document.getElementById('chkExportCsv').checked;
  const exportJson     = document.getElementById('chkExportJson').checked;
  const abTargets      = (document.getElementById('abTargets')?.value ?? '').trim();
  const exportFmts     = [exportCsv ? 'csv' : '', exportJson ? 'json' : ''].filter(Boolean).join(',');
  const preview        = document.getElementById('chkPreview')?.checked;
  const stripMarkdown  = document.getElementById('chkStripMarkdown')?.checked;

  if (exportFmts)      body.append('exportFormats', exportFmts);
  if (abTargets)       body.append('targets', target + ',' + abTargets);
  if (preview)         body.append('preview', '1');
  if (stripMarkdown)   body.append('stripMarkdown', '1');

  if (activeTab === 'excel') {
    if (!selectedFile) { logLine(t('err.noFile'), 'warn'); return; }
    body.append('file', selectedFile);
  } else {
    const ref = document.getElementById('sheetsRef').value.trim();
    if (!ref) { logLine(t('err.noSheets'), 'warn'); return; }
    const out = document.getElementById('sheetsOut').value.trim();
    body.append('sheetsRef', ref);
    if (out) body.append('sheetsOut', out);
  }

  clearLog();
  setBatchRunning(true);
  connectSSE();

  try {
    const r = await apiPostForm('/api/run', body);
    if (!r) { setBatchRunning(false); return; }
    if (!r.ok) {
      const e = await r.json().catch(() => ({ error: r.statusText }));
      logLine(t('err.startFail') + e.error, 'err');
      setBatchRunning(false);
    }
  } catch (e) {
    logLine(t('err.connect') + e.message, 'err');
    setBatchRunning(false);
  }
}

async function stopBatch() {
  await apiPost('/api/stop', {});
  logLine(t('stop.user'), 'warn');
  setBatchRunning(false);
}

async function togglePause() {
  const endpoint = isPaused ? '/api/resume' : '/api/pause';
  await apiPost(endpoint, {});
  isPaused = !isPaused;
  const btn = document.getElementById('btnPause');
  btn.textContent = t(isPaused ? 'btn.resume' : 'btn.pause');
  btn.className   = 'btn ' + (isPaused ? 'btn-success' : 'btn-warning');
}

function updateAbMode() {
  const target     = document.getElementById('target').value;
  const noAbTargets = ['google-api', 'duckduckgo'];
  document.getElementById('abModeWrap').style.display = noAbTargets.includes(target) ? 'none' : 'block';
  updateTargetHint();
}

/* ── SSE progress stream ────────────────────────────────────────── */
function connectSSE() {
  if (eventSource) eventSource.close();
  eventSource = new EventSource('/api/progress');

  eventSource.onmessage = (ev) => {
    try {
      const d = JSON.parse(ev.data);
      if (d.type === 'log')  handleLog(d.text, d.level);
      if (d.type === 'prog') handleProgress(d.done, d.total);
      if (d.type === 'done') handleDone(d.code, d.hasFile);
    } catch {}
  };

  eventSource.onerror = () => {
    if (batchRunning) {
      eventSource.close();
      eventSource = null;
    }
  };
}

function handleLog(text, level) {
  const lines = text.split('\n').filter(l => l.trim());
  lines.forEach(l => {
    let cls = '';
    if (l.includes('✓') || l.includes('[OK]') || l.includes('→ ') || l.includes('done')) cls = 'ok';
    else if (level === 'error' || l.includes('ERROR') || l.includes('Error') || l.includes('✗')) cls = 'err';
    else if (l.includes('⚠') || l.includes('WARN') || l.includes('TIMEOUT')) cls = 'warn';
    else if (l.startsWith('[')) cls = 'info';
    logLine(l, cls);
  });
}

function handleProgress(done, total) {
  if (!total) return;
  doneCount = done; totalCount = total;
  document.getElementById('progressWrap').style.display = 'block';
  const pct = Math.round((done / total) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressTxt').textContent = t('progress.text') + ' ' + pct + '%';
  document.getElementById('progressCount').textContent = `${done} / ${total}`;
}

function handleDone(code, hasFile) {
  setBatchRunning(false);
  const msg = code === 0
    ? t('done.ok', { done: doneCount, total: totalCount })
    : t('done.err', { code });
  logLine('\n' + msg, code === 0 ? 'ok' : 'err');
  document.getElementById('batchLabel').textContent = t(code === 0 ? 'done.label.ok' : 'done.label.err');
  if (eventSource) { eventSource.close(); eventSource = null; }

  const btnDl = document.getElementById('btnDownloadResult');
  if (btnDl) btnDl.style.display = hasFile ? '' : 'none';

  // Browser notification — only when tab is in background
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    new Notification('AI Query Runner', { body: msg });
  }
}

/* ── Helpers ───────────────────────────────────────────────────── */
function setBatchRunning(val) {
  batchRunning = val;
  document.getElementById('btnRun').style.display       = val ? 'none'  : 'block';
  const rc = document.getElementById('runControls');
  if (rc) rc.style.display = val ? 'grid' : 'none';
  // keep individual buttons for compat (may be hidden inside runControls)
  const btnP = document.getElementById('btnPause');
  const btnS = document.getElementById('btnStop');
  if (btnP) btnP.style.display = val ? '' : '';
  if (btnS) btnS.style.display = val ? '' : '';
  document.getElementById('batchLabel').textContent = val ? t('batch.running') : '';
  if (val) {
    const btnDl = document.getElementById('btnDownloadResult');
    if (btnDl) btnDl.style.display = 'none';
  }
  if (!val) {
    document.getElementById('progressWrap').style.display = 'none';
    isPaused = false;
    if (btnP) { btnP.textContent = t('btn.pause'); btnP.className = 'btn btn-warning'; }
  }
}

function logLine(text, cls = '') {
  const el = document.getElementById('terminal');
  if (el.querySelector('.dim')) el.innerHTML = '';
  const line = document.createElement('div');
  line.textContent = text;
  if (cls) line.className = cls;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function clearLog() {
  doneCount = 0; totalCount = 0;
  document.getElementById('terminal').innerHTML = '';
  document.getElementById('batchLabel').textContent = '';
}

/* ── Config save / load / reset ────────────────────────────────── */
const CONFIG_KEY = 'aqr-config';
const SAVEABLE = [
  { id: 'target',           type: 'select'   },
  { id: 'systemPrompt',     type: 'textarea' },
  { id: 'chkSkipDone',      type: 'checkbox' },
  { id: 'chkHeadless',      type: 'checkbox' },
  { id: 'chkJsonFormat',    type: 'checkbox' },
  { id: 'chkExportCsv',     type: 'checkbox' },
  { id: 'chkExportJson',    type: 'checkbox' },
  { id: 'chkPreview',       type: 'checkbox' },
  { id: 'chkStripMarkdown', type: 'checkbox' },
  { id: 'limitRows',        type: 'text'     },
  { id: 'schStart',         type: 'text'     },
  { id: 'schEnd',           type: 'text'     },
  { id: 'pauseMin',         type: 'text'     },
  { id: 'pauseMax',         type: 'text'     },
  { id: 'abTargets',        type: 'text'     },
  // schDays is derived from day picker — not saved directly
];

let _debounceTimer = null;
let _labelTimer    = null;

function saveConfig() {
  const cfg = {};
  for (const f of SAVEABLE) {
    const el = document.getElementById(f.id);
    if (!el) continue;
    cfg[f.id] = f.type === 'checkbox' ? el.checked : el.value;
  }
  cfg['_dayPicker'] = Array.from(document.querySelectorAll('#dayPicker .day-btn.active'))
    .map(b => b.dataset.day);
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));

  const lbl = document.getElementById('configSavedLabel');
  if (lbl) {
    lbl.textContent = t('config.saved');
    clearTimeout(_labelTimer);
    _labelTimer = setTimeout(() => { lbl.textContent = ''; }, 2000);
  }
}

function loadConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return;
  try {
    const cfg = JSON.parse(raw);
    for (const f of SAVEABLE) {
      const el = document.getElementById(f.id);
      if (!el || cfg[f.id] === undefined) continue;
      if (f.type === 'checkbox') el.checked = cfg[f.id];
      else el.value = cfg[f.id];
    }
    if (Array.isArray(cfg['_dayPicker'])) {
      document.querySelectorAll('#dayPicker .day-btn').forEach(btn => {
        btn.classList.toggle('active', cfg['_dayPicker'].includes(btn.dataset.day));
      });
      syncDayPicker();
    }
    updateAbMode();
    updateCharCount();
  } catch {}
}

function resetConfig() {
  localStorage.removeItem(CONFIG_KEY);
  location.reload();
}

function autoSave() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(saveConfig, 600);
}

/* ── Day picker ────────────────────────────────────────────────── */
function toggleDay(btn) {
  btn.classList.toggle('active');
  syncDayPicker();
}

function syncDayPicker() {
  const days = Array.from(document.querySelectorAll('#dayPicker .day-btn.active'))
    .map(b => b.dataset.day)
    .filter(Boolean);
  const input = document.getElementById('schDays');
  if (input) input.value = days.join(',');
}

/* ── Char counter ──────────────────────────────────────────────── */
function updateCharCount() {
  const prompt  = document.getElementById('systemPrompt');
  const counter = document.getElementById('charCount');
  if (!prompt || !counter) return;
  const n = prompt.value.length;
  counter.textContent = n > 0 ? n + ' zn.' : '0';
}

/* ── Template variable hint ────────────────────────────────────── */
function initTemplateHints() {
  const prompt = document.getElementById('systemPrompt');
  const hint   = document.getElementById('templateVarHint');
  if (!prompt || !hint) return;
  const check = () => {
    hint.style.display = /\{\{[A-Za-z]\}\}/.test(prompt.value) ? 'block' : 'none';
  };
  prompt.addEventListener('input', check);
  check();
}

/* ── Checkbox highlight ────────────────────────────────────────── */
function initCheckboxHighlight() {
  document.querySelectorAll('.toggle-label').forEach(label => {
    const input = label.querySelector('input[type="checkbox"]');
    if (!input) return;
    const toggle = () => label.classList.toggle('checked', input.checked);
    input.addEventListener('change', toggle);
    toggle();
  });
}

/* ── Copy log ──────────────────────────────────────────────────── */
async function copyLog() {
  const terminal = document.getElementById('terminal');
  const btn      = document.getElementById('btnCopyLog');
  if (!terminal || !btn) return;
  try {
    await navigator.clipboard.writeText(terminal.innerText);
    const orig = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = orig; }, 1800);
  } catch {}
}

/* ── Mode tabs ─────────────────────────────────────────────────── */
function switchMode(mode) {
  const isGen  = mode === 'generator';
  const isHist = mode === 'history';
  const isRun  = mode === 'run';

  document.getElementById('tabRun').classList.toggle('active', isRun);
  document.getElementById('tabGenerator').classList.toggle('active', isGen);
  document.getElementById('tabHistory').classList.toggle('active', isHist);

  // Status card always visible; show/hide run cards vs generator vs history
  document.querySelectorAll('.card:not(.generator-card):not(#historyCard)').forEach(el => {
    el.style.display = (isGen || isHist) ? 'none' : '';
  });
  document.getElementById('generatorCard').style.display = isGen ? '' : 'none';
  document.getElementById('historyCard').style.display   = isHist ? '' : 'none';

  if (isHist) loadHistory();
}

/* ── History ───────────────────────────────────────────────────── */
async function loadHistory() {
  try {
    const r = await fetch('/api/history');
    if (r.status === 401) { window.location.href = '/login'; return; }
    const records = await r.json();

    const empty = document.getElementById('historyEmpty');
    const table = document.getElementById('historyTable');
    const tbody = document.getElementById('historyBody');

    if (!records.length) {
      empty.style.display = ''; table.style.display = 'none'; return;
    }
    empty.style.display = 'none'; table.style.display = '';

    tbody.innerHTML = records.map(rec => {
      const dt   = new Date(rec.timestamp);
      const date = dt.toLocaleDateString('pl-PL') + ' ' + dt.toLocaleTimeString('pl-PL', { hour:'2-digit', minute:'2-digit' });
      const ok   = rec.exitCode === 0;
      const status = rec.stopped
        ? '<span style="color:#fbbf24">⏹ Zatrzymane</span>'
        : rec.exitCode === null
          ? '<span style="color:var(--text-dim)">⏳ w toku</span>'
          : ok
            ? '<span style="color:#4ade80">✓ OK</span>'
            : `<span style="color:#f87171">✗ błąd (${rec.exitCode})</span>`;
      const dlBtn = rec.hasFile
        ? `<a class="btn btn-success" href="/api/download-result/${rec.id}" download style="font-size:.75rem;padding:4px 10px">⬇ xlsx</a>`
        : '<span style="color:var(--text-dim);font-size:.78rem">brak pliku</span>';
      const label = rec.label.length > 40 ? rec.label.slice(0, 38) + '…' : rec.label;
      return `<tr style="border-bottom:1px solid rgba(255,255,255,.05)">
        <td style="padding:8px 10px;white-space:nowrap">${date}</td>
        <td style="padding:8px 10px"><code style="font-size:.8rem">${rec.target}</code></td>
        <td style="padding:8px 10px;color:var(--text-dim)">${_esc(label)}</td>
        <td style="padding:8px 10px;text-align:right">${rec.rows > 0 ? rec.rows : '—'}</td>
        <td style="padding:8px 10px;text-align:center">${status}</td>
        <td style="padding:8px 10px;text-align:center">${dlBtn}</td>
      </tr>`;
    }).join('');
  } catch (e) {
    document.getElementById('historyEmpty').style.display = '';
    document.getElementById('historyEmpty').textContent = 'Błąd ładowania historii: ' + e.message;
  }
}

/* ── Model loading ──────────────────────────────────────────────── */
let _modelCache = {};

async function loadModels(provider) {
  const listId  = provider === 'gemini-api' ? 'geminiModelList' : 'openRouterModelList';
  const inputId = provider === 'gemini-api' ? 'sGeminiModel'    : 'sOpenRouterModel';
  try {
    if (_modelCache[provider]) {
      _populateModelList(listId, inputId, _modelCache[provider]);
      return;
    }
    const r = await fetch(`/api/models?provider=${provider}`);
    if (!r.ok) { const e = await r.json(); alert(e.error || 'Błąd pobierania modeli'); return; }
    const { models } = await r.json();
    _modelCache[provider] = models;
    _populateModelList(listId, inputId, models);
  } catch { alert('Nie można pobrać listy modeli.'); }
}

function _populateModelList(listId, inputId, models) {
  const dl = document.getElementById(listId);
  dl.innerHTML = models.map(m => `<option value="${m.id}" label="${m.name}"></option>`).join('');
  const input = document.getElementById(inputId);
  if (input && !input.value) input.placeholder = `${models.length} modeli dostępnych`;
}

async function loadModelsForGenerator() {
  const provider = document.getElementById('genProvider').value;
  try {
    if (_modelCache[provider]) { _populateGenModelList(_modelCache[provider]); return; }
    const r = await fetch(`/api/models?provider=${provider}`);
    if (!r.ok) { const e = await r.json(); alert(e.error || 'Błąd'); return; }
    const { models } = await r.json();
    _modelCache[provider] = models;
    _populateGenModelList(models);
  } catch { alert('Nie można pobrać listy modeli.'); }
}

function _populateGenModelList(models) {
  const sel = document.getElementById('genModelSelect');
  if (!sel) return;
  // Keep first "— domyślny —" option + rebuild the rest
  const custom = sel.querySelector('option[value="_custom"]');
  sel.innerHTML = '<option value="">— domyślny —</option>';
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name || m.id;
    sel.appendChild(opt);
  });
  if (!custom) {
    const opt = document.createElement('option');
    opt.value = '_custom';
    opt.textContent = 'Inny (wpisz ręcznie)…';
    sel.appendChild(opt);
  } else {
    sel.appendChild(custom);
  }
}

function onGenModelSelectChange(sel) {
  const customInput = document.getElementById('genModelCustom');
  customInput.style.display = sel.value === '_custom' ? '' : 'none';
}

function _getGenModel() {
  const sel = document.getElementById('genModelSelect');
  if (!sel) return undefined;
  if (sel.value === '_custom') {
    const v = document.getElementById('genModelCustom').value.trim();
    return v || undefined;
  }
  return sel.value || undefined;
}

function onGenProviderChange() {
  const provider = document.getElementById('genProvider').value;
  const sel = document.getElementById('genModelSelect');
  // Reset to default options
  sel.innerHTML = '<option value="">— domyślny —</option><option value="_custom">Inny (wpisz ręcznie)…</option>';
  document.getElementById('genModelCustom').style.display = 'none';

  // Pre-fill known defaults as the first option
  const defaults = {
    'gemini-api': 'gemini-2.0-flash',
    'openrouter': 'google/gemini-2.0-flash-exp:free',
    'groq':       'llama-3.3-70b-versatile',
    'xai':        'grok-3-mini',
    'ollama':     document.getElementById('sOllamaModel')?.value || 'qwen2.5:7b',
    'custom':     document.getElementById('sCustomEndpointModel')?.value || 'gpt-4o-mini',
  };
  if (defaults[provider]) {
    const opt = document.createElement('option');
    opt.value = defaults[provider];
    opt.textContent = defaults[provider] + ' (domyślny)';
    sel.insertBefore(opt, sel.children[1]);
  }
}

async function loadOllamaModels() {
  const urlInput = document.getElementById('sOllamaUrl');
  const ollamaUrl = urlInput?.value.trim() || 'http://localhost:11434';
  const chipsDiv = document.getElementById('ollamaModelChips');
  if (!chipsDiv) return;
  chipsDiv.innerHTML = '<span style="opacity:.6">Ładowanie…</span>';
  try {
    const r = await fetch(`/api/models?provider=ollama&ollamaUrl=${encodeURIComponent(ollamaUrl)}`);
    if (!r.ok) throw new Error((await r.json()).error || 'Błąd');
    const { models } = await r.json();
    if (!models.length) { chipsDiv.innerHTML = '<span style="opacity:.6">Brak modeli</span>'; return; }
    chipsDiv.innerHTML = models.map(m =>
      `<button type="button" class="chip" onclick="document.getElementById('sOllamaModel').value='${m.id}'">${m.name}</button>`
    ).join('');
  } catch (e) {
    chipsDiv.innerHTML = `<span style="color:var(--red,#e74c3c)">${e.message}</span>`;
  }
}

/* ── Task Generator ─────────────────────────────────────────────── */
let _generatedPrompts = [];

async function runGenerator() {
  const intent       = document.getElementById('genIntent').value.trim();
  const target       = document.getElementById('genTarget').value;
  const provider     = document.getElementById('genProvider').value;
  const model        = _getGenModel();
  const outputFormat = document.getElementById('genOutputFormat')?.value || 'auto';

  if (!intent) { alert(t('gen.noIntent')); return; }

  document.getElementById('genSpinner').style.display = '';
  document.getElementById('genError').style.display = 'none';
  document.getElementById('genPreviewContent').style.display = 'none';
  document.getElementById('genPreviewEmpty').style.display = 'none';
  document.getElementById('btnGenerate').disabled = true;

  try {
    const r = await apiPost('/api/generate', { intent, target, provider, model, outputFormat });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Błąd generowania');
    _generatedPrompts = data.prompts;
    _showGeneratorPreview(data.prompts);
  } catch (e) {
    document.getElementById('genError').textContent = e.message;
    document.getElementById('genError').style.display = '';
    document.getElementById('genPreviewEmpty').style.display = '';
  } finally {
    document.getElementById('genSpinner').style.display = 'none';
    document.getElementById('btnGenerate').disabled = false;
  }
}

function _showGeneratorPreview(prompts) {
  const count = t('gen.previewCount').replace('{n}', prompts.length);
  document.getElementById('genPreviewCount').textContent = count;
  const tbody = document.getElementById('genPreviewBody');
  tbody.innerHTML = prompts.map(p =>
    `<tr><td class="gen-col-id">${p.id}</td><td contenteditable="true" class="gen-col-prompt" data-id="${p.id}">${_esc(p.prompt)}</td></tr>`
  ).join('');
  // Sync edits back to _generatedPrompts
  tbody.querySelectorAll('[contenteditable]').forEach(cell => {
    cell.addEventListener('input', () => {
      const id = cell.dataset.id;
      const item = _generatedPrompts.find(p => p.id === id);
      if (item) item.prompt = cell.textContent ?? '';
    });
  });
  document.getElementById('genPreviewContent').style.display = '';
  document.getElementById('genPreviewEmpty').style.display = 'none';
}

function _esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function downloadGeneratedExcel() {
  if (!_generatedPrompts.length) return;
  const r = await apiPost('/api/generate-excel', { prompts: _generatedPrompts });
  if (!r.ok) { alert('Błąd generowania pliku.'); return; }
  const blob = await r.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'generated-tasks.xlsx'; a.click();
  URL.revokeObjectURL(url);
}

async function runGeneratedTask() {
  if (!_generatedPrompts.length) return;

  const target = document.getElementById('genTarget').value;

  // 1. Pobierz Excel jako blob z serwera
  let excelBlob;
  try {
    const r = await apiPost('/api/generate-excel', { prompts: _generatedPrompts });
    if (!r || !r.ok) throw new Error('Błąd generowania pliku Excel');
    excelBlob = await r.blob();
  } catch (e) {
    alert('Błąd: ' + e.message);
    return;
  }

  // 2. Przełącz widok na zakładkę uruchamiania
  switchMode('run');
  clearLog();
  logLine('[Generator] Uruchamiam ' + _generatedPrompts.length + ' promptów → target: ' + target + '…', 'info');

  // 3. Wyślij plik bezpośrednio do /api/run (tak jak startBatch)
  const body = new FormData();
  body.append('target',     target);
  body.append('skipDone',   '0');
  body.append('headless',   document.getElementById('chkHeadless')?.checked ? '1' : '0');
  body.append('jsonFormat', '0');
  body.append('file', excelBlob, 'generated-tasks.xlsx');

  setBatchRunning(true);
  connectSSE();

  try {
    const r = await apiPostForm('/api/run', body);
    if (!r) { setBatchRunning(false); return; }
    if (!r.ok) {
      const e = await r.json().catch(() => ({ error: r.statusText }));
      logLine('Błąd startu: ' + (e.error || r.statusText), 'err');
      setBatchRunning(false);
    }
  } catch (e) {
    logLine('Błąd połączenia: ' + e.message, 'err');
    setBatchRunning(false);
  }
}

/* ── Settings tabs ─────────────────────────────────────────────── */
function switchSettingsTab(name) {
  document.querySelectorAll('.stab').forEach(b => b.classList.toggle('active', b.dataset.stab === name));
  document.querySelectorAll('.stab-pane').forEach(p => p.classList.toggle('active', p.dataset.stab === name));
}

/* ── Settings modal ────────────────────────────────────────────── */
async function openSettings() {
  switchSettingsTab('api');
  try {
    const r = await fetch('/api/settings');
    if (r.status === 401) { window.location.href = '/login'; return; }
    const s = await r.json();
    document.getElementById('sDailyLimit').value  = s.dailyQueryLimit ?? 150;
    document.getElementById('sMaxChars').value    = s.maxResponseChars ?? 0;
    document.getElementById('sPauseMin').value    = Math.round((s.pauseMinMs ?? 5000) / 1000);
    document.getElementById('sPauseMax').value    = Math.round((s.pauseMaxMs ?? 15000) / 1000);
    document.getElementById('sNightStart').value  = s.nightQuietStart ?? 23;
    document.getElementById('sNightEnd').value    = s.nightQuietEnd ?? 7;
    document.getElementById('sRetryCount').value  = s.retryCount ?? 2;
    document.getElementById('sRetryDelay').value  = Math.round((s.retryDelayMs ?? 30000) / 1000);
    document.getElementById('sHeadless').checked  = !!s.headless;
    document.getElementById('sStripMd').checked   = !!s.stripMarkdown;
    // Keys shown masked — user must retype to change
    document.getElementById('sGoogleKey').value         = s.googleApiKey ?? '';
    document.getElementById('sGoogleCse').value         = s.googleCseId ?? '';
    document.getElementById('sServiceAccount').value    = s.googleServiceAccountJson ?? '';
    document.getElementById('sGeminiKey').value         = s.geminiApiKey ?? '';
    document.getElementById('sGeminiModel').value       = s.geminiApiModel ?? '';
    document.getElementById('sOpenRouterKey').value     = s.openRouterApiKey ?? '';
    document.getElementById('sOpenRouterModel').value   = s.openRouterModel ?? '';
    // Ollama
    document.getElementById('sOllamaUrl').value   = s.ollamaUrl   ?? 'http://localhost:11434';
    document.getElementById('sOllamaModel').value = s.ollamaModel ?? '';
    // Custom endpoint
    document.getElementById('sCustomEndpointUrl').value   = s.customEndpointUrl   ?? '';
    document.getElementById('sCustomEndpointKey').value   = s.customEndpointKey   ?? '';
    document.getElementById('sCustomEndpointModel').value = s.customEndpointModel ?? '';
    // Groq
    document.getElementById('sGroqKey').value   = s.groqApiKey ?? '';
    document.getElementById('sGroqModel').value = s.groqModel  ?? '';
    // xAI
    document.getElementById('sXaiKey').value   = s.xaiApiKey ?? '';
    document.getElementById('sXaiModel').value = s.xaiModel  ?? '';
    // DB
    document.getElementById('sDbType').value  = s.dbType  ?? '';
    document.getElementById('sDbUrl').value   = s.dbUrl   ?? '';
    document.getElementById('sDbTable').value = s.dbTable ?? '';
    // Security: 2FA status
    loadTotpStatus(!!s.totpEnabled);
    // Reset password fields
    ['sCurrentPw','sNewPw','sNewPw2'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('pwChangeMsg').textContent  = '';
    document.getElementById('totpMsg').textContent      = '';
  } catch {}
  document.getElementById('settingsSavedLabel').textContent = '';
  document.getElementById('settingsOverlay').style.display = 'flex';
  applyTranslations();
}

function closeSettings(e) {
  if (e && e.target !== document.getElementById('settingsOverlay')) return;
  document.getElementById('settingsOverlay').style.display = 'none';
}

async function saveSettingsForm() {
  const lbl = document.getElementById('settingsSavedLabel');
  try {
    const payload = {
      dailyQueryLimit:  parseInt(document.getElementById('sDailyLimit').value) || 150,
      maxResponseChars: parseInt(document.getElementById('sMaxChars').value) || 0,
      pauseMinMs:       (parseInt(document.getElementById('sPauseMin').value) || 5) * 1000,
      pauseMaxMs:       (parseInt(document.getElementById('sPauseMax').value) || 15) * 1000,
      nightQuietStart:  parseInt(document.getElementById('sNightStart').value) || 23,
      nightQuietEnd:    parseInt(document.getElementById('sNightEnd').value) || 7,
      retryCount:       parseInt(document.getElementById('sRetryCount').value) || 2,
      retryDelayMs:     (parseInt(document.getElementById('sRetryDelay').value) || 30) * 1000,
      headless:         document.getElementById('sHeadless').checked,
      stripMarkdown:    document.getElementById('sStripMd').checked,
      googleApiKey:     document.getElementById('sGoogleKey').value.trim(),
      googleCseId:      document.getElementById('sGoogleCse').value.trim(),
      googleServiceAccountJson: document.getElementById('sServiceAccount').value.trim(),
      geminiApiKey:     document.getElementById('sGeminiKey').value.trim(),
      geminiApiModel:   document.getElementById('sGeminiModel').value.trim(),
      openRouterApiKey: document.getElementById('sOpenRouterKey').value.trim(),
      openRouterModel:  document.getElementById('sOpenRouterModel').value.trim(),
      ollamaUrl:           document.getElementById('sOllamaUrl').value.trim(),
      ollamaModel:         document.getElementById('sOllamaModel').value.trim(),
      customEndpointUrl:   document.getElementById('sCustomEndpointUrl').value.trim(),
      customEndpointKey:   document.getElementById('sCustomEndpointKey').value.trim(),
      customEndpointModel: document.getElementById('sCustomEndpointModel').value.trim(),
      groqApiKey:          document.getElementById('sGroqKey').value.trim(),
      groqModel:           document.getElementById('sGroqModel').value.trim(),
      xaiApiKey:           document.getElementById('sXaiKey').value.trim(),
      xaiModel:            document.getElementById('sXaiModel').value.trim(),
      dbType:           document.getElementById('sDbType').value,
      dbUrl:            document.getElementById('sDbUrl').value.trim(),
      dbTable:          document.getElementById('sDbTable').value.trim(),
    };
    const r = await apiPost('/api/settings', payload);
    if (!r.ok) throw new Error();
    lbl.textContent = t('settings.saved');
    lbl.style.color = 'var(--green, #2ecc71)';
    setTimeout(() => { lbl.textContent = ''; }, 2500);
  } catch {
    lbl.textContent = t('settings.error');
    lbl.style.color = 'var(--red, #e74c3c)';
  }
}

function toggleReveal(inputId, btn) {
  const el = document.getElementById(inputId);
  if (el.type === 'password') { el.type = 'text'; btn.textContent = '🙈'; }
  else                         { el.type = 'password'; btn.textContent = '👁'; }
}

/* ── Auth helpers ──────────────────────────────────────────────── */
let _csrfToken = null;

async function initCsrf() {
  try {
    const r = await fetch('/auth/csrf-token');
    if (r.status === 401) { window.location.href = '/login'; return; }
    const d = await r.json();
    _csrfToken = d.token;
  } catch {}
}

// Authenticated POST — adds CSRF token, redirects to /login on 401
async function apiPost(url, bodyObj) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': _csrfToken || '' },
    body: JSON.stringify(bodyObj),
  });
  if (r.status === 401) { window.location.href = '/login'; return null; }
  return r;
}

// Authenticated POST with FormData (file upload)
async function apiPostForm(url, formData) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'X-CSRF-Token': _csrfToken || '' },
    body: formData,
  });
  if (r.status === 401) { window.location.href = '/login'; return null; }
  return r;
}

async function logout() {
  await apiPost('/auth/logout', {});
  window.location.href = '/login';
}

/* ── Change password ───────────────────────────────────────────── */
async function changePassword() {
  const msg   = document.getElementById('pwChangeMsg');
  const cur   = document.getElementById('sCurrentPw').value;
  const nw    = document.getElementById('sNewPw').value;
  const nw2   = document.getElementById('sNewPw2').value;
  if (!cur || !nw) { msg.style.color = '#f87171'; msg.textContent = 'Wypełnij wszystkie pola.'; return; }
  if (nw !== nw2)  { msg.style.color = '#f87171'; msg.textContent = 'Nowe hasła nie są zgodne.'; return; }
  if (nw.length < 8) { msg.style.color = '#f87171'; msg.textContent = 'Hasło musi mieć min. 8 znaków.'; return; }
  const r = await apiPost('/auth/change-password', { currentPassword: cur, newPassword: nw });
  if (!r) return;
  if (r.ok) {
    msg.style.color = '#34d399'; msg.textContent = '✅ Hasło zmienione.';
    document.getElementById('sCurrentPw').value = '';
    document.getElementById('sNewPw').value = '';
    document.getElementById('sNewPw2').value = '';
  } else {
    const e = await r.json().catch(() => ({}));
    msg.style.color = '#f87171'; msg.textContent = e.error || 'Błąd zmiany hasła.';
  }
}

/* ── 2FA settings ──────────────────────────────────────────────── */
let _totpSetupSecret = null;

async function loadTotpStatus(totpEnabled) {
  const statusEl   = document.getElementById('totp2faStatus');
  const btnEnable  = document.getElementById('btnEnableTotp');
  const btnDisable = document.getElementById('btnDisableTotp');
  if (totpEnabled) {
    statusEl.innerHTML   = '🔐 <strong>2FA jest aktywne</strong> — logujesz się hasłem + kodem z aplikacji.';
    statusEl.style.color = '#34d399';
    btnEnable.style.display  = 'none';
    btnDisable.style.display = 'block';
  } else {
    statusEl.innerHTML   = '⚠️ 2FA jest wyłączone.';
    statusEl.style.color = '#f59e0b';
    btnEnable.style.display  = 'block';
    btnDisable.style.display = 'none';
  }
}

async function beginTotpSetup() {
  const r    = await fetch('/auth/totp-setup');
  const data = await r.json();
  _totpSetupSecret = data.secret;
  document.getElementById('settingsTotpQr').src     = data.qrCode;
  document.getElementById('settingsTotpSecret').textContent = data.secret;
  document.getElementById('totp2faSetup').style.display = 'block';
  document.getElementById('totp2faBtns').style.display  = 'none';
}

function cancelTotpSetup() {
  _totpSetupSecret = null;
  document.getElementById('totp2faSetup').style.display = 'none';
  document.getElementById('totp2faBtns').style.display  = 'block';
}

async function confirmEnableTotp() {
  const code = document.getElementById('settingsTotpCode').value;
  const msg  = document.getElementById('totpMsg');
  if (code.length !== 6) { msg.style.color = '#f87171'; msg.textContent = 'Wpisz 6-cyfrowy kod.'; return; }
  const r = await fetch('/auth/totp-enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: _totpSetupSecret, code }),
  });
  if (r.ok) {
    msg.style.color = '#34d399'; msg.textContent = '✅ 2FA aktywowane!';
    cancelTotpSetup();
    loadTotpStatus(true);
  } else {
    const e = await r.json().catch(() => ({}));
    msg.style.color = '#f87171'; msg.textContent = e.error || 'Nieprawidłowy kod.';
  }
}

async function disableTotp2fa() {
  const pw  = prompt('Podaj hasło, żeby wyłączyć 2FA:');
  if (!pw) return;
  const msg = document.getElementById('totpMsg');
  const r   = await apiPost('/auth/totp-disable', { password: pw });
  if (!r) return;
  if (r.ok) {
    msg.style.color = '#34d399'; msg.textContent = '2FA wyłączone.';
    loadTotpStatus(false);
  } else {
    const e = await r.json().catch(() => ({}));
    msg.style.color = '#f87171'; msg.textContent = e.error || 'Błąd.';
  }
}

/* ── Init ──────────────────────────────────────────────────────── */
initCsrf();
applyTranslations();
loadConfig();
updateAbMode();
updateTargetHint();
syncDayPicker();
initTemplateHints();
initCheckboxHighlight();
updateCharCount();

// Auto-save on any form change
document.querySelectorAll('select, textarea, input[type=text], input[type=number], input[type=checkbox]')
  .forEach(el => el.addEventListener('change', autoSave));
document.getElementById('systemPrompt')?.addEventListener('input', () => {
  updateCharCount();
  autoSave();
});

// Request notification permission once (only shows browser prompt if 'default')
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

fetchStatus();
setInterval(fetchStatus, 3000);
