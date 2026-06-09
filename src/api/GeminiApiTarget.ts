export async function queryGeminiApi(
  prompt: string,
  apiKey: string,
  model = 'gemini-2.0-flash',
  systemPrompt?: string,
): Promise<string> {
  const contents: object[] = [];
  if (systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contents }),
      signal:  AbortSignal.timeout(25000),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Gemini API error ${res.status}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
