/**
 * GeminiTarget — manages Playwright interactions with gemini.google.com
 */

import type { BrowserTarget } from '../BrowserTarget.js';

export class GeminiTarget implements BrowserTarget {
  readonly name = 'Gemini';
  private readonly baseUrl = 'https://gemini.google.com/app';
  private readonly RESPONSE_TIMEOUT = 90_000;

  getFreshChatUrl(): string {
    return `${this.baseUrl}?t=${Date.now()}`;
  }

  async isSessionActive(page: any): Promise<boolean> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const count = await page.locator('rich-textarea').count().catch(() => 0);
    return count > 0;
  }

  async waitForInput(page: any): Promise<void> {
    await page.waitForSelector('rich-textarea', { timeout: 30_000 });
  }

  async submitPrompt(page: any, prompt: string): Promise<void> {
    // Navigate to fresh chat to avoid context accumulation
    await page.goto(this.getFreshChatUrl(), { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(
      () => page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    );
    await this._dismissDialogs(page);
    await page.waitForSelector('rich-textarea', { timeout: 30_000 });
    await page.locator('rich-textarea').click();
    await page.waitForTimeout(500);

    // Inject text via DOM (avoids paste issues with long prompts)
    await page.evaluate((text: string) => {
      const el = document.querySelector<HTMLElement>(
        'rich-textarea [contenteditable="true"], rich-textarea .ql-editor'
      );
      if (!el) return;
      el.focus();
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }, prompt);

    await page.waitForTimeout(800);
    await page.keyboard.press('Enter');
  }

  responseSelector(): string {
    return 'model-response, .model-response-text, [data-response-container], .response-content';
  }

  async extractResponse(page: any): Promise<string> {
    const selector = this.responseSelector();

    // Wait for first response element to appear
    await page.waitForSelector(selector, { timeout: 120_000 });

    // Stability polling: wait until text stops changing
    const deadline = Date.now() + this.RESPONSE_TIMEOUT;
    let lastText = '';
    let stableFor = 0;

    while (Date.now() < deadline) {
      await page.waitForTimeout(1200);
      const count = await page.locator(selector).count().catch(() => 0);
      if (!count) continue;

      const currentText: string = await page.locator(selector).last()
        .evaluate((el: Element) => {
          const root: Node = (el as any).shadowRoot ?? el;
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const parts: string[] = [];
          let node: Text | null;
          while ((node = walker.nextNode() as Text | null)) {
            const parent = node.parentElement;
            if (parent && (
              parent.getAttribute('aria-hidden') === 'true' ||
              parent.classList.contains('sr-only') ||
              parent.classList.contains('visually-hidden')
            )) continue;
            const t = (node.textContent || '').trim();
            if (t.length > 1) parts.push(t);
          }
          return parts.join('\n');
        }).catch(() => '');

      if (currentText && currentText === lastText) {
        stableFor++;
        const trimmed = currentText.trimEnd();
        if ((trimmed.endsWith(']') || trimmed.endsWith('```')) && stableFor >= 1) return currentText;
        if (stableFor >= 3) return currentText;
      } else {
        stableFor = 0;
        lastText = currentText;
      }
    }
    return lastText || 'TIMEOUT';
  }

  private async _dismissDialogs(page: any): Promise<void> {
    const selectors = [
      'button[data-dismiss]', 'button[aria-label="Close"]', 'button[aria-label="Zamknij"]',
      '.dismiss-button', 'mat-dialog-container button:last-child',
      '[data-testid="close-button"]', 'button.close-button',
    ];
    for (const sel of selectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 500 })) {
          await btn.click();
          await page.waitForTimeout(400);
        }
      } catch {}
    }
    try { await page.keyboard.press('Escape'); await page.waitForTimeout(300); } catch {}
  }
}
