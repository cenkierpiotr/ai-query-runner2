import type { BrowserTarget } from '../BrowserTarget.js';

export class OpenWebUITarget implements BrowserTarget {
  readonly name = 'Open WebUI';
  private readonly baseUrl: string;
  private readonly RESPONSE_TIMEOUT = 120_000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  getFreshChatUrl(): string {
    return `${this.baseUrl}/`;
  }

  async isSessionActive(page: any): Promise<boolean> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login') || url.includes('/sign-in')) return false;
    return await page.locator('#chat-textarea, [data-testid="chat-textarea"]').count().catch(() => 0) > 0;
  }

  async waitForInput(page: any): Promise<void> {
    await page.waitForSelector('#chat-textarea, [data-testid="chat-textarea"]', { timeout: 30_000 });
  }

  async submitPrompt(page: any, prompt: string): Promise<void> {
    // Navigate to a fresh chat — Open WebUI creates a new conversation on /
    await page.goto(this.getFreshChatUrl(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(800);

    const inputSel = '#chat-textarea, [data-testid="chat-textarea"]';
    await page.waitForSelector(inputSel, { timeout: 20_000 });
    const input = page.locator(inputSel).first();
    await input.click();
    await page.waitForTimeout(300);

    // fill() handles multiline prompts correctly
    await input.fill(prompt);
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
  }

  responseSelector(): string {
    return [
      // v0.4+ — role attribute on message wrapper
      '[data-message-role="assistant"] .prose',
      '[data-message-role="assistant"] .content',
      // v0.3.x — class-based
      '.message.assistant .prose',
      '.message-content.assistant',
      // generic markdown container fallback
      '.chat-messages .prose:last-of-type',
    ].join(', ');
  }

  async extractResponse(page: any): Promise<string> {
    const sel = this.responseSelector();

    // Wait for at least one response element
    try {
      await page.waitForSelector(sel, { timeout: 30_000 });
    } catch {
      await page.waitForTimeout(3000);
    }

    const deadline = Date.now() + this.RESPONSE_TIMEOUT;
    let lastText = '';
    let stableFor = 0;

    while (Date.now() < deadline) {
      await page.waitForTimeout(1200);

      // Open WebUI shows a "stop" button while generating
      const isGenerating = await page.locator(
        'button[aria-label="Stop"], button[title="Stop"], [data-testid="stop-button"], button svg.animate-spin'
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
