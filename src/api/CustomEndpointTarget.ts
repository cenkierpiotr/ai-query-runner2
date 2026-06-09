/**
 * Universal OpenAI-compatible endpoint client.
 * Works with: Anthropic (via openai-compat), Mistral, Together, Groq,
 * local LM Studio, vLLM, llama.cpp server, and any other OpenAI-compatible API.
 */
export async function queryCustomEndpoint(
  prompt: string,
  endpointUrl: string,
  apiKey: string | undefined,
  model: string | undefined,
  systemPrompt?: string,
): Promise<string> {
  const messages: object[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const url = endpointUrl.replace(/\/$/, '');
  const finalUrl = url.endsWith('/chat/completions') ? url : `${url}/chat/completions`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(finalUrl, {
    method:  'POST',
    headers,
    body:    JSON.stringify({ model, messages }),
    signal:  AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message ?? `Custom endpoint error ${res.status}`);
  }
  const data = await res.json() as any;
  return data?.choices?.[0]?.message?.content ?? '';
}
