import { queryCustomEndpoint } from './CustomEndpointTarget.js';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL  = 'llama-3.3-70b-versatile';

export async function queryGroq(
  prompt: string,
  apiKey: string,
  model = DEFAULT_MODEL,
  systemPrompt?: string,
): Promise<string> {
  return queryCustomEndpoint(prompt, GROQ_BASE_URL, apiKey, model, systemPrompt);
}
