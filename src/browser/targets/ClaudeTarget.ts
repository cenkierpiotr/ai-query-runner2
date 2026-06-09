/**
 * ClaudeTarget — claude.ai
 */

import type { BrowserTarget } from '../BrowserTarget.js';

export class ClaudeTarget implements BrowserTarget {
  readonly name = 'Claude';
  private readonly baseUrl = 'https://claude.ai';
  private readonly newChatUrl = 'https://claude.ai/new';
  private readonly RESPONSE_TIMEOUT = 120_000;

  getFreshChatUrl(): string {
    return this.newChatUrl;
  }

  async isSessionActive(page: any): Promise<boolean> {
    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // If session active, redirects to /chats; if not, shows login
    const url = page.url();
    return url.includes('/chat') || url.includes('/new') || url.includes('/chats');
  }

  async waitForInput(page: any): Promise<void> {
    await page.waitForSelector(
      '[contenteditable="true"][data-testid="chat-input"], div[contenteditable="true"].ProseMirror, div[contenteditable="true"]',
      { timeout: 30_000 }
    );
  }

  async submitPrompt(page: any, prompt: string): Promise<void> {
    await page.goto(this.newChatUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1500);

    const inputSelector = 'div[contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 30_000 });
    await page.locator(inputSelector).first().click();
    await page.waitForTimeout(400);

    // Claude uses contenteditable div — type via clipboard to preserve formatting
    await page.locator(inputSelector).first().fill(prompt);
    await page.waitForTimeout(600);

    // Submit via Enter (Claude doesn't use Shift+Enter for submit)
    await page.keyboard.press('Enter');
  }

  responseSelector(): string {
    return '[data-testid="conversation-turn-content"], .font-claude-message, [class*="message-content"], .prose';
  }

  async extractResponse(page: any): Promise<string> {
    const selector = this.responseSelector();
    await page.waitForSelector(selector, { timeout: 120_000 });

    const deadline = Date.now() + this.RESPONSE_TIMEOUT;
    let lastText = '';
    let stableFor = 0;

    while (Date.now() < deadline) {
      await page.waitForTimeout(1500);

      // Claude shows a stop button while generating
      const isGenerating = await page.locator('button[aria-label*="Stop"], button[data-testid="stop-button"]')
        .count().catch(() => 0);

      // Get all response turns, take the last one (most recent assistant message)
      const elements = page.locator(selector);
      const count = await elements.count().catch(() => 0);
      if (!count) continue;

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
