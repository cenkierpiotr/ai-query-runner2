/**
 * GoogleTarget — google.com (AI Overview / regular search)
 *
 * Note: Google Search returns SERP results, not a single "answer".
 * This target collects the AI Overview (jeśli dostępny) + top snippet texts.
 */

import type { BrowserTarget } from '../BrowserTarget.js';

export class GoogleTarget implements BrowserTarget {
  readonly name = 'Google';
  private readonly baseUrl = 'https://www.google.com';
  private readonly RESPONSE_TIMEOUT = 60_000;

  getFreshChatUrl(): string {
    return this.baseUrl;
  }

  async isSessionActive(page: any): Promise<boolean> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Google Search works without login — ready as soon as the search form appears
    const inputCount = await page.locator('textarea[name="q"], input[name="q"]').count().catch(() => 0);
    return inputCount > 0;
  }

  async waitForInput(page: any): Promise<void> {
    await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 30_000 });
  }

  async submitPrompt(page: any, prompt: string): Promise<void> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(800);

    const inputSelector = 'textarea[name="q"], input[name="q"]';
    await page.waitForSelector(inputSelector, { timeout: 15_000 });
    await page.locator(inputSelector).first().click();
    await page.waitForTimeout(300);
    await page.locator(inputSelector).first().fill(prompt);
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
  }

  responseSelector(): string {
    // AI Overview selector, fallback to featured snippet and organic results
    return [
      '[data-attrid="wa:/description"]',       // AI Overview main text
      '.Cp4S5b .VkpGBb',                        // AI Overview block
      '.hgKElc',                                 // Featured snippet box
      '.IZ6rdc',                                 // Featured snippet text
      'div[data-sncf="1"]',                      // Knowledge panel
      '.kno-rdesc span',                         // Knowledge panel description
      '.r025kc',                                 // Generative AI answer
    ].join(', ');
  }

  async extractResponse(page: any): Promise<string> {
    const deadline = Date.now() + this.RESPONSE_TIMEOUT;

    // Wait for results to load
    await page.waitForSelector('#search, #rcnt', { timeout: 30_000 });
    await page.waitForTimeout(2000); // let AI overview render

    while (Date.now() < deadline) {
      await page.waitForTimeout(1000);

      // Try AI Overview first
      const aiOverviewText = await page.locator('[data-attrid="wa:/description"] span, .Cp4S5b').first()
        .innerText().catch(() => '');

      if (aiOverviewText && aiOverviewText.length > 30) {
        return `[AI Overview]\n${aiOverviewText.trim()}`;
      }

      // Fallback: featured snippet
      const snippetText = await page.locator('.hgKElc, .IZ6rdc').first()
        .innerText().catch(() => '');

      if (snippetText && snippetText.length > 20) {
        return `[Featured Snippet]\n${snippetText.trim()}`;
      }

      // Fallback: first 3 organic result titles + snippets
      const results = await page.locator('.g').all().catch(() => []);
      const parts: string[] = [];
      for (const result of results.slice(0, 3)) {
        const title = await result.locator('h3').innerText().catch(() => '');
        const snippet = await result.locator('.VwiC3b, .s3v9rd').innerText().catch(() => '');
        if (title) parts.push(`${title}${snippet ? '\n' + snippet : ''}`);
      }
      if (parts.length > 0) {
        return `[Search Results]\n${parts.join('\n\n')}`;
      }
    }
    return 'TIMEOUT';
  }
}
