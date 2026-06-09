export async function queryOpenRouter(
  prompt: string,
  apiKey: string,
  model = 'google/gemini-2.0-flash-exp:free',
  systemPrompt?: string,
): Promise<string> {
  const messages: object[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/cenkierpiotr/ai-query-runner',
      'X-Title': 'AI Query Runner',
    },
    body:   JSON.stringify({ model, messages }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `OpenRouter error ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}
