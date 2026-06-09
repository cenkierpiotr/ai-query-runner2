/**
 * DeepSeekTarget — chat.deepseek.com
 *
 * Wymaga konta DeepSeek (darmowe). Dobry do zadań analitycznych i kodu.
 * Model DeepSeek-V3 / R1 dostępny bezpłatnie przez interfejs webowy.
 */

import type { BrowserTarget } from '../BrowserTarget.js';

export class DeepSeekTarget implements BrowserTarget {
  readonly name = 'DeepSeek';
  private readonly baseUrl = 'https://chat.deepseek.com';
  private readonly RESPONSE_TIMEOUT = 120_000;

  getFreshChatUrl(): string {
    return this.baseUrl;
  }

  async isSessionActive(page: any): Promise<boolean> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const url = page.url();
    if (url.includes('/login') || url.includes('/sign-in') || url.includes('/auth')) return false;
    // DeepSeek shows textarea in chat after login
    const count = await page.locator('textarea, div[contenteditable="true"]').count().catch(() => 0);
    return count > 0;
  }

  async waitForInput(page: any): Promise<void> {
    await page.waitForSelector('textarea, div[contenteditable="true"]', { timeout: 60_000 });
  }

  async submitPrompt(page: any, prompt: string): Promise<void> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // DeepSeek uses textarea for input
    const inputSel = 'textarea#chat-input, textarea[placeholder], textarea';
    await page.waitForSelector(inputSel, { timeout: 20_000 });
    const input = page.locator(inputSel).first();
    await input.click();
    await page.waitForTimeout(400);
    await input.fill(prompt);
    await page.waitForTimeout(600);

    // Try submit button first, fallback to Enter
    try {
      const btn = page.locator('button[aria-label*="Send"], button[type="submit"]').first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        return;
      }
    } catch {}
    await page.keyboard.press('Enter');
  }

  responseSelector(): string {
    return [
      // DeepSeek uses ds-markdown class for rendered responses
      'div[class*="ds-markdown"]',
      'div[class*="markdown-body"]',
      // Generic assistant message containers
      '[class*="assistant"][class*="message"]',
      '[data-role="assistant"]',
      '.prose',
    ].join(', ');
  }

  async extractResponse(page: any): Promise<string> {
    const sel = this.responseSelector();
    try {
      await page.waitForSelector(sel, { timeout: 30_000 });
    } catch {
      await page.waitForTimeout(5000);
    }

    const deadline = Date.now() + this.RESPONSE_TIMEOUT;
    let lastText = '';
    let stableFor = 0;

    while (Date.now() < deadline) {
      await page.waitForTimeout(1500);

      // DeepSeek shows stop button or typing indicator while generating
      const isGenerating = await page.locator(
        'button[aria-label*="Stop"], div[class*="loading"], div[class*="thinking"], svg[class*="spin"]'
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
