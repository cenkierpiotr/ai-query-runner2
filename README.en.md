<div align="right">
[🇵🇱 Polski](README.md) | 🇬🇧 English
</div>

# 🤖 AI Query Runner

| | Standard version | Portable version |
|--|--|--|
| **Use case** | Installation on your own computer/server | Run without installation |
| **Requirements** | Node.js 18+, Chromium | None (everything included) |
| **Size** | ~400–600 MB after install | ~305 MB (ZIP archive) |
| **Updates** | `git pull` + `npm install` | Download new archive |
| **GitHub branch** | `main` | `portable` |
| **Browser mode** | ✅ Yes | ✅ Yes (Chromium included) |
| **API mode** | ✅ Yes | ✅ Yes |
| **Download** | Installation instructions below | [GitHub Releases](../../releases) |

**Not sure which to choose?** → If you can install Node.js — go with the standard version (easier updates). If you want to run it without installing anything — download portable from the Releases tab.

---

A tool for automatically processing lists of queries using AI models. You load an Excel file with questions, select an AI service — the tool queries it automatically and saves the answers back to the file.

It works with a browser (Gemini, Claude, Perplexity, and others) as well as **directly via API** (Gemini API, OpenRouter, Groq, xAI, Ollama, and others) — without browser configuration, making it faster and more stable.

---

## ⚠️ Important — read before use

> **You use this tool at your own risk.**

The browser mode automates clicking on websites. Most services forbid such automation in their Terms of Service.

**What could happen:**
- Your free account may be blocked or restricted
- The service may detect automation and start returning errors or CAPTCHA
- With intensive use, you may lose access to the service

**How to reduce the risk:**
- Set long delays between queries (min. 10–15 s, preferably 30+)
- Start with small batches (20–30 queries)
- Enable a schedule to avoid running at night
- Use your own private account

> **API mode** (Gemini API, OpenRouter, Groq, Ollama, etc.) does not use a browser and is free from these restrictions — this is the recommended option if you have access to an API key.

**Personal Data Processing (GDPR):**  
This tool can be used to automatically collect data — including data that may constitute personal data under GDPR (e.g., names, email addresses, phone numbers, company contact data). The responsibility for ensuring compliance with personal data protection regulations lies solely with the person running the program. The author assumes no liability for how collected data is stored, processed, or used. Before running a task that collects personal data, ensure you have a legal basis for doing so.

This tool was created as a demonstration project for research and educational purposes.

---

## What does it do?

Imagine you have an Excel list of 200 companies, 500 product descriptions, or 100 cities to check. Normally, you open Gemini or Perplexity, type the first question, wait, copy the answer, type the second question... and so on for several hours.

AI Query Runner does it for you. You load an Excel file with a list, select an AI service, click "Run" — and the program independently goes through each row, asks the question, and enters the answer back into the same file. You can do something else in the meantime.

**A few specific examples:**

**Gathering company data.** You have a list of 300 companies from a database and want to find a short business description, industry, or contact data for each. Instead of searching for each one separately — the program queries Perplexity or DuckDuckGo for each row and saves the results in adjacent columns.

**Building a database from scratch.** You know your target customers are, for example, small hotels, dental offices, or car repair shops — and you want to reach as many as possible in selected cities. You don't have the list yet, but you can build it. You describe who you are looking for in one sentence, the generator creates a ready list of queries (separate for each city and industry), and the program searches DuckDuckGo or Google and collects names, addresses, and contacts. In the end, you have a ready spreadsheet with potential clients — instead of a week of manual searching.

**Mass-scale translations.** You have 500 product descriptions to translate into English or another language. You enter the descriptions in one column, and the ready translations appear in the column next to it — without copying, without waiting at the screen.

**Customer feedback analysis.** You have a spreadsheet with reviews from a store and want to know which ones are positive and which require a response. Each review goes to the AI, and ready ratings and topics return — straight to Excel.

**Content generation.** You have 100 products and need a description, SEO title, or social media post for each. Data from columns (name, category) is automatically pasted into the prompt — each row gets unique content.

You don't need to know how to program. The panel is operated via a browser, and if you don't know where to start with a list of questions — just describe what you want to achieve in one sentence, and the built-in generator will prepare it for you.

---

## 🚀 How to get started (step by step)

### Standard version (installation)

#### Step 1 — Installation (one-time)

**Windows:**
1. Double-click the `install.bat` file
2. Wait a few minutes — the script will install everything automatically
3. Answer the wizard's questions (service selection, limits, etc.)

**Linux / macOS:**
```bash
bash install.sh
```

#### Step 2 — Run the management panel

**Windows:** Click `start-panel.bat`  
**Linux / macOS:** `bash start-panel.sh`

The panel opens in your browser at `http://localhost:3535`.

---

### Portable version (no installation required)

1. Go to the **[Releases](../../releases)** tab in this repository
2. Download the archive for your operating system:
   - `ai-query-runner-linux-x64.zip` — Linux
   - `ai-query-runner-windows-x64.zip` — Windows
   - `ai-query-runner-macos-x64.zip` — macOS
3. Extract the archive to any folder
4. Run it:
   - **Linux / macOS:** `./ai-query-runner` in a terminal
   - **Windows:** double-click `ai-query-runner.exe`
5. The panel will open in your browser at `http://localhost:3535`

> **The portable version includes everything** — a compiled server, Playwright, and Chromium. It does not require Node.js, npm, or any additional installation. Data (settings, history, results) are saved in the same folder as the executable.

---

### Step 2a — First launch: set a password

On the first launch, the panel will redirect you to the security configuration page. You must set a password before you can use it.

1. Enter a password (minimum 8 characters) — it will be required for every login
2. Optional: configure two-factor authentication (2FA) — you scan a QR code once, then provide a 6-digit code from your phone when logging in
3. Click "Go to login"

> The password and security configuration are stored locally in the `.aqr-auth.json` file. You can change the password or enable/disable 2FA at any time from ⚙️ Settings → "Security" section.

### Step 3 — Prepare the Excel file

Click **⬇ Download template** in the panel. Enter your questions in column B.

### Step 4 — Run the task

1. Upload the Excel file to the "Excel file" field
2. Select an AI service
3. Click **▶ Run**

On the first launch of browser mode, the tool will wait for you to manually log in to the account. The session is saved — on the next run, logging in happens automatically.

> If you prefer **API mode** (faster, no browser) — go straight to the [Direct API](#direct-api--no-browser) section, enter your key in ⚙️ Settings, and select the appropriate target.

---

## How does it work?

### Browser mode

The tool controls the Chromium browser — just as a human would:

```
Your Excel file        AI Query Runner          AI Service
(list of queries) →    opens Chromium      →    gemini.google.com
                       pastes question          claude.ai
                       waits for answer         perplexity.ai
                       copies result            ...
                            ↓
                       Your Excel file
                       (filled with answers)
```

### API mode (no browser)

Queries go directly to the model via HTTPS — faster, more stable, without a Chromium window:

```
Your Excel file        AI Query Runner          API
(list of queries) →    fetch(prompt)       →    generativelanguage.googleapis.com
                       receives answer          openrouter.ai/api/v1
                            ↓                   api.groq.com/openai/v1
                       Your Excel file          api.x.ai/v1
                       (filled with answers)    localhost:11434 (Ollama)
```

---

## What does the Excel file look like?

The file must have 4 columns (header in the first row):

| A — ID | B — Prompt | C — Response | D — Status |
|--------|------------|--------------|------------|
| 1 | What is photosynthesis? | *(AI response goes here)* | *(done / error)* |
| 2 | List 5 capitals of Europe | | |
| 3 | Summarize "Quo Vadis" in 3 sentences | | |

- **B (Prompt)** — enter your questions or instructions
- **C (Response)** — the tool enters the AI response
- **D (Status)** — the tool enters `done` or `error: ...`

A row with an error does not stop the task — the tool proceeds to the next one. You can then resume with the "Skip finished" option to process only those that did not pass.

**Progressive saving** — results are saved after each row, so nothing is lost if an interruption occurs.

---

## Usage examples

### Gathering company data

Column C contains city names, the prompt uses the `{{C}}` variable:

| A | B (Prompt) | C (city) |
|---|-----------|-----------|
| 1 | Find a company producing crayons in {{C}}. Return JSON: {"name":"...","vat":"...","address":"...","email":"...","phone":"..."} | Warsaw |
| 2 | (same) | Krakow |
| 3 | (same) | Wroclaw |

With the **"Force JSON"** mode enabled, each row will be automatically split into columns:

| E — name | F — vat | G — address | H — email |
|-----------|---------|-----------|-----------|
| Crayon Co. | 5213001234 | Factory St. 1... | contact@... |

> **Note:** Data from AI models (especially tax IDs, registry numbers) require verification in official sources. For finding real companies, **Perplexity** (internet access) or **DuckDuckGo/Google API** (current data, see below) work better.

### Translating a list of texts

| A | B (Prompt) |
|---|-----------|
| 1 | Translate to English, keep the sales tone: "Eco-friendly wax crayons, 24 colors, CE certified." |
| 2 | Translate to English: "Premium watercolor set, 36 colors, 12 ml tubes." |

### Sentiment analysis of reviews

| A | B (Prompt) |
|---|-----------|
| 1 | Evaluate the review. Return JSON: {"sentiment":"positive/neutral/negative","topic":"...","score":5}. Review: "Crayons are great, vivid colors, but the box is weak." |
| 2 | (same) Review: "Not worth the price, paints dried up quickly." |

### Generating SEO descriptions

| A | B (Prompt) | C (product) | D (category) |
|---|-----------|------------|--------------|
| 1 | Write a meta description (max 155 chars) for product "{{C}}" in category "{{D}}". | Wax crayons 24 colors | Art supplies |
| 2 | (same) | Premium watercolors | Painting |

---

## JSON mode — automatic column splitting

With the **"Force JSON"** option enabled, the tool expects responses in structured format, e.g.:

```json
{"Name": "John", "City": "Warsaw", "Age": 35}
```

and automatically creates additional columns in the file:

| A | B | C (full JSON) | D | E — Name | F — City | G — Age |
|---|---|----------------|---|----------|------------|----------|
| 1 | Question | {"Name":"John",...} | done | John | Warsaw | 35 |

**JSON keys become column headers** — use the same keys in every row.

---

## Supported services

### AI models — browser control

| Service | Key | Requires account? | Notes |
|--------|-------|---------------|-------|
| `gemini` | gemini.google.com | Yes (Google) | Stable, recommended for general questions |
| `perplexity` | perplexity.ai | Optional | Internet access — good for current data |
| `claude` | claude.ai | Yes (Anthropic) | Great for long analyses and reasoning |
| `copilot` | copilot.microsoft.com | Optional | ~20 queries without account; more with Microsoft account |
| `mistral` | chat.mistral.ai | Yes (free) | European model, GDPR-friendly |
| `deepseek` | chat.deepseek.com | Yes (free) | Good for analysis and code |

### Search engines — no browser (fetch)

Faster, do not require Playwright. They return search results, not generative answers.

| Service | Key | API Key? | Limit | Notes |
|--------|-------|-----------|-------|-------|
| `duckduckgo` | — | ❌ No | None (with reasonable use) | Zero configuration, works immediately |
| `google-api` | — | ✅ Yes (free) | 100 queries/day | Google results, one-time configuration |

### Direct API — no browser

Fast, stable, perfect for large batches. Require an API key or local server.

| Service | Target | Where to get key | Notes |
|--------|--------|------------------|-------|
| **Gemini API** | `gemini-api` | [aistudio.google.com](https://aistudio.google.com) → Get API Key | Gemini via Google AI Studio — fast, free tier |
| **OpenRouter** | `openrouter` | [openrouter.ai](https://openrouter.ai) → Keys | Access to 300+ models (GPT-4o, Claude, Llama, Mistral) via one API |
| **Groq** | `groq` | [console.groq.com](https://console.groq.com) → API Keys | Llama, Mixtral and others — very fast inference |
| **xAI / Grok** | `xai` | [console.x.ai](https://console.x.ai) | Grok models from xAI |
| **Ollama** | `ollama` | Local server | Any model locally, full privacy, no limits |
| **Custom Endpoint** | `custom` | Your endpoint | Any API compatible with OpenAI (LM Studio, vLLM, Mistral, Together, etc.) |

Enter keys and configuration in ⚙️ Settings. After entering the key, click **↻** next to the model field — the tool will fetch the current list of available models.

#### Ollama configuration (local models)

Ollama allows running AI models locally — without internet access, without costs, with full data privacy.

1. Install Ollama from [ollama.com](https://ollama.com)
2. Download a model: `ollama pull llama3.2` or `ollama pull qwen2.5:7b`
3. In ⚙️ Settings → "API" tab, enter:
   - **Ollama URL:** `http://localhost:11434` (default) or the remote server address
   - **Ollama Model:** model name, e.g., `llama3.2` or `qwen2.5:7b-instruct-q4_K_M`
4. Click ↻ next to the model field — the list of available models will load automatically

#### Custom Endpoint configuration

Works with any API compatible with OpenAI `/v1/chat/completions`:

| Example | URL | Key |
|---------|-----|-------|
| LM Studio | `http://localhost:1234` | any or empty |
| vLLM | `http://localhost:8000` | any |
| Together AI | `https://api.together.xyz/v1` | Together key |
| Mistral API | `https://api.mistral.ai/v1` | Mistral key |

### Examples of effective search engine queries

Search engines (`duckduckgo`, `google-api`) return links and page snippets — they work well for finding specific websites, companies, and public documents.

**Companies in an industry in a city:**
```
crayon manufacturer Warsaw contact VAT
"crayon manufacturer" site:yellowpages.com "New York"
```

**Registration data:**
```
company "crayon production" VAT registration "SIC 3209"
"crayon manufacturer" filetype:pdf
```

**Contact verification:**
```
"Crayon Co." Warsaw email contact
"Art Supplies Inc." phone address
```

**SEO and monitoring:**
```
site:competitor.com intitle:"wax crayons"
"wax crayons 24 colors" price 2025
```

> **Variable mode in search:** If column C contains the industry and column D contains the city, the prompt `"{{C}} {{D}} contact email"` will produce a different query for each row.

**Google Search API** — one-time configuration:
1. [console.cloud.google.com](https://console.cloud.google.com) → create project → enable **Custom Search JSON API** → create API key → paste into `GOOGLE_API_KEY` field in ⚙️ Settings
2. [programmablesearchengine.google.com](https://programmablesearchengine.google.com) → create engine → select **Search the entire web** → copy engine ID to `GOOGLE_CSE_ID` in Settings

Free tier: **100 queries per day**. Above: $5 per 1,000 queries (optional).

---

## 🧠 Task Generator

Instead of manually writing dozens of prompts — describe what you want to achieve, and the AI will prepare a ready-to-use list for you.

**How it works:**
1. Click the **🧠 Task Generator** tab in the panel
2. Enter your intent in plain text, e.g.:  
   *"Find furniture manufacturing companies in the 20 largest cities in Poland. Return the name, VAT ID, address, and phone number."*
3. Select a **Target** — the service where the generated prompts will be sent (Gemini, Perplexity, Google API, etc.)
4. Select a **Generation Model** — one of: Gemini API, OpenRouter, Groq, xAI, Ollama, or Custom Endpoint (requires a key/configuration in ⚙️ Settings)
5. Click **✨ Generate prompts**
6. Review the list — you can edit every prompt directly in the table
7. Click **⬇ Download Excel** or **▶ Run task**

The model automatically adjusts the style of the prompts to the selected target — for DuckDuckGo, it generates short search phrases; for Gemini, it creates full sentences with JSON instructions; for OpenRouter, it provides detailed commands with response formatting.

> The generator needs an API key (Gemini, OpenRouter, Groq, etc.) to generate the list of prompts. The target service itself (where the list is sent) can be completely different — e.g., you can generate prompts via Groq and run them on DuckDuckGo.

### Note: Internet access and AI models

> ⚠️ **Not all models have access to the internet.** Most language models rely solely on their training data — they cannot search for real-time information. Data such as current prices, new companies, or current contact information may be outdated or inaccurate.
>
> **With internet access:** Perplexity, Gemini in browser mode, Copilot  
> **Without internet access:** Claude API, most models via OpenRouter/Groq/Ollama, Gemini API (without grounding)  
> **Always up-to-date:** DuckDuckGo, Google Search API  
>
> Always verify data via official sources.

---

## 📂 Task History

The **📂 History** tab in the panel stores all past runs — completed, stopped, and finished with errors.

- **Download results** — click the button next to any record to download an Excel file with the responses
- **Stopped tasks** — results are saved after every row, so even if stopped manually, you have access to the collected data
- History persists between server restarts

---

## ⚙️ Configuration

### Settings Panel (recommended)

Click the **⚙️** icon in the top right corner of the panel. Settings are divided into tabs:

| Tab | What you can change |
|----------|------------------|
| **General** | Query limits, delays between queries, quiet hours, retries |
| **API** | API keys: Gemini, OpenRouter, Groq, xAI, Ollama, Custom Endpoint |
| **Browser** | Headless mode, stripping Markdown formatting |
| **Google** | Google API key, CSE ID, Service Account JSON for Google Sheets |
| **Security** | Password change, enabling/disabling 2FA |

Settings are saved immediately and take effect without restarting the server (`.aqr-settings.json` file). The logout button is located in the settings window header (top right corner).

> API keys are encrypted with the **AES-256-GCM** algorithm before being saved to disk. In the panel, they are always displayed as masked (`AIza***...***xyz`) — to update a key, simply enter the new value and save.

> **Settings priority:** Panel (⚙️) > `.env` file > default values.

### `.env` file (optional)

An alternative configuration method — useful when running from the console. Open in a text editor:

```ini
TARGET_SITE=gemini          # default service (panel overrides on start)
HEADLESS=false              # false = visible window; true = runs in background
DAILY_LIMIT=150             # max. queries per day
PAUSE_MIN_MS=10000          # min. delay between queries (ms)
PAUSE_MAX_MS=20000          # max. delay
NIGHT_START=23              # quiet hours start hour
NIGHT_END=7                 # quiet hours end hour
STRIP_MARKDOWN=false        # true = removes ** ## `` from responses

# Direct API (optional)
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

# Google Sheets (optional)
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# GOOGLE_API_KEY=YOUR_KEY
# GOOGLE_CSE_ID=YOUR_CSE_ID
```

---

## How does the Google Sheets integration work?

Instead of an Excel file, you can specify a Google Sheet:

```
sheets:YOUR_SPREADSHEET_ID:Sheet1!A:D
```

- `YOUR_SPREADSHEET_ID` — Sheet ID from the URL bar (the long string)
- `Sheet1` — tab name
- `A:D` — column range

Requires configuring Google API access — see the Configuration section (Service Account JSON or API key).

---

## 💻 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|----------|
| RAM | 4 GB | 8 GB |
| CPU | 2 cores | 4+ cores |
| Disk | 1 GB | 2 GB |
| Internet | Stable connection | Broadband |

> Chromium running in the background uses approx. 300–500 MB of RAM. **API mode does not launch the browser** — a few dozen MB is sufficient.

**Operating systems:** Windows 10/11, Linux (Ubuntu 20.04+, Debian, Arch), macOS 11+

**Required software** (installed automatically by the script):
- **Node.js 18+** — runtime environment
- **Chromium** — automation browser (not needed in API mode)

**Total size after installation:** ~400–600 MB (mainly `node_modules` and Chromium)

---

## 💻 Advanced — console usage

```bash
# Create an empty Excel template
npx tsx src/main.ts --create-template my-queries.xlsx

# Run processing (browser invisible)
npx tsx src/main.ts --input my-queries.xlsx --target gemini --headless

# Test on 3 rows before full run
npx tsx src/main.ts --input my-queries.xlsx --preview

# Skip rows that already have responses (resume after break)
npx tsx src/main.ts --input my-queries.xlsx --skip-done

# Check what will be processed — without launching the browser
npx tsx src/main.ts --input my-queries.xlsx --dry-run

# A/B mode — compare Gemini and DeepSeek results in one file
npx tsx src/main.ts --input my-queries.xlsx --targets gemini,deepseek

# Export results to CSV and JSON in addition to Excel
npx tsx src/main.ts --input my-queries.xlsx --export csv,json

# Direct API — Gemini API
npx tsx src/main.ts --input my-queries.xlsx --target gemini-api

# Direct API — Groq
npx tsx src/main.ts --input my-queries.xlsx --target groq

# Local models — Ollama
npx tsx src/main.ts --input my-queries.xlsx --target ollama

# System prompt for every query
npx tsx src/main.ts --input my-queries.xlsx --target groq --system-prompt "Answer concisely, in English."
```

### `{{column}}` variables in prompts

| Syntax | Meaning |
|-------|-----------|
| `{{C}}` | Value of column C in the given row |
| `{{D}}` | Value of column D |
| `{{B}}` | Prompt content (column B) — rarely needed |

**Example:** Prompt `"Translate '{{B}}' into {{C}}"` where B=`"cat"` and C=`"French"` will send: `"Translate 'cat' into French"`.

### All CLI options

| Option | Description |
|-------|------|
| `--target <name>` | Service: `gemini` `perplexity` `claude` `copilot` `mistral` `deepseek` `google` `google-api` `duckduckgo` `gemini-api` `openrouter` `groq` `xai` `ollama` `custom` |
| `--targets <list>` | A/B mode: several services separated by commas, e.g., `gemini,deepseek` |
| `--headless` | Browser in background (invisible) |
| `--preview` | Test on the first 3 rows |
| `--strip-markdown` | Removes `**`, `##`, `` ` `` from responses |
| `--system-prompt <text>` | Instruction attached to every query |
| `--json-format` | Forces JSON response and parses it into columns |
| `--export <formats>` | `csv`, `json` or `csv,json` |
| `--skip-done` | Skips rows with `done` status |
| `--limit <n>` | Processes a maximum of N rows |
| `--dry-run` | Shows what will be processed, does not launch the browser |
| `--sch-start <0-23>` | Start hour of operation |
| `--sch-end <0-23>` | End hour of operation |
| `--sch-days <days>` | Days of the week: `1,2,3,4,5` = Mon–Fri |
| `--pause-min <s>` | Minimum delay (seconds) |
| `--pause-max <s>` | Maximum delay (seconds) |

---

## ❓ Frequently Asked Questions

**"Waiting for manual login" — what to do?**  
The tool has opened the browser and is waiting for you to log in. Go to the Chromium window and log in. The session will be saved.

**Browser won't open (Linux)?**  
Check if an X server is running (`echo $DISPLAY`). You can also install the browser manually: `npx playwright install chromium`

**Responses end with a "TIMEOUT" error?**  
The AI service is overloaded or has detected automation. Increase `PAUSE_MIN_MS` and try again in a few minutes.

**Account blocked?**  
Decrease `DAILY_LIMIT`, lengthen delays, and enable the schedule. Consider switching to API mode (`groq`, `gemini-api`, or `openrouter`).

**Panel is inaccessible after launch?**  
Port 3535 might be in use. Change in `.env`: `BRIDGE_PORT=3536`.

**Generator returns no results?**  
Check if the API key is entered in ⚙️ Settings. The generator supports: Gemini API, OpenRouter, Groq, xAI, Ollama, and Custom Endpoint.

**Ollama — "fetch failed" or timeout?**  
Check if the Ollama server is running (`ollama serve`) and if the provided URL is correct. Thinking models (e.g., qwen3) may need more time — timeout is set to 120 seconds.

**Panel redirects to the login page?**  
This is normal — the panel is password-protected. Log in with the credentials set during initial configuration. If you forgot your password, delete the `.aqr-auth.json` file from the project folder — the panel will return to the configuration step, allowing you to set a new password.

**I don't have access to my 2FA code (lost my phone)?**  
Delete the `.aqr-auth.json` file and go through the configuration again. This will reset the password and disable 2FA.

---

## 🔧 Extension and Integrations

The project is modularly built — adding a new service is a matter of one file and a few lines of registration.

### Integrations ready to add

| Service | Benefit | API Key | Free tier |
|--------|---------|-----------|-----------|
| **Tavily** | Search engine optimized for AI — extracted content fragments, not raw links | [app.tavily.com](https://app.tavily.com) | 1,000 queries/mo. |
| **Brave Search API** | Brave's own index (not Google), good result quality | [api.search.brave.com](https://api.search.brave.com) | 2,000 queries/mo. |
| **Serper.dev** | Actual Google results without Google Cloud configuration | [serper.dev](https://serper.dev) | 2,500 credits to start |
| **Exa.ai** | Semantic search — searches by meaning, good for research | [exa.ai](https://exa.ai) | 1,000 queries/mo. |
| **SearXNG** | Self-hosted meta-search engine aggregating Google, Bing, DuckDuckGo — zero limits, full privacy | Public instances: [searx.space](https://searx.space) | Free |

### How to add your own target — 4 steps

Using Tavily as an example:

**Step 1 — `src/api/TavilyApi.ts`:**
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

**Step 2 — register in `src/main.ts`:**
```typescript
} else if (config.targetSite === 'tavily') {
  const { queryTavily } = await import('./api/TavilyApi.js');
  executeQuery = (prompt) => queryTavily(prompt, config.tavilyApiKey!);
}
```

**Step 3 — add the key to `src/config/config.ts`:**
```typescript
tavilyApiKey: process.env['TAVILY_API_KEY'] ?? null,
```

**Step 4 — add to the list in `src/server.ts`:**
```typescript
const VALID_TARGETS = [..., 'tavily'];
```

The new target will appear as an option in the panel.

---

## 🔒 Security

### Panel access

The panel is password-protected. On the first run, you set a password via a wizard — without this, the panel is inaccessible. Optionally, you can enable two-factor authentication (2FA): for every login, you enter your password and a 6-digit code from your phone app (Google Authenticator, Authy, or any app supporting TOTP).

**Technical details:**
- Password stored as a bcrypt hash (cost 12) — it is impossible to read from the file
- Session valid for 8 hours, `HttpOnly` + `SameSite=Strict` cookie — inaccessible to JS scripts
- CSRF token required for every data-modifying request — blocks attacks from external sites
- Rate limiting: 10 failed login attempts per 15 minutes from a single IP address

### API key protection

All API keys are encrypted with the **AES-256-GCM** algorithm before being saved to disk. In the panel, they are displayed strictly as masked (`AIza***...***xyz`) — the full value never leaves the server. To update a key, just enter the new value and click "Save".

### Data collected by the tool

- AI responses and Excel files are stored locally on your computer/server — they are never sent anywhere automatically
- Files can only be downloaded via the logged-in panel — they are not available as public links
- Browser sessions (AI service cookies) stored locally:
  - Linux/macOS: `~/.config/ai-query-runner/browser-profile/<service>/`
  - Windows: `%APPDATA%\ai-query-runner\browser-profile\<service>\`

### Configuration on VPS

If you are running the panel on a remote server, it is recommended to place it behind a reverse proxy (nginx, Caddy) with an HTTPS certificate. By default, the panel only listens on `127.0.0.1` — for remote access, the proxy must be configured on the server side. **Do not expose port 3535 directly to the internet without HTTPS.**

The `.aqr-auth.json` file contains security configuration — **do not include it in a git repository** and do not share it with anyone. The same applies to `.env` and `.aqr-settings.json`.
