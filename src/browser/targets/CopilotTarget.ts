/**
 * CopilotTarget — copilot.microsoft.com
 *
 * Działa z kontem Microsoft (darmowe) lub bez logowania (limit ~20 zapytań/sesję).
 * Tryb "Creative / Balanced / Precise" — używamy domyślnego.
 */

import type { BrowserTarget } from '../BrowserTarget.js';

export class CopilotTarget implements BrowserTarget {
  readonly name = 'Copilot';
  private readonly baseUrl = 'https://copilot.microsoft.com';
  private readonly RESPONSE_TIMEOUT = 90_000;

  getFreshChatUrl(): string {
    return this.baseUrl;
  }

  async isSessionActive(page: any): Promise<boolean> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const count = await page.locator(
      'textarea, div[contenteditable="true"], [data-testid="composer-input"]'
    ).count().catch(() => 0);
    return count > 0;
  }

  async waitForInput(page: any): Promise<void> {
    await page.waitForSelector(
      'textarea, div[contenteditable="true"], [data-testid="composer-input"]',
      { timeout: 60_000 }
    );
  }

  async submitPrompt(page: any, prompt: string): Promise<void> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Dismiss any cookie/welcome dialogs
    for (const sel of ['button[data-bi-id*="dismiss"]', 'button[aria-label*="Close"]', 'button[aria-label*="Zamknij"]']) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 600 })) {
          await btn.click();
          await page.waitForTimeout(400);
        }
      } catch {}
    }

    const inputSel = 'textarea, div[contenteditable="true"][role="textbox"], [data-testid="composer-input"]';
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
      '[data-testid="message-content"]',
      '[class*="assistant"] [class*="message"]',
      'div[class*="ac-textBlock"]',
      '.cib-chat-turn[data-testid*="response"]',
      '[class*="responseText"]',
      'cib-message-group[source="bot"] cib-message',
    ].join(', ');
  }

  async extractResponse(page: any): Promise<string> {
    // Wait for any response element to appear
    const sel = this.responseSelector();
    try {
      await page.waitForSelector(sel, { timeout: 30_000 });
    } catch {
      // Fallback — wait for any new content
      await page.waitForTimeout(5000);
    }

    const deadline = Date.now() + this.RESPONSE_TIMEOUT;
    let lastText = '';
    let stableFor = 0;

    while (Date.now() < deadline) {
      await page.waitForTimeout(1500);

      // Copilot shows a stop/pause button while generating
      const isGenerating = await page.locator(
        '[aria-label*="Stop"], button[data-testid*="stop"], [class*="stop-generating"]'
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
