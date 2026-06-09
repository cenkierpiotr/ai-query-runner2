export async function queryOllama(
  prompt: string,
  model = 'llama3.2',
  systemPrompt?: string,
  baseUrl = 'http://localhost:11434',
): Promise<string> {
  const messages: object[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const url = `${baseUrl.replace(/\/$/, '')}/api/chat`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model, messages, stream: false }),
    signal:  AbortSignal.timeout(120000),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Ollama error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.message?.content ?? '';
}

export async function listOllamaModels(baseUrl = 'http://localhost:11434'): Promise<string[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/tags`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return (data?.models ?? []).map((m: any) => m.name as string);
}
