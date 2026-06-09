<div align="right">
🇵🇱 Polski | [🇬🇧 English](README.en.md)
</div>

# 🤖 AI Query Runner

| | Wersja standardowa | Wersja portable |
|--|--|--|
| **Przeznaczenie** | Instalacja na własnym komputerze/serwerze | Uruchomienie bez instalacji |
| **Wymagania** | Node.js 18+, Chromium | Brak (wszystko w środku) |
| **Rozmiar** | ~400–600 MB po instalacji | ~305 MB (archiwum ZIP) |
| **Aktualizacje** | `git pull` + `npm install` | Pobierz nowe archiwum |
| **Gałąź GitHub** | `main` | `portable` |
| **Tryb przeglądarkowy** | ✅ Tak | ✅ Tak (Chromium w środku) |
| **Tryb API** | ✅ Tak | ✅ Tak |
| **Pobieranie** | Instrukcja instalacji poniżej | [GitHub Releases](../../releases) |

**Nie wiesz którą wybrać?** → Jeśli możesz zainstalować Node.js — wybierz wersję standardową (łatwiejsze aktualizacje). Jeśli chcesz uruchomić bez instalacji czegokolwiek — pobierz portable z zakładki Releases.

---

Narzędzie do automatycznego przetwarzania list pytań przez modele AI. Wczytujesz Excel z pytaniami, wybierasz serwis AI — narzędzie odpytuje go automatycznie i zapisuje odpowiedzi z powrotem do pliku.

Działa z przeglądarką (Gemini, Claude, Perplexity i inne) oraz **bezpośrednio przez API** (Gemini API, OpenRouter, Groq, xAI, Ollama i inne) — bez konfiguracji przeglądarki, szybciej i stabilniej.

---

## ⚠️ Ważne — przeczytaj przed użyciem

> **Korzystasz z tego narzędzia na własną odpowiedzialność.**

Tryb przeglądarkowy automatyzuje klikanie w strony internetowe. Większość serwisów zabrania takiej automatyzacji w swoich regulaminach (Terms of Service).

**Co może się stać:**
- Twoje darmowe konto może zostać zablokowane lub ograniczone
- Serwis może wykryć automatyzację i zacząć zwracać błędy lub CAPTCHA
- Przy zbyt intensywnym użyciu możesz stracić dostęp do usługi

**Jak zmniejszyć ryzyko:**
- Ustaw długie przerwy między zapytaniami (min. 10–15 s, najlepiej 30+)
- Zacznij od małych partii (20–30 zapytań)
- Włącz harmonogram pracy, żeby nie działać w nocy
- Używaj własnego, prywatnego konta

> **Tryb API** (Gemini API, OpenRouter, Groq, Ollama itd.) nie używa przeglądarki i jest wolny od tych ograniczeń — jest to zalecana opcja jeśli masz dostęp do klucza API.

**Przetwarzanie danych osobowych (RODO):**  
To narzędzie może być używane do automatycznego zbierania danych — w tym danych, które mogą stanowić dane osobowe w rozumieniu RODO (np. imiona i nazwiska, adresy e-mail, numery telefonów, dane kontaktowe firm). Obowiązek zapewnienia zgodności z przepisami o ochronie danych osobowych spoczywa wyłącznie na osobie uruchamiającej program. Autor nie ponosi żadnej odpowiedzialności za sposób, w jaki zebrane dane są przechowywane, przetwarzane lub wykorzystywane. Przed uruchomieniem zadania zbierającego dane osobowe upewnij się, że masz do tego podstawę prawną.

To narzędzie powstało jako projekt demonstracyjny do celów badawczych i edukacyjnych.

---

## Co to robi?

Wyobraź sobie, że masz w Excelu listę 200 firm, 500 opisów produktów albo 100 miast do sprawdzenia. Normalnie otwierasz Gemini lub Perplexity, wpisujesz pierwsze pytanie, czekasz, kopiujesz odpowiedź, wpisujesz drugie pytanie... i tak przez kilka godzin.

AI Query Runner robi to za Ciebie. Wczytujesz plik Excel z listą, wybierasz serwis AI, klikasz „Uruchom" — a program samodzielnie przechodzi przez każdy wiersz, zadaje pytanie i wpisuje odpowiedź z powrotem do tego samego pliku. Możesz w tym czasie robić coś innego.

**Kilka konkretnych przykładów:**

**Zbieranie danych o firmach.** Masz listę 300 firm z bazy i chcesz dla każdej znaleźć krótki opis działalności, branżę albo dane kontaktowe. Zamiast szukać każdej z osobna — program odpytuje Perplexity lub DuckDuckGo dla każdego wiersza i zapisuje wyniki w kolumnach obok.

**Budowanie bazy od zera.** Wiesz, że Twoim klientem są np. małe hotele, gabinety stomatologiczne albo warsztaty samochodowe — i chcesz dotrzeć do jak największej ich liczby w wybranych miastach. Listy jeszcze nie masz, ale możesz ją zbudować. Opisujesz jednym zdaniem kogo szukasz, generator tworzy gotową listę zapytań (osobne dla każdego miasta i branży), a program przeszukuje DuckDuckGo lub Google i zbiera nazwy, adresy i kontakty. Na końcu masz gotowy arkusz z potencjalnymi klientami — zamiast tygodnia ręcznego szukania.

**Tłumaczenia na masową skalę.** Masz 500 opisów produktów do przetłumaczenia na angielski lub inny język. Wpisujesz opisy w jedną kolumnę, a gotowe tłumaczenia pojawiają się w kolumnie obok — bez kopiowania, bez czekania przy ekranie.

**Analiza opinii klientów.** Masz arkusz z opiniami ze sklepu i chcesz wiedzieć, które są pozytywne, a które wymagają reakcji. Każda opinia trafia do AI, wracają gotowe oceny i tematy — od razu do Excela.

**Generowanie treści.** Masz 100 produktów i potrzebujesz dla każdego opisu, tytułu SEO albo postu na social media. Dane z kolumn (nazwa, kategoria) są automatycznie wklejane do pytania — każdy wiersz dostaje unikalną treść.

Nie musisz umieć programować. Panel obsługuje się przez przeglądarkę, a jeśli nie wiesz od czego zacząć z listą pytań — wystarczy opisać jednym zdaniem co chcesz osiągnąć, a wbudowany generator sam ją przygotuje.

---

## 🚀 Jak zacząć (krok po kroku)

### Wersja standardowa (instalacja)

#### Krok 1 — Instalacja (jednorazowo)

**Windows:**
1. Kliknij dwukrotnie plik `install.bat`
2. Poczekaj kilka minut — skrypt sam zainstaluje wszystko
3. Odpowiedz na pytania kreatora (wybór serwisu, limity itp.)

**Linux / macOS:**
```bash
bash install.sh
```

#### Krok 2 — Uruchom panel zarządzania

**Windows:** Kliknij `start-panel.bat`  
**Linux / macOS:** `bash start-panel.sh`

Panel otwiera się w przeglądarce pod adresem `http://localhost:3535`.

---

### Wersja portable (bez instalacji)

1. Przejdź do zakładki **[Releases](../../releases)** w tym repozytorium
2. Pobierz archiwum odpowiednie dla swojego systemu:
   - `ai-query-runner-linux-x64.zip` — Linux
   - `ai-query-runner-windows-x64.zip` — Windows
   - `ai-query-runner-macos-x64.zip` — macOS
3. Rozpakuj archiwum do dowolnego folderu
4. Uruchom:
   - **Linux / macOS:** `./ai-query-runner` w terminalu
   - **Windows:** kliknij dwukrotnie `ai-query-runner.exe`
5. Panel otworzy się w przeglądarce pod adresem `http://localhost:3535`

> **Wersja portable zawiera wszystko** — skompilowany serwer, Playwright i Chromium. Nie wymaga Node.js, npm ani żadnej dodatkowej instalacji. Dane (ustawienia, historia, wyniki) są zapisywane w tym samym folderze co plik wykonywalny.

---

### Krok 2a — Pierwsze uruchomienie: ustaw hasło

Przy pierwszym uruchomieniu panel przekieruje Cię na stronę konfiguracji zabezpieczeń. Musisz ustawić hasło, zanim będzie można z niego korzystać.

1. Wpisz hasło (minimum 8 znaków) — będzie wymagane przy każdym zalogowaniu
2. Opcjonalnie: skonfiguruj weryfikację dwuskładnikową (2FA) — skanujesz kod QR raz, potem przy logowaniu wpisujesz 6-cyfrowy kod z telefonu
3. Kliknij „Przejdź do logowania"

> Hasło i konfiguracja zabezpieczeń są przechowywane lokalnie w pliku `.aqr-auth.json`. Możesz zmienić hasło lub włączyć/wyłączyć 2FA w dowolnym momencie z poziomu ⚙️ Ustawienia → sekcja „Bezpieczeństwo".

### Krok 3 — Przygotuj plik Excel

Kliknij **⬇ Pobierz szablon** w panelu. Wpisz swoje pytania w kolumnie B.

### Krok 4 — Uruchom zadanie

1. Wgraj plik Excel na pole „Plik Excel"
2. Wybierz serwis AI
3. Kliknij **▶ Uruchom**

Przy pierwszym uruchomieniu trybu przeglądarkowego narzędzie poczeka, aż ręcznie zalogujesz się na dane konto. Sesja zostaje zapamiętana — przy kolejnym uruchomieniu logowanie dzieje się automatycznie.

> Jeśli wolisz **tryb API** (szybszy, bez przeglądarki) — przejdź od razu do sekcji [Bezpośrednie API](#bezpośrednie-api--bez-przeglądarki), wpisz klucz w ⚙️ Ustawienia i wybierz odpowiedni target.

---

## Jak to działa?

### Tryb przeglądarkowy

Narzędzie steruje przeglądarką Chromium — tak jak robiłby to człowiek:

```
Twój plik Excel        AI Query Runner          Serwis AI
(lista pytań)    →    otwiera Chromium     →    gemini.google.com
                      wkleja pytanie            claude.ai
                      czeka na odpowiedź        perplexity.ai
                      kopiuje wynik             ...
                           ↓
                      Twój plik Excel
                      (wypełniony odpowiedziami)
```

### Tryb API (bez przeglądarki)

Zapytania trafiają bezpośrednio do modelu przez HTTPS — szybciej, stabilniej, bez okna Chromium:

```
Twój plik Excel        AI Query Runner          API
(lista pytań)    →    fetch(prompt)        →    generativelanguage.googleapis.com
                      odbiera odpowiedź         openrouter.ai/api/v1
                           ↓                    api.groq.com/openai/v1
                      Twój plik Excel           api.x.ai/v1
                      (wypełniony odpowiedziami) localhost:11434 (Ollama)
```

---

## Jak wygląda plik Excel?

Plik musi mieć 4 kolumny (nagłówek w pierwszym wierszu):

| A — ID | B — Prompt | C — Response | D — Status |
|--------|------------|--------------|------------|
| 1 | Co to jest fotosynteza? | *(tu trafi odpowiedź AI)* | *(done / error)* |
| 2 | Wymień 5 stolic Europy | | |
| 3 | Streść „Quo Vadis" w 3 zdaniach | | |

- **B (Prompt)** — wpisujesz pytania lub instrukcje
- **C (Response)** — narzędzie wpisuje odpowiedź AI
- **D (Status)** — narzędzie wpisuje `done` lub `error: ...`

Wiersz z błędem nie zatrzymuje zadania — narzędzie przechodzi do kolejnego. Możesz potem wznowić z opcją „Pomiń gotowe" żeby przetworzyć tylko te, które nie przeszły.

**Progresywny zapis** — wyniki są zapisywane po każdym wierszu, żeby nic nie przepadło przy ewentualnym przerwaniu.

---

## Przykłady zastosowań

### Zbieranie danych o firmach

Kolumna C zawiera nazwy miast, prompt używa zmiennej `{{C}}`:

| A | B (Prompt) | C (miasto) |
|---|-----------|-----------|
| 1 | Podaj dane firmy produkującej kredki w {{C}}. Zwróć JSON: {"nazwa":"...","nip":"...","regon":"...","adres":"...","email":"...","telefon":"..."} | Warszawa |
| 2 | (j.w.) | Kraków |
| 3 | (j.w.) | Wrocław |

Z włączonym trybem **„Wymuś JSON"** każdy wiersz zostanie automatycznie rozłożony na kolumny:

| E — nazwa | F — nip | G — regon | H — adres | I — email |
|-----------|---------|-----------|-----------|-----------|
| Kredka S.A. | 5213001234 | 012345678 | ul. Fabryczna 1... | kontakt@... |

> **Wskazówka:** Dane z modeli AI (szczególnie NIP, KRS) wymagają weryfikacji w oficjalnych źródłach. Do wyszukiwania realnych firm lepiej sprawdzi się **Perplexity** (dostęp do internetu) lub **DuckDuckGo/Google API** (bieżące dane, patrz niżej).

### Tłumaczenie listy tekstów

| A | B (Prompt) |
|---|-----------|
| 1 | Przetłumacz na angielski, zachowaj ton sprzedażowy: „Ekologiczne kredki woskowe, 24 kolory, certyfikat CE." |
| 2 | Przetłumacz na angielski: „Zestaw akwareli premium, 36 kolorów, tuby 12 ml." |

### Analiza sentymentu opinii

| A | B (Prompt) |
|---|-----------|
| 1 | Oceń opinię. Zwróć JSON: {"sentiment":"pozytywny/neutralny/negatywny","temat":"...","ocena":5}. Opinia: „Kredki świetne, kolory żywe, ale pudełko słabe." |
| 2 | (j.w.) Opinia: „Zestaw nie wart ceny, farby szybko wyschły." |

### Generowanie opisów SEO

| A | B (Prompt) | C (produkt) | D (kategoria) |
|---|-----------|------------|--------------|
| 1 | Napisz meta description (max 155 znaków) dla produktu „{{C}}" z kategorii „{{D}}". | Kredki woskowe 24 kolory | Artykuły plastyczne |
| 2 | (j.w.) | Farby akwarelowe premium | Malarstwo |

---

## Tryb JSON — automatyczne rozbicie na kolumny

Przy włączonej opcji **„Wymuś JSON"** narzędzie oczekuje odpowiedzi w formacie strukturyzowanym, np.:

```json
{"Imie": "Jan", "Miasto": "Warszawa", "Wiek": 35}
```

i automatycznie tworzy dodatkowe kolumny w pliku:

| A | B | C (pełny JSON) | D | E — Imie | F — Miasto | G — Wiek |
|---|---|----------------|---|----------|------------|----------|
| 1 | Pytanie | {"Imie":"Jan",...} | done | Jan | Warszawa | 35 |

**Klucze JSON stają się nagłówkami kolumn** — używaj tych samych kluczy w każdym wierszu.

---

## Obsługiwane serwisy

### Modele AI — sterowanie przeglądarką

| Serwis | Klucz | Wymaga konta? | Uwagi |
|--------|-------|---------------|-------|
| `gemini` | gemini.google.com | Tak (Google) | Stabilny, zalecany do ogólnych pytań |
| `perplexity` | perplexity.ai | Opcjonalne | Dostęp do internetu — dobre do aktualnych danych |
| `claude` | claude.ai | Tak (Anthropic) | Świetny do długich analiz i rozumowania |
| `copilot` | copilot.microsoft.com | Opcjonalne | ~20 zapytań bez konta; więcej z kontem Microsoft |
| `mistral` | chat.mistral.ai | Tak (darmowe) | Europejski model, GDPR-friendly |
| `deepseek` | chat.deepseek.com | Tak (darmowe) | Dobry do analizy i kodu |

### Wyszukiwarki — bez przeglądarki (fetch)

Szybsze, nie wymagają Playwright. Zwracają wyniki wyszukiwania, nie odpowiedzi generatywne.

| Serwis | Klucz | Klucz API? | Limit | Uwagi |
|--------|-------|-----------|-------|-------|
| `duckduckgo` | — | ❌ Nie | Brak (przy rozsądnym użyciu) | Zero konfiguracji, działa od razu |
| `google-api` | — | ✅ Tak (darmowy) | 100 zapytań/dzień | Wyniki Google, jednorazowa konfiguracja |

### Bezpośrednie API — bez przeglądarki

Szybkie, stabilne, idealne do dużych partii. Wymagają klucza API lub lokalnego serwera.

| Serwis | Target | Gdzie wziąć klucz | Uwagi |
|--------|--------|------------------|-------|
| **Gemini API** | `gemini-api` | [aistudio.google.com](https://aistudio.google.com) → Get API Key | Gemini przez Google AI Studio — szybki, darmowy tier |
| **OpenRouter** | `openrouter` | [openrouter.ai](https://openrouter.ai) → Keys | Dostęp do 300+ modeli (GPT-4o, Claude, Llama, Mistral) przez jedno API |
| **Groq** | `groq` | [console.groq.com](https://console.groq.com) → API Keys | Llama, Mixtral i inne — bardzo szybkie wnioskowanie |
| **xAI / Grok** | `xai` | [console.x.ai](https://console.x.ai) | Modele Grok od xAI |
| **Ollama** | `ollama` | Lokalny serwer | Dowolny model lokalnie, pełna prywatność, bez limitów |
| **Custom Endpoint** | `custom` | Twój endpoint | Dowolne API kompatybilne z OpenAI (LM Studio, vLLM, Mistral, Together itd.) |

Klucze i konfigurację wpisujesz w ⚙️ Ustawienia. Po wpisaniu klucza kliknij **↻** przy polu modelu — narzędzie pobierze aktualną listę dostępnych modeli.

#### Konfiguracja Ollama (lokalne modele)

Ollama pozwala uruchomić modele AI lokalnie — bez dostępu do internetu, bez kosztów, z pełną prywatnością danych.

1. Zainstaluj Ollama ze strony [ollama.com](https://ollama.com)
2. Pobierz model: `ollama pull llama3.2` lub `ollama pull qwen2.5:7b`
3. W ⚙️ Ustawienia → zakładka „API" wpisz:
   - **Ollama URL:** `http://localhost:11434` (domyślnie) lub adres zdalnego serwera
   - **Ollama Model:** nazwa modelu, np. `llama3.2` lub `qwen2.5:7b-instruct-q4_K_M`
4. Kliknij ↻ przy polu modelu — lista dostępnych modeli załaduje się automatycznie

#### Konfiguracja Custom Endpoint

Działa z każdym API kompatybilnym z OpenAI `/v1/chat/completions`:

| Przykład | URL | Klucz |
|---------|-----|-------|
| LM Studio | `http://localhost:1234` | dowolny lub pusty |
| vLLM | `http://localhost:8000` | dowolny |
| Together AI | `https://api.together.xyz/v1` | klucz Together |
| Mistral API | `https://api.mistral.ai/v1` | klucz Mistral |

### Przykłady skutecznych zapytań do wyszukiwarek

Wyszukiwarki (`duckduckgo`, `google-api`) zwracają linki i fragmenty stron — sprawdzają się do znajdowania konkretnych stron, firm i dokumentów publicznych.

**Firmy z branży w mieście:**
```
producent kredek Warszawa kontakt NIP
"producent kredek" site:aleo.com OR site:firmy.net "Kraków"
```

**Dane rejestrowe:**
```
firma "produkcja kredek" NIP REGON "PKD 3209"
"producent kredek" KRS filetype:pdf
```

**Weryfikacja kontaktów:**
```
"Kredka S.A." Warszawa email kontakt
"Artykuły Plastyczne sp. z o.o." telefon adres
```

**SEO i monitoring:**
```
site:competitor.pl intitle:"kredki woskowe"
"kredki woskowe 24 kolory" cena 2025
```

> **Tryb zmiennych w wyszukiwarce:** Jeśli kolumna C zawiera branżę, a kolumna D miasto, prompt `"{{C}} {{D}} kontakt email"` wyprodukouje inne zapytanie dla każdego wiersza.

**Google Search API** — jednorazowa konfiguracja:
1. [console.cloud.google.com](https://console.cloud.google.com) → utwórz projekt → włącz **Custom Search JSON API** → utwórz klucz API → wklej do pola `GOOGLE_API_KEY` w ⚙️ Ustawienia
2. [programmablesearchengine.google.com](https://programmablesearchengine.google.com) → utwórz silnik → zaznacz **Przeszukaj całą sieć** → skopiuj ID silnika do `GOOGLE_CSE_ID` w Ustawienia

Darmowy tier: **100 zapytań dziennie**. Powyżej: $5 za 1000 zapytań (opcjonalne).

---

## 🧠 Generator zadań

Zamiast ręcznie pisać dziesiątki promptów — opisujesz co chcesz osiągnąć, a AI przygotowuje gotową listę za Ciebie.

**Jak to działa:**
1. Kliknij zakładkę **🧠 Generator zadań** w panelu
2. Wpisz intencję w wolnym tekście, np.:  
   *„Znajdź firmy zajmujące się produkcją mebli w 20 największych miastach Polski. Zwróć nazwę, NIP, adres i telefon."*
3. Wybierz **Target** — serwis, do którego trafią wygenerowane prompty (Gemini, Perplexity, Google API itd.)
4. Wybierz **Model do generowania** — jeden z: Gemini API, OpenRouter, Groq, xAI, Ollama lub Custom Endpoint (wymaga klucza/konfiguracji w ⚙️ Ustawienia)
5. Kliknij **✨ Generuj prompty**
6. Przejrzyj listę — każdy prompt możesz edytować bezpośrednio w tabeli
7. Kliknij **⬇ Pobierz Excel** lub **▶ Uruchom zadanie**

Model automatycznie dopasowuje styl promptów do wybranego targetu — dla DuckDuckGo generuje krótkie frazy wyszukiwania, dla Gemini pełne zdania z instrukcjami JSON, dla OpenRouter szczegółowe polecenia z formatem odpowiedzi.

> Generator potrzebuje klucza API (Gemini, OpenRouter, Groq itd.) żeby wygenerować listę promptów. Sam docelowy serwis (do którego trafia lista) może być zupełnie inny — np. możesz wygenerować prompty przez Groq i uruchomić je na DuckDuckGo.

### Uwaga: dostęp do internetu a modele AI

> ⚠️ **Nie wszystkie modele mają dostęp do internetu.** Większość modeli językowych bazuje wyłącznie na wiedzy z treningu — nie ma możliwości wyszukiwania aktualnych informacji. Dane takie jak aktualne ceny, nowe firmy czy bieżące kontakty mogą być nieaktualne lub nieprecyzyjne.
>
> **Dostęp do internetu:** Perplexity, Gemini w trybie przeglądarkowym, Copilot  
> **Bez dostępu do internetu:** Claude API, większość modeli przez OpenRouter/Groq/Ollama, Gemini API (bez grounding)  
> **Zawsze aktualne:** DuckDuckGo, Google Search API  
>
> Zawsze weryfikuj dane w oficjalnych źródłach (KRS.gov.pl, GUS, strony firmowe).

---

## 📂 Historia zadań

Zakładka **📂 Historia** w panelu przechowuje wszystkie przeszłe uruchomienia — ukończone, zatrzymane i zakończone błędem.

- **Pobierz wyniki** — kliknij przycisk przy dowolnym rekordzie, żeby pobrać plik Excel z odpowiedziami
- **Zatrzymane zadania** — wyniki są zapisywane po każdym wierszu, więc nawet przy ręcznym zatrzymaniu masz dostęp do zebranych danych
- Historia persystuje między restartami serwera

---

## ⚙️ Konfiguracja

### Panel ustawień (zalecane)

Kliknij ikonę **⚙️** w prawym górnym rogu panelu. Ustawienia podzielone są na zakładki:

| Zakładka | Co możesz zmienić |
|----------|------------------|
| **Ogólne** | Limity zapytań, przerwy między zapytaniami, cisza nocna, ponowne próby |
| **API** | Klucze API: Gemini, OpenRouter, Groq, xAI, Ollama, Custom Endpoint |
| **Przeglądarka** | Tryb headless, usuwanie formatowania Markdown |
| **Google** | Klucz API Google, CSE ID, Service Account JSON do Google Sheets |
| **Bezpieczeństwo** | Zmiana hasła, włączanie/wyłączanie 2FA |

Ustawienia zapisują się natychmiast i wchodzą w życie bez restartu serwera (plik `.aqr-settings.json`). Przycisk wylogowania znajduje się w nagłówku okna ustawień (górny prawy róg).

> Klucze API są szyfrowane algorytmem **AES-256-GCM** przed zapisem na dysk. W panelu wyświetlają się zawsze jako zamaskowane (`AIza***...***xyz`) — żeby zaktualizować klucz, wystarczy wpisać nową wartość i zapisać.

> **Priorytet ustawień:** Panel (⚙️) > plik `.env` > wartości domyślne.

### Plik `.env` (opcjonalnie)

Alternatywny sposób konfiguracji — przydatny przy uruchamianiu z konsoli. Otwórz w notatniku:

```ini
TARGET_SITE=gemini          # domyślny serwis (panel nadpisuje przy uruchomieniu)
HEADLESS=false              # false = okno widoczne; true = działa w tle
DAILY_LIMIT=150             # maks. zapytań dziennie
PAUSE_MIN_MS=10000          # min. przerwa między zapytaniami (ms)
PAUSE_MAX_MS=20000          # maks. przerwa
NIGHT_START=23              # cisza nocna od godz.
NIGHT_END=7                 # cisza nocna do godz.
STRIP_MARKDOWN=false        # true = usuwa ** ## `` z odpowiedzi

# Bezpośrednie API (opcjonalnie)
# GEMINI_API_KEY=AIza...
# GEMINI_API_MODEL=gemini-2.0-flash
# OPENROUTER_API_KEY=sk-or-...
# OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
# GROQ_API_KEY=gsk_...
# GROQ_MODEL=llama-3.3-70b-versatile
# XAI_API_KEY=xai-...
# XAI_MODEL=grok-3-mini
# OLLAMA_URL=http://localhost:11434
# OLLAMA_MODEL=llama3.2

# Custom OpenAI-compatible endpoint
# CUSTOM_ENDPOINT_URL=http://localhost:1234
# CUSTOM_ENDPOINT_KEY=
# CUSTOM_ENDPOINT_MODEL=

# Google Sheets (opcjonalnie)
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# GOOGLE_API_KEY=YOUR_KEY
# GOOGLE_CSE_ID=YOUR_CSE_ID
```

---

## Jak działa integracja z Google Sheets?

Zamiast pliku Excel możesz wskazać Arkusz Google:

```
sheets:TWÓJ_SPREADSHEET_ID:Arkusz1!A:D
```

- `TWÓJ_SPREADSHEET_ID` — ID arkusza z paska URL (długi ciąg znaków)
- `Arkusz1` — nazwa zakładki
- `A:D` — zakres kolumn

Wymaga skonfigurowania dostępu do Google API — patrz sekcja Konfiguracja (Service Account JSON lub klucz API).

---

## 💻 Wymagania systemowe

| Komponent | Minimum | Zalecane |
|-----------|---------|----------|
| RAM | 4 GB | 8 GB |
| Procesor | 2 rdzenie | 4+ rdzenie |
| Dysk | 1 GB | 2 GB |
| Internet | Stałe połączenie | Szerokopasmowe |

> Chromium działający w tle zajmuje ok. 300–500 MB RAM. **Tryb API nie uruchamia przeglądarki** — wystarcza kilkadziesiąt MB.

**Systemy operacyjne:** Windows 10/11, Linux (Ubuntu 20.04+, Debian, Arch), macOS 11+

**Wymagane oprogramowanie** (instalowane automatycznie przez skrypt):
- **Node.js 18+** — środowisko uruchomieniowe
- **Chromium** — przeglądarka do automatyzacji (nie jest potrzebna w trybie API)

**Całkowity rozmiar po instalacji:** ~400–600 MB (głównie `node_modules` i Chromium)

---

## 🛠️ Stack technologiczny

| Technologia | Rola w projekcie |
|-------------|-----------------|
| **Node.js 18+** | Środowisko uruchomieniowe — serwer HTTP, logika przetwarzania, operacje na plikach |
| **TypeScript** | Język projektu — statyczne typowanie, kompilacja do JS |
| **Express** | Serwer HTTP panelu webowego — REST API, obsługa sesji, routing |
| **Playwright** | Automatyzacja przeglądarki — sterowanie Chromium w trybie przeglądarkowym |
| **Chromium** | Przeglądarka do automatyzacji (bundlowana lub instalowana przez Playwright) |
| **ExcelJS** | Odczyt i zapis plików `.xlsx` — template, zapis odpowiedzi wiersz po wierszu |
| **Bun** | Kompilacja wersji portable — `bun build --compile` tworzy samodzielny binarny plik |
| **tsx** | Uruchamianie TypeScript bez kompilacji w trybie deweloperskim |
| **bcrypt** | Hashowanie hasła do panelu (koszt 12) |
| **AES-256-GCM** | Szyfrowanie kluczy API przed zapisem na dysk (wbudowany moduł `crypto`) |
| **TOTP** | Weryfikacja dwuskładnikowa (2FA) — standard kompatybilny z Google Authenticator / Authy |
| **Google Sheets API** | Opcjonalne wejście/wyjście przez Google Arkusze zamiast pliku Excel |

---

## 💻 Zaawansowane — użycie z konsoli

```bash
# Utwórz pusty szablon Excel
npx tsx src/main.ts --create-template moje-zapytania.xlsx

# Uruchom przetwarzanie (przeglądarka niewidoczna)
npx tsx src/main.ts --input moje-zapytania.xlsx --target gemini --headless

# Test na 3 wierszach przed pełnym uruchomieniem
npx tsx src/main.ts --input moje-zapytania.xlsx --preview

# Pomiń wiersze z już gotowymi odpowiedziami (wznowienie po przerwie)
npx tsx src/main.ts --input moje-zapytania.xlsx --skip-done

# Sprawdź co będzie przetworzone — bez uruchamiania przeglądarki
npx tsx src/main.ts --input moje-zapytania.xlsx --dry-run

# Tryb A/B — porównaj wyniki Gemini i DeepSeek w jednym pliku
npx tsx src/main.ts --input moje-zapytania.xlsx --targets gemini,deepseek

# Eksportuj wyniki do CSV i JSON oprócz Excel
npx tsx src/main.ts --input moje-zapytania.xlsx --export csv,json

# Bezpośrednie API — Gemini API
npx tsx src/main.ts --input moje-zapytania.xlsx --target gemini-api

# Bezpośrednie API — Groq
npx tsx src/main.ts --input moje-zapytania.xlsx --target groq

# Lokalne modele — Ollama
npx tsx src/main.ts --input moje-zapytania.xlsx --target ollama

# System prompt do każdego zapytania
npx tsx src/main.ts --input moje-zapytania.xlsx --target groq --system-prompt "Odpowiadaj zwięźle, po polsku."
```

### Zmienne `{{kolumna}}` w promptach

| Zapis | Znaczenie |
|-------|-----------|
| `{{C}}` | Wartość kolumny C w danym wierszu |
| `{{D}}` | Wartość kolumny D |
| `{{B}}` | Treść promptu (kolumna B) — rzadko potrzebne |

**Przykład:** Prompt `"Przetłumacz '{{B}}' na język {{C}}"` przy B=`"kot"` i C=`"angielski"` wyśle: `"Przetłumacz 'kot' na język angielski"`.

### Wszystkie opcje CLI

| Opcja | Opis |
|-------|------|
| `--target <nazwa>` | Serwis: `gemini` `perplexity` `claude` `copilot` `mistral` `deepseek` `google` `google-api` `duckduckgo` `gemini-api` `openrouter` `groq` `xai` `ollama` `custom` |
| `--targets <lista>` | Tryb A/B: kilka serwisów po przecinku, np. `gemini,deepseek` |
| `--headless` | Przeglądarka w tle (niewidoczna) |
| `--preview` | Test na 3 pierwszych wierszach |
| `--strip-markdown` | Usuwa `**`, `##`, `` ` `` z odpowiedzi |
| `--system-prompt <tekst>` | Instrukcja dołączana do każdego zapytania |
| `--json-format` | Wymusza odpowiedź JSON i rozbija na kolumny |
| `--export <formaty>` | `csv`, `json` lub `csv,json` |
| `--skip-done` | Pomija wiersze ze statusem `done` |
| `--limit <n>` | Przetwarza maksymalnie N wierszy |
| `--dry-run` | Pokazuje co zostanie przetworzone, nie uruchamia przeglądarki |
| `--sch-start <0-23>` | Godzina rozpoczęcia pracy |
| `--sch-end <0-23>` | Godzina zakończenia pracy |
| `--sch-days <dni>` | Dni tygodnia: `1,2,3,4,5` = pon–pt |
| `--pause-min <s>` | Minimalna przerwa (sekundy) |
| `--pause-max <s>` | Maksymalna przerwa (sekundy) |

---

## ❓ Częste problemy

**„Waiting for manual login" — co robić?**  
Narzędzie otworzyło przeglądarkę i czeka na zalogowanie. Przejdź do okna Chromium i zaloguj się. Sesja zostanie zapamiętana.

**Przeglądarka się nie otwiera (Linux)?**  
Sprawdź czy masz uruchomiony serwer X (`echo $DISPLAY`). Możesz też zainstalować przeglądarkę ręcznie: `npx playwright install chromium`

**Odpowiedzi kończą się błędem „TIMEOUT"?**  
Serwis AI jest przeciążony lub wykrył automatyzację. Zwiększ `PAUSE_MIN_MS` i spróbuj za kilka minut.

**Zablokowano konto?**  
Zmniejsz `DAILY_LIMIT`, wydłuż przerwy i włącz harmonogram. Rozważ przejście na tryb API (`groq`, `gemini-api` lub `openrouter`).

**Panel jest niedostępny po uruchomieniu?**  
Port 3535 może być zajęty. Zmień w `.env`: `BRIDGE_PORT=3536`.

**Generator nie zwraca wyników?**  
Sprawdź czy klucz API jest wpisany w ⚙️ Ustawienia. Generator obsługuje: Gemini API, OpenRouter, Groq, xAI, Ollama i Custom Endpoint.

**Ollama — „fetch failed" lub timeout?**  
Sprawdź czy serwer Ollama jest uruchomiony (`ollama serve`) i czy podany URL jest poprawny. Modele myślące (np. qwen3) mogą potrzebować więcej czasu — timeout jest ustawiony na 120 sekund.

**Panel przekierowuje na stronę logowania?**  
To normalne — panel jest chroniony hasłem. Zaloguj się danymi ustawionymi podczas pierwszej konfiguracji. Jeśli zapomniałeś hasła, usuń plik `.aqr-auth.json` z folderu projektu — panel wróci do kroku konfiguracji i będziesz mógł ustawić nowe hasło.

**Nie mam dostępu do kodu 2FA (zgubiłem telefon)?**  
Usuń plik `.aqr-auth.json` i przejdź ponownie przez konfigurację. Spowoduje to reset hasła i wyłączenie 2FA.

---

## 🔧 Rozbudowa i integracje

Projekt jest zbudowany modularnie — dodanie nowego serwisu to kwestia jednego pliku i kilku linii rejestracji.

### Integracje gotowe do dodania

| Serwis | Co daje | Klucz API | Free tier |
|--------|---------|-----------|-----------|
| **Tavily** | Wyszukiwarka zoptymalizowana pod AI — wyodrębnione fragmenty treści, nie surowe linki | [app.tavily.com](https://app.tavily.com) | 1 000 zapytań/mies. |
| **Brave Search API** | Własny indeks Brave (nie Google), dobra jakość wyników | [api.search.brave.com](https://api.search.brave.com) | 2 000 zapytań/mies. |
| **Serper.dev** | Faktyczne wyniki Google bez konfiguracji Google Cloud | [serper.dev](https://serper.dev) | 2 500 kredytów na start |
| **Exa.ai** | Wyszukiwanie semantyczne — szuka po znaczeniu, dobre do research | [exa.ai](https://exa.ai) | 1 000 zapytań/mies. |
| **SearXNG** | Self-hosted meta-wyszukiwarka agregująca Google, Bing, DuckDuckGo — zero limitów, pełna prywatność | Publiczne instancje: [searx.space](https://searx.space) | Bezpłatne |

### Jak dodać własny target — 4 kroki

Na przykładzie Tavily:

**Krok 1 — `src/api/TavilyApi.ts`:**
```typescript
export async function queryTavily(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query: prompt, max_results: 3 }),
  });
  const data = await res.json();
  return data.results
    .map((r: any) => `**${r.title}**\n${r.content}\n${r.url}`)
    .join('\n\n');
}
```

**Krok 2 — zarejestruj w `src/main.ts`:**
```typescript
} else if (config.targetSite === 'tavily') {
  const { queryTavily } = await import('./api/TavilyApi.js');
  executeQuery = (prompt) => queryTavily(prompt, config.tavilyApiKey!);
}
```

**Krok 3 — dodaj klucz do `src/config/config.ts`:**
```typescript
tavilyApiKey: process.env['TAVILY_API_KEY'] ?? null,
```

**Krok 4 — dodaj do listy w `src/server.ts`:**
```typescript
const VALID_TARGETS = [..., 'tavily'];
```

Nowy target pojawi się jako opcja w panelu.

---

## 🔒 Bezpieczeństwo

### Dostęp do panelu

Panel jest chroniony hasłem. Przy pierwszym uruchomieniu ustawiasz hasło przez kreator — bez tego panel nie jest dostępny. Opcjonalnie możesz włączyć weryfikację dwuskładnikową (2FA): przy każdym logowaniu wpisujesz wtedy hasło oraz 6-cyfrowy kod z aplikacji na telefonie (Google Authenticator, Authy lub dowolna aplikacja obsługująca TOTP).

**Szczegóły techniczne dla zainteresowanych:**
- Hasło przechowywane jako hash bcrypt (koszt 12) — nie ma możliwości jego odczytania z pliku
- Sesja ważna 8 godzin, cookie `HttpOnly` + `SameSite=Strict` — niedostępna dla skryptów JS
- CSRF token wymagany przy każdym żądaniu modyfikującym dane — blokuje ataki z zewnętrznych stron
- Rate limiting: 10 nieudanych prób logowania na 15 minut z jednego adresu IP

### Ochrona kluczy API

Wszystkie klucze API są szyfrowane algorytmem **AES-256-GCM** przed zapisem na dysk. W panelu wyświetlają się wyłącznie jako zamaskowane (`AIza***...***xyz`) — pełna wartość nigdy nie opuszcza serwera. Żeby zaktualizować klucz, wystarczy wpisać nową wartość i kliknąć „Zapisz".

### Dane zebrane przez narzędzie

- Odpowiedzi AI i pliki Excel są przechowywane lokalnie na Twoim komputerze / serwerze — nigdzie nie są wysyłane automatycznie
- Pliki można pobrać tylko przez zalogowany panel — nie są dostępne jako publiczne linki
- Sesja przeglądarki (ciasteczka serwisów AI) przechowywana lokalnie:
  - Linux/macOS: `~/.config/ai-query-runner/browser-profile/<serwis>/`
  - Windows: `%APPDATA%\ai-query-runner\browser-profile\<serwis>\`

### Konfiguracja na VPS

Jeśli uruchamiasz panel na serwerze zdalnym, zalecanym ustawieniem jest umieszczenie go za odwrotnym proxy (nginx, Caddy) z certyfikatem HTTPS. Panel domyślnie nasłuchuje wyłącznie na `127.0.0.1` — żeby był dostępny zdalnie, proxy musi być skonfigurowane po stronie serwera. **Nie wystawiaj portu 3535 bezpośrednio na internet bez HTTPS.**

Plik `.aqr-auth.json` zawiera konfigurację zabezpieczeń — **nie umieszczaj go w repozytorium git** i nie udostępniaj nikomu. Plik `.env` i `.aqr-settings.json` — analogicznie.
