/**
 * BrowserTarget interface
 *
 * Each AI site (Gemini, Perplexity, Claude, Google) implements this interface.
 * BrowserBridge calls the appropriate target based on config.
 */

export interface BrowserTarget {
  /** Human-readable name for logging */
  readonly name: string;

  /**
   * Called once after the page navigates to the target URL.
   * Should wait until the input area is available.
   * Returns true if session is active (logged in), false if login required.
   */
  isSessionActive(page: any): Promise<boolean>;

  /**
   * URL to navigate to for a fresh chat / new query.
   */
  getFreshChatUrl(): string;

  /**
   * Wait until the input box is present and ready.
   */
  waitForInput(page: any): Promise<void>;

  /**
   * Type the prompt into the input area and submit it.
   */
  submitPrompt(page: any, prompt: string): Promise<void>;

  /**
   * Wait for the response to appear and stabilize, then return the full text.
   */
  extractResponse(page: any): Promise<string>;

  /**
   * Selector(s) used to detect that a response has appeared.
   */
  responseSelector(): string;
}
