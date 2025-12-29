
export const callGemini = async (prompt: string, apiKey: string) => {
  if (!apiKey) throw new Error("API Key is missing. Please set it in Settings.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Gemini API Error");
  }

  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
};
