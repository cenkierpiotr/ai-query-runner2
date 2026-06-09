/**
 * PerplexityTarget — perplexity.ai
 */

import type { BrowserTarget } from '../BrowserTarget.js';

export class PerplexityTarget implements BrowserTarget {
  readonly name = 'Perplexity';
  private readonly baseUrl = 'https://www.perplexity.ai';
  private readonly RESPONSE_TIMEOUT = 90_000;

  getFreshChatUrl(): string {
    return this.baseUrl;
  }

  async isSessionActive(page: any): Promise<boolean> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Perplexity shows the input even when logged out, check for user avatar/account
    const inputCount = await page.locator('textarea').count().catch(() => 0);
    return inputCount > 0;
  }

  async waitForInput(page: any): Promise<void> {
    await page.waitForSelector('textarea', { timeout: 30_000 });
  }

  async submitPrompt(page: any, prompt: string): Promise<void> {
    // Navigate to home for fresh conversation
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1500);

    const inputSelector = 'textarea[placeholder], textarea';
    await page.waitForSelector(inputSelector, { timeout: 30_000 });
    await page.locator(inputSelector).first().click();
    await page.waitForTimeout(400);
    await page.locator(inputSelector).first().fill(prompt);
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter');
  }

  private _cleanResponse(text: string): string {
    return text
      .trim()
      .replace(/\[\d+\]/g, '')      // strip inline citation markers [1], [2], etc.
      .replace(/\s{3,}/g, '\n\n')   // collapse excessive blank lines
      .trim();
  }

  responseSelector(): string {
    // Perplexity wraps answers in .prose blocks or [data-testid="answer"]
    return '[data-testid="answer"], .prose, .answer-text, .response-content, [class*="answer"]';
  }

  async extractResponse(page: any): Promise<string> {
    const selector = this.responseSelector();
    await page.waitForSelector(selector, { timeout: 120_000 });

    const deadline = Date.now() + this.RESPONSE_TIMEOUT;
    let lastText = '';
    let stableFor = 0;

    while (Date.now() < deadline) {
      await page.waitForTimeout(1500);

      // Check if still generating (spinning indicator)
      const isGenerating = await page.locator('[aria-label*="loading"], [class*="spinner"], [class*="loading"]')
        .count().catch(() => 0);

      const currentText: string = await page.locator(selector).last()
        .innerText().catch(() => '');

      if (currentText && currentText === lastText && !isGenerating) {
        stableFor++;
        if (stableFor >= 2) return this._cleanResponse(currentText);
      } else {
        stableFor = 0;
        lastText = currentText;
      }
    }
    return this._cleanResponse(lastText) || 'TIMEOUT';
  }
}
