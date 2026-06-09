/**
 * GoogleSearchApi — Google Custom Search JSON API (no browser required)
 *
 * Requires:
 *   GOOGLE_API_KEY  — Google Cloud API key with Custom Search API enabled
 *   GOOGLE_CSE_ID   — Programmable Search Engine ID (cx parameter)
 *
 * Free tier: 100 queries/day. Setup: console.cloud.google.com
 *
 * Returns top results formatted as plain text ready to store in Excel.
 */

const SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';
const RESULTS_COUNT = 5;

interface CseItem {
  title:   string;
  snippet: string;
  link:    string;
}

interface CseResponse {
  items?: CseItem[];
  error?: { message: string; code: number };
}

export async function googleCustomSearch(query: string): Promise<string> {
  const apiKey = process.env['GOOGLE_API_KEY'];
  const cseId  = process.env['GOOGLE_CSE_ID'];

  if (!apiKey || !cseId) {
    throw new Error(
      'google-api target requires GOOGLE_API_KEY and GOOGLE_CSE_ID in .env\n' +
      'Setup guide:\n' +
      '  1. Enable "Custom Search JSON API" at console.cloud.google.com\n' +
      '  2. Create a Programmable Search Engine at programmablesearchengine.google.com\n' +
      '  3. Add GOOGLE_API_KEY and GOOGLE_CSE_ID to your .env file'
    );
  }

  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set('q',   query);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx',  cseId);
  url.searchParams.set('num', String(RESULTS_COUNT));

  const res = await fetch(url.toString());
  const data: CseResponse = await res.json();

  if (!res.ok) {
    throw new Error(`Google Search API ${res.status}: ${data.error?.message ?? res.statusText}`);
  }

  if (!data.items || data.items.length === 0) {
    return 'No results found.';
  }

  return data.items
    .map((item, i) => `[${i + 1}] ${item.title}\n${item.snippet}\n${item.link}`)
    .join('\n\n');
}
