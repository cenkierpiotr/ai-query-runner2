/**
 * DuckDuckGoApi — scraping wyników wyszukiwania DuckDuckGo
 *
 * Nie wymaga klucza API ani konta. Używa html.duckduckgo.com/html/
 * — uproszczonej wersji DDG zwracającej czysty HTML.
 *
 * Ograniczenia:
 *   - DDG może blokować zbyt częste zapytania (zalecana przerwa ≥ 5s)
 *   - Brak AI Overview / brak cytatów źródłowych
 *   - Wyniki mogą różnić się od pełnego wyszukiwania Google
 */

const ENDPOINT     = 'https://html.duckduckgo.com/html/';
const RESULTS_LIMIT = 5;

function decodeHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function duckDuckGoSearch(query: string): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
    },
    body: new URLSearchParams({ q: query, b: '' }).toString(),
  });

  const html   = await res.text();
  const status = res.status;

  // 202 + anomaly-modal = DuckDuckGo CAPTCHA / bot-detection challenge
  if (status === 202 || html.includes('anomaly-modal')) {
    throw new Error(
      'DuckDuckGo blocked this request (bot detection / CAPTCHA).\n' +
      'This can happen on server or VPN environments. Options:\n' +
      '  1. Try again from a regular home/office network\n' +
      '  2. Increase PAUSE_MIN_MS to 15000+ in .env\n' +
      '  3. Switch to "google-api" target (requires free API key)'
    );
  }

  if (!res.ok) throw new Error(`DuckDuckGo returned HTTP ${status}`);

  const titles   = [...html.matchAll(/class="result__a"[^>]*>([\s\S]*?)<\/a>/g)].map(m => decodeHtml(m[1]!));
  const snippets = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)].map(m => decodeHtml(m[1]!));

  if (titles.length === 0) return 'No results found.';

  return titles.slice(0, RESULTS_LIMIT)
    .map((title, i) => {
      const snippet = snippets[i] ? `\n${snippets[i]}` : '';
      return `[${i + 1}] ${title}${snippet}`;
    })
    .join('\n\n');
}
