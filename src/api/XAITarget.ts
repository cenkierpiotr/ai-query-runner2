import { queryCustomEndpoint } from './CustomEndpointTarget.js';

const XAI_BASE_URL  = 'https://api.x.ai/v1';
const DEFAULT_MODEL  = 'grok-3-mini';

export async function queryXAI(
  prompt: string,
  apiKey: string,
  model = DEFAULT_MODEL,
  systemPrompt?: string,
): Promise<string> {
  return queryCustomEndpoint(prompt, XAI_BASE_URL, apiKey, model, systemPrompt);
}
