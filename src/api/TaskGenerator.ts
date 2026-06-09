import { queryGeminiApi }        from './GeminiApiTarget.js';
import { queryOpenRouter }        from './OpenRouterTarget.js';
import { queryOllama }            from './OllamaTarget.js';
import { queryCustomEndpoint }    from './CustomEndpointTarget.js';
import { queryGroq }              from './GroqTarget.js';
import { queryXAI }               from './XAITarget.js';

export interface GeneratedPrompt {
  id: string;
  prompt: string;
}

export type GeneratorProvider = 'gemini-api' | 'openrouter' | 'ollama' | 'custom' | 'groq' | 'xai';

const POLAND_CITIES = [
  'Warszawa','Kraków','Wrocław','Poznań','Gdańsk','Łódź','Szczecin','Lublin','Katowice',
  'Bydgoszcz','Białystok','Gdynia','Częstochowa','Radom','Rzeszów','Toruń','Sosnowiec',
  'Kielce','Gliwice','Olsztyn','Zabrze','Bielsko-Biała','Bytom','Zielona Góra','Rybnik',
  'Ruda Śląska','Tychy','Opole','Gorzów Wielkopolski','Płock','Elbląg','Wałbrzych',
  'Włocławek','Tarnów','Chorzów','Koszalin','Legnica','Kalisz','Grudziądz','Jaworzno',
  'Słupsk','Jastrzębie-Zdrój','Nowy Sącz','Jelenia Góra','Konin','Siedlce','Piotrków Trybunalski',
  'Inowrocław','Lubin','Ostrów Wielkopolski','Suwałki','Zamość','Przemyśl','Ostrowiec Świętokrzyski',
];

const POLAND_VOIVODESHIPS = [
  'dolnośląskie','kujawsko-pomorskie','lubelskie','lubuskie','łódzkie','małopolskie',
  'mazowieckie','opolskie','podkarpackie','podlaskie','pomorskie','śląskie',
  'świętokrzyskie','warmińsko-mazurskie','wielkopolskie','zachodniopomorskie',
];

const EU_COUNTRIES_PL = [
  'Niemcy','Francja','Włochy','Hiszpania','Holandia','Belgia','Szwecja','Dania','Norwegia',
  'Finlandia','Austria','Szwajcaria','Czechy','Słowacja','Węgry','Rumunia','Bułgaria',
  'Chorwacja','Słowenia','Estonia','Łotwa','Litwa','Irlandia','Portugalia','Grecja',
];

function buildFormatInstruction(format: string | undefined, isSearch: boolean): string {
  if (isSearch || !format || format === 'auto') return '';
  switch (format) {
    case 'json':
      // Templates already include JSON instructions — reinforce without duplicating literals
      return '\nKAŻDY prompt musi zawierać dokładną specyfikację pól JSON. Jeśli szablon osi już zawiera "Zwróć JSON", upewnij się że pola są kompletne. NIE powtarzaj tej samej instrukcji formatu dwa razy w jednym prompcie.';
    case 'text':
      return '\nKAŻDY prompt musi kończyć się: "Odpowiedz czystym tekstem lub listą punktowaną. Bez JSON, bez Markdown." Usuń z promptu wszelkie instrukcje Zwróć JSON / Return JSON.';
    case 'table':
      return '\nKAŻDY prompt musi kończyć się: "Zwróć dane jako tabelę Markdown (nagłówki | kolumny)." Usuń z promptu wszelkie instrukcje JSON.';
    case 'csv':
      return '\nKAŻDY prompt musi kończyć się: "Zwróć dane jako CSV: pierwsza linia = nagłówki, kolejne = wartości." Usuń z promptu wszelkie instrukcje JSON.';
    case 'none':
      return '\nNIE dodawaj żadnych instrukcji formatu do promptów. Żadnych "Zwróć JSON", żadnych "Return JSON" — same słowa kluczowe.';
    default:
      return '';
  }
}

function buildSystemPrompt(target: string, outputFormat?: string): string {
  const isSearch = ['google-api', 'duckduckgo', 'bing'].includes(target);

  const targetHints: Record<string, string> = {
    'google-api':  'Krótkie frazy słów kluczowych (3–8 słów) wpisywane w pasek wyszukiwarki. ZERO instrukcji, ZERO pełnych zdań.',
    'duckduckgo':  'Krótkie frazy (3–8 słów). Możesz używać operatorów: site:, "fraza dokładna", -wykluczenie.',
    'bing':        'Krótkie frazy (3–8 słów) lub z operatorami Bing: site:, filetype:, intitle:.',
    'gemini':      'Pełne pytania lub instrukcje dla AI. Określ format wyniku (JSON, lista, tabela).',
    'gemini-api':  'Pełne instrukcje dla API Gemini z dokładnym formatem odpowiedzi. Każdy prompt samodzielny.',
    'perplexity':  'Pełne pytania w języku naturalnym. Perplexity przeszukuje internet na żywo.',
    'claude':      'Szczegółowe instrukcje z formatem i kontekstem.',
    'openrouter':  'Pełne instrukcje z podanym formatem wyniku.',
    'groq':        'Pełne instrukcje lub pytania z określonym formatem odpowiedzi.',
    'xai':         'Pełne pytania lub instrukcje z formatem wyniku.',
  };
  const hint = targetHints[target] ?? (isSearch
    ? 'Krótkie frazy słów kluczowych (3–8 słów). ZERO zdań i instrukcji.'
    : 'Pełne pytania lub instrukcje z określonym formatem odpowiedzi (JSON, lista, tabela).');

  const fmt = isSearch ? 'FRAZA' : 'PROMPT';

  const polishCities = POLAND_CITIES.join(', ');
  const polishVoiv   = POLAND_VOIVODESHIPS.join(', ');
  const euCountries  = EU_COUNTRIES_PL.join(', ');

  // Build axis examples as plain template strings (no JSON-like syntax to avoid model confusion)
  const geoSearchTemplate = isSearch
    ? `Szablon: "[TEMAT] [MIASTO] [słowa kluczowe]" — generuj dla każdego miasta z listy.
     Przykład (software house w Polsce): "software house Warszawa lista", "software house Kraków lista", "software house Wrocław lista" — i tak dla każdego miasta`
    : `Szablon: "Wymień [TEMAT] w [MIASTO]. Podaj: [pola]. Zwróć JSON array." — generuj dla każdego miasta z listy.
     Przykład (software house w Polsce): "Wymień software house w Warszawie. Podaj: name, website, city. Zwróć JSON array.", "Wymień software house w Krakowie..." — i tak dla każdego miasta`;

  const timeTemplate = isSearch
    ? `Szablon: "[TEMAT] [LOKALIZACJA] [ROK/OKRES]" — generuj dla każdego roku lub okresu.
     Przykład (ceny mieszkań 2010-2024): "ceny mieszkań Warszawa 2010", "ceny mieszkań Warszawa 2012", "ceny mieszkań Kraków 2010", "ceny mieszkań Kraków 2012" — i tak dla kolejnych lat i miast`
    : `Szablon: "Podaj [DANE] dotyczące [LOKALIZACJA] w [ROK]. Zwróć JSON: {pole1, pole2}." — generuj dla każdego roku.
     Przykład (ceny mieszkań 2010-2024): "Podaj średnią cenę za m² mieszkania w Warszawie w roku 2010. Zwróć JSON: {city, year, price_per_m2}.", "...w roku 2011.", "...w roku 2012." — i tak dalej`;

  const multiTemplate = isSearch
    ? `Szablon: "[TEMAT] [LOKALIZACJA] [KATEGORIA]" — kombinacja lokalizacji × kategorii.
     Przykład (restauracje w Polsce): "restauracje włoskie Warszawa", "restauracje japońskie Warszawa", "restauracje włoskie Kraków", "restauracje japońskie Kraków" — iteruj przez lokalizacje × kuchnie`
    : `Szablon: "Wymień [TEMAT kategorii] w [LOKALIZACJA]. Podaj: [pola]. Zwróć JSON array."
     Przykład (restauracje w Polsce): "Wymień restauracje włoskie w Warszawie. name, address, phone. JSON.", "Wymień restauracje japońskie w Warszawie..." — iteruj przez lokalizacje × kuchnie`;

  const formatInstruction = buildFormatInstruction(outputFormat, isSearch);

  // Business entity detection — when query is about companies, enrich field suggestions
  const businessEntityHint = !isSearch ? `
=== SPECJALNE: DANE O FIRMACH / PODMIOTACH GOSPODARCZYCH ===
Gdy zapytanie dotyczy firm, przedsiębiorstw, spółek, software house'ów, producentów, pracodawców — ZAWSZE żądaj kompletnych danych rejestrowych i kontaktowych:
  Dane rejestrowe:    pełna_nazwa, forma_prawna (sp. z o.o. / S.A. / JDG...), NIP, REGON, KRS (jeśli dotyczy), data_założenia
  Dane adresowe:      ulica, numer, kod_pocztowy, miasto, województwo, kraj
  Dane kontaktowe:    telefon, email, strona_www, LinkedIn, Facebook
  Dane biznesowe:     branża, PKD, opis_działalności, liczba_pracowników, przychód (jeśli publiczny)
  Zarząd/właściciele: imię_nazwisko, stanowisko (prezes, właściciel, dyrektor...)
  Oferta:             główne_produkty_lub_usługi, rynki_zbytu, klienci_kluczowi
Przykładowy prompt dla firm (NIE rób skróconej wersji z 3 polami):
  ŹLE:  "Wymień firmy produkujące karmę dla kotów w Polsce. Podaj: name, city, employees."
  DOBRZE: "Wymień firmy produkujące karmę dla kotów w Warszawie. Dla każdej firmy podaj: pełna_nazwa, forma_prawna, NIP, REGON, KRS, adres (ulica, kod, miasto), telefon, email, strona_www, liczba_pracowników, opis_działalności, główne_marki_produktów, rok_założenia. Zwróć JSON array."
` : '';

  return `Jesteś generatorem zadań dla AI Query Runner — narzędzia do wsadowego przetwarzania zapytań AI.
Każde wygenerowane zapytanie trafi jako osobna prośba do serwisu "${target}" a wyniki zostaną zebrane razem.
Target: ${target} | Format każdego promptu: ${hint}

=== KROK 1: PRZEANALIZUJ INTENCJĘ ===

Zidentyfikuj:
1. TYP OBIEKTU: czego dotyczy? (firmy, produkty, osoby, miejsca, ceny, praca, historia, prawo, przepisy, wydarzenia, treści...)
2. ZAKRES: jak duży obszar? (jedno miasto, cały kraj, Europa, świat, konkretna lista, zakres lat...)
3. OŚ DEKOMPOZYCJI: wzdłuż czego podzielić żeby każdy prompt dał INNE wyniki?

=== KROK 2: WYBIERZ OŚ DEKOMPOZYCJI ===

OŚ GEOGRAFICZNA — gdy zakres = duży obszar przestrzenny
  Kiedy używać: "w Polsce", "w Europie", "na świecie", "w województwie X", "w mieście X"
  Zasada: osobny prompt dla każdej lokalizacji w zakresie (miasto, kraj, dzielnica, powiat)
  ${geoSearchTemplate}
  Polskie miasta: ${polishCities}
  Województwa: ${polishVoiv}
  Kraje UE/Europa: ${euCountries}

OŚ CZASOWA — gdy zakres = długi okres, historia, trendy
  Kiedy używać: "historia X", "w latach 20XX–20XX", "jak zmieniało się X", "trendy Y"
  Zasada: osobny prompt dla każdego roku/dekady/okresu
  ${timeTemplate}

OŚ KATEGORYCZNA — gdy zakres = szeroka klasa z wieloma podtypami
  Kiedy używać: "wszystkie typy X", "cała branża Y", "różne rodzaje Z"
  Zasada: osobny prompt dla każdej niszy/podkategorii
  Przykładowe podziały kategoryczne:
    Firmy IT: software house, agencje e-commerce, firmy AI/ML, cybersecurity, cloud, ERP, SaaS, embedded, mobilne
    Technologie pracy: Python, Java, JavaScript, .NET, PHP, Go, Rust, DevOps, QA, UX, Data Science
    Kuchnie restauracji: polska, włoska, japońska, meksykańska, indyjska, wegańska, fast food, fine dining
    Nieruchomości: kawalerki, 2-pokojowe, 3-pokojowe, domy, działki, komercyjne
    Prawo: pracy, cywilne, podatkowe, gospodarcze, RODO, karne, administracyjne
    Produkty elektroniczne: smartfony, laptopy, tablety, słuchawki, smartwatche, aparaty

OŚ ATRYBUTOWA — gdy szukasz różnych aspektów JEDNEGO obiektu
  Kiedy używać: "wszystko o produkcie X", "recenzja/analiza X", "kompletne dane o firmie Y"
  Zasada: osobny prompt dla każdego atrybutu/aspektu
  Aspekty produktu: cena, specyfikacja techniczna, recenzje użytkowników, wady/problemy, alternatywy, porównania
  Aspekty firmy: historia, produkty/usługi, finanse, opinie pracowników, dane kontaktowe, technologie, klienci
  Aspekty osoby: rola/stanowisko, osiągnięcia, publikacje, kontakt, historia kariery, powiązania

OŚ PODMIOTOWA — gdy masz listę konkretnych elementów i chcesz dane o każdym z osobna
  Kiedy używać: masz już nazwy firm/produktów/osób i chcesz je wzbogacić o dane
  Zasada: 1 prompt = 1 podmiot, identyczny schemat pól dla wszystkich

OŚ ŹRÓDŁOWA — gdy chcesz te same dane z różnych platform/źródeł
  Kiedy używać: "opinie z różnych źródeł", "dane z różnych platform", "co piszą o X", "ranking według różnych serwisów"
  Zasada: osobny prompt per platforma/źródło — każde zwróci inne dane lub inną perspektywę
  Przykłady platform dla opinii o produkcie:
    Ceneo, Allegro, Amazon, Media Expert, x-kom — dla cen i opinii zakupowych
    Reddit, wykop.pl, forum.benchmark.pl — dla opinii społecznościowych
    YouTube (recenzje wideo), GSMchoice.pl, benchmark.pl — dla recenzji eksperckich
  Przykłady źródeł dla danych o firmach:
    LinkedIn, Clutch.co, G2.com — dla profili i ocen firm
    KRS (Krajowy Rejestr Sądowy), CEIDG — dla danych rejestrowych
    Pracuj.pl, NoFluffJobs, LinkedIn Jobs — dla ofert pracy i opinii pracodawców
  Przykłady źródeł dla danych naukowych:
    Google Scholar, PubMed, arXiv, ResearchGate — dla publikacji naukowych
  ${isSearch
    ? `Szablon: "[TEMAT] [PLATFORMA/SERWIS]"\n  Przykład (opinie S24): "Samsung Galaxy S24 opinie Ceneo", "Samsung Galaxy S24 recenzja GSMchoice", "Samsung Galaxy S24 forum Reddit", "Samsung Galaxy S24 opinie YouTube", "Samsung Galaxy S24 benchmark test"`
    : `Szablon: "Podaj opinie/dane o [TEMAT] z platformy [PLATFORMA]. Zwróć JSON: {source, rating, pros, cons}."\n  Przykład: "Podaj opinie użytkowników o Samsung Galaxy S24 z serwisu Ceneo. JSON: {source, avg_rating, pros, cons}.", "...z Reddit...", "...z GSMchoice..."`}

OŚ PORÓWNAWCZA — gdy chcesz zestawić kilka konkretnych alternatyw
  Kiedy używać: "porównaj X vs Y vs Z", "najlepszy CRM/laptop/bank spośród [listy]", "ranking 10 systemów X"
  Zasada: NAJPIERW 1 prompt per podmiot (zebranie danych), POTEM 1 prompt zbiorczy (porównanie)
  NIE rób: "porównaj Salesforce, HubSpot, Zoho" × 10 wariantów — to quasi-duplikaty
  TAK rób:
    Krok 1 — per podmiot: "Podaj dane o Salesforce CRM: cena, funkcje, integracje, limity. JSON.", "...HubSpot...", "...Zoho..."
    Krok 2 — porównanie: "Porównaj Salesforce vs HubSpot vs Zoho pod kątem: cena, łatwość użycia, funkcje. Tabela JSON."

OŚ ZAKRESOWA — gdy zakres to skala numeryczna (ceny, daty, rozmiary, odległości)
  Kiedy używać: "produkty od X do Y zł", "firmy zatrudniające 10–500 osób", "budynki z lat 1900–2000"
  Zasada: podziel zakres na równe przedziały, osobny prompt dla każdego
  Przykład (laptopy 500–5000 zł): do 500 zł, 500–1000 zł, 1000–2000 zł, 2000–3000 zł, 3000–5000 zł

OŚ ALFABETYCZNA — gdy zbiór jest ogromny i nie ma lepszego podziału
  Kiedy używać: "wszystkie marki X", "słownik terminów", "katalog Y"
  Zasada: osobny prompt dla każdej litery lub grupy liter (A–D, E–H, I–L...)

OŚ WIELOOSIOWA — gdy zakres wymaga kombinacji
  Kiedy używać: zakres geograficzny + wiele kategorii (restauracje w Polsce = GEO x CAT)
  ${multiTemplate}

OŚ FASETOWA — dla abstraktów bez naturalnej osi (trendy, opinie ogólne, analizy, prognozy)
  Kiedy używać: "trendy w branży X", "jak postrzegane jest Y", "analiza rynku Z", "przyszłość X"
  Zasada: rozbij temat na fasety (perspektywy/wymiary), osobny prompt dla każdej fasety:
    Technologiczna: jakie technologie/narzędzia/metody są kluczowe?
    Ekonomiczna: koszty, przychody, inwestycje, rynek
    Społeczna/kulturowa: jak użytkownicy/społeczeństwo postrzega i przyjmuje?
    Regulacyjna/prawna: przepisy, standardy, ograniczenia
    Geograficzna: jak wygląda w Polsce vs USA vs Azja?
    Temporalna: jak zmieniało się w czasie? co przewiduje się na przyszłość?
    Podmiotowa: kto są główni gracze, startupy, liderzy?
    Praktyczna: konkretne przypadki użycia, przykłady wdrożeń
  Przykład (trendy AI 2025): po 1 prompcie na każdą fasetę = 8 różnych kątów patrzenia na ten sam temat

${businessEntityHint}=== KROK 3: GENERUJ PROMPTY ===

${isSearch
  ? `Format: KRÓTKIE FRAZY słów kluczowych (3–8 słów). Zero instrukcji, zero zdań. "Wyszukaj X" = błąd. "X Warszawa lista 2024" = OK.`
  : `Format: Pełne, samodzielne instrukcje dla AI. Zawsze określ oczekiwany format (JSON array, lista, tabela). Każdy prompt działa bez kontekstu innych.`}
Reguła DUPLIKATÓW: ten sam sens + inne słowa = duplikat. Różne pola JSON przy tym samym pytaniu = duplikat.
Liczba promptów: dopasuj do rozmiaru zakresu. GEO(Polska) = ~50. TIME(rok po roku 10 lat) = ~10–30. ATTR(jeden obiekt) = 5–15.
Język: taki sam jak język intencji użytkownika.

Odpowiedz WYŁĄCZNIE tablicą JSON, bez żadnego tekstu przed ani po, bez komentarzy:
[{"id":"1","prompt":"treść pierwszego promptu"},{"id":"2","prompt":"treść drugiego promptu"}]${formatInstruction}`;
}

function extractJson(raw: string): GeneratedPrompt[] {
  // Strip markdown code fences
  let clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  // Remove ellipsis placeholder items that some models insert: `...,` or `…,` or `// ...`
  clean = clean.replace(/,?\s*(\.{2,}|…)\s*,?/g, '');
  // Remove JS-style comments
  clean = clean.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // Trim trailing commas before ] or }
  clean = clean.replace(/,(\s*[}\]])/g, '$1');
  const start = clean.indexOf('[');
  const end   = clean.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Odpowiedź nie zawiera tablicy JSON.');
  const arr = JSON.parse(clean.slice(start, end + 1));
  if (!Array.isArray(arr)) throw new Error('Oczekiwano tablicy JSON.');
  return arr.map((item: any, i: number) => ({
    id:     String(item.id ?? i + 1),
    prompt: String(item.prompt ?? ''),
  })).filter(p => p.prompt.trim());
}

// Free OpenRouter models to try in order when the primary fails
const OR_FALLBACK_MODELS = [
  'moonshotai/kimi-k2.6:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nex-agi/nex-n2-pro:free',
  'google/gemma-4-26b-a4b-it:free',
];

export async function generateTasks(
  intent: string,
  target: string,
  provider: GeneratorProvider,
  apiKey: string,
  model?: string,
  extraOptions?: { ollamaUrl?: string; customEndpointUrl?: string },
  outputFormat?: string,
): Promise<GeneratedPrompt[]> {
  const systemPrompt = buildSystemPrompt(target, outputFormat);
  const userMessage  = `Intencja użytkownika: ${intent}`;

  if (provider === 'gemini-api') {
    const raw = await queryGeminiApi(userMessage, apiKey, model ?? 'gemini-2.0-flash', systemPrompt);
    return extractJson(raw);
  }

  if (provider === 'groq') {
    if (!apiKey) throw new Error('Brak klucza API Groq. Skonfiguruj go w Ustawieniach.');
    const raw = await queryGroq(userMessage, apiKey, model ?? 'llama-3.3-70b-versatile', systemPrompt);
    return extractJson(raw);
  }

  if (provider === 'xai') {
    if (!apiKey) throw new Error('Brak klucza API xAI. Skonfiguruj go w Ustawieniach.');
    const raw = await queryXAI(userMessage, apiKey, model ?? 'grok-3-mini', systemPrompt);
    return extractJson(raw);
  }

  if (provider === 'ollama') {
    const raw = await queryOllama(
      userMessage,
      model ?? 'llama3.2',
      systemPrompt,
      extraOptions?.ollamaUrl ?? 'http://localhost:11434',
    );
    return extractJson(raw);
  }

  if (provider === 'custom') {
    const url = extraOptions?.customEndpointUrl ?? '';
    if (!url) throw new Error('Brak URL custom endpoint. Skonfiguruj go w Ustawieniach.');
    const raw = await queryCustomEndpoint(userMessage, url, apiKey, model ?? 'gpt-4o-mini', systemPrompt);
    return extractJson(raw);
  }

  // OpenRouter: race the requested model against fallbacks — first success wins
  // This avoids sequential timeouts (e.g. 4 × 25s = 100s worst case → now 25s worst case)
  const modelsToRace = model
    ? [model, ...OR_FALLBACK_MODELS.filter(m => m !== model)].slice(0, 4)
    : OR_FALLBACK_MODELS;

  const isRetryableError = (e: any) => {
    const msg = String(e?.message ?? '');
    return msg.includes('Provider returned error') || msg.includes('429')
        || msg.includes('temporarily') || msg.includes('AbortError') || msg.includes('timed out');
  };

  // Try each model; collect promises and take the first to resolve with valid JSON
  return new Promise<GeneratedPrompt[]>((resolve, reject) => {
    let settled = false;
    let errors  = 0;
    const lastErrors: Error[] = [];

    for (const m of modelsToRace) {
      queryOpenRouter(userMessage, apiKey, m, systemPrompt)
        .then(raw => {
          if (settled) return;
          try {
            const prompts = extractJson(raw);
            settled = true;
            resolve(prompts);
          } catch (e: any) {
            lastErrors.push(e);
            errors++;
            if (errors === modelsToRace.length) reject(lastErrors[0]);
          }
        })
        .catch((e: any) => {
          lastErrors.push(e);
          errors++;
          // Hard errors (bad key, etc.) fail immediately without waiting for other models
          if (!isRetryableError(e)) { settled = true; reject(e); return; }
          if (!settled && errors === modelsToRace.length) reject(lastErrors[0]);
        });
    }
  });
}
