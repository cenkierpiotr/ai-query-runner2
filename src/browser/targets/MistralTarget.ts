/**
 * MistralTarget — chat.mistral.ai (Le Chat)
 *
 * Wymaga konta Mistral (darmowe na mistral.ai).
 * Europejski model AI, GDPR-friendly, brak agresywnego wykrywania botów.
 */

import type { BrowserTarget } from '../BrowserTarget.js';

export class MistralTarget implements BrowserTarget {
  readonly name = 'Mistral';
  private readonly baseUrl = 'https://chat.mistral.ai';
  private readonly RESPONSE_TIMEOUT = 120_000;

  getFreshChatUrl(): string {
    return `${this.baseUrl}/chat`;
  }

  async isSessionActive(page: any): Promise<boolean> {
    await page.goto(this.getFreshChatUrl(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const url = page.url();
    // Redirects to /auth/... if not logged in
    if (url.includes('/auth') || url.includes('/login') || url.includes('/sign-in')) return false;
    const count = await page.locator('textarea, div[contenteditable="true"]').count().catch(() => 0);
    return count > 0;
  }

  async waitForInput(page: any): Promise<void> {
    await page.waitForSelector('textarea, div[contenteditable="true"]', { timeout: 60_000 });
  }

  async submitPrompt(page: any, prompt: string): Promise<void> {
    await page.goto(this.getFreshChatUrl(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1500);

    const inputSel = 'textarea, div[contenteditable="true"][role="textbox"]';
    await page.waitForSelector(inputSel, { timeout: 20_000 });
    const input = page.locator(inputSel).first();
    await input.click();
    await page.waitForTimeout(400);
    await input.fill(prompt);
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter');
  }

  responseSelector(): string {
    return [
      '[class*="BotMessage"]',
      '[data-role="assistant"]',
      '[class*="assistant-message"]',
      'div[class*="message"][class*="bot"]',
      'div[class*="response"]',
      // Fallback: generic prose
      '.prose, [class*="markdown"]',
    ].join(', ');
  }

  async extractResponse(page: any): Promise<string> {
    const sel = this.responseSelector();
    try {
      await page.waitForSelector(sel, { timeout: 30_000 });
    } catch {
      await page.waitForTimeout(4000);
    }

    const deadline = Date.now() + this.RESPONSE_TIMEOUT;
    let lastText = '';
    let stableFor = 0;

    while (Date.now() < deadline) {
      await page.waitForTimeout(1500);

      // Mistral shows a stop button while generating
      const isGenerating = await page.locator(
        'button[aria-label*="Stop"], button[aria-label*="Zatrzymaj"], [class*="stop-button"], svg[class*="spinner"]'
      ).count().catch(() => 0);

      const elements = page.locator(sel);
      const count = await elements.count().catch(() => 0);
      if (!count) { stableFor = 0; lastText = ''; continue; }

      const currentText: string = await elements.last().innerText().catch(() => '');

      if (currentText && currentText === lastText && !isGenerating) {
        stableFor++;
        if (stableFor >= 2) return currentText.trim();
      } else {
        stableFor = 0;
        lastText = currentText;
      }
    }
    return lastText.trim() || 'TIMEOUT';
  }
}
