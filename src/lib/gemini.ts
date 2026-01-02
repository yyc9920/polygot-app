
export const callGemini = async (prompt: string, apiKey: string, maxTokens?: number, tools?: unknown[]) => {
  if (!apiKey) throw new Error("API Key is missing. Please set it in Settings.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const body: {
    contents: { parts: { text: string }[] }[];
    generationConfig?: { maxOutputTokens: number };
    tools?: unknown[];
  } = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (maxTokens) {
    body.generationConfig = {
      maxOutputTokens: maxTokens
    };
  }

  if (tools) {
    body.tools = tools;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Gemini API Error");
  }

  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export const generateSongLyrics = async (artist: string, title: string, apiKey: string) => {
  const prompt = `
  You are a language tutor. I am learning a language by listening to music.
  Please generate lyrics for the song "${title}" by "${artist}".
  
  IMPORTANT: Please Search for the official lyrics of this song to ensure accuracy.
  
  Output MUST be valid JSON with this exact schema:
  {
    "lyrics": [
       { "original": "line 1", "translated": "Korean translation 1" },
       { "original": "line 2", "translated": "Korean translation 2" }
    ],
    "artist": "${artist}",
    "title": "${title}"
  }
  
  Provide the full lyrics. The 'translated' field MUST be in Korean.
  Do not include markdown formatting (like \`\`\`json). Return raw JSON.
  `;
  
  const parseResponse = (text: string) => {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
          const parsed = JSON.parse(cleanText);
          return { ...parsed, phrases: [] }; // Return empty phrases initially
      } catch (err) {
          console.error("Failed to parse Gemini JSON:", cleanText, err);
          throw new Error("AI response was not valid JSON. Please try again.");
      }
  };

  try {
      // Try with Google Search grounding for accuracy
      const text = await callGemini(prompt, apiKey, undefined, [{ google_search: {} }]);
      return parseResponse(text);
  } catch (err) {
      console.warn("Gemini with search failed or not supported, falling back to basic generation.", err);
      const text = await callGemini(prompt, apiKey);
      return parseResponse(text);
  }
};

export const generatePhraseFromLyric = async (lyric: string, artist: string, title: string, apiKey: string) => {
  const prompt = `Act like a function that generates a vocabulary list.
Context: The lyric line "${lyric}" from the song "${title}" by "${artist}".
Task: Generate 1 vocabulary item or phrase card based on this lyric.
Output: Corresponding vocabulary or phrases with given format.
Format: CSV in markdown.
Columns: Meaning,Sentence,Pronunciation,Tags
Contents:
Meaning: Korean translation of the phrase/sentence
Sentence: The original lyric line or key phrase from it
Pronunciation: Pronunciation guide (e.g. Romaji for Japanese, Pinyin for Chinese, or Phonetic for English)
Tags: "music" and any other relevant tags (e.g. "expression", "love", etc.)
Enclose each data point in double quotation marks("").
Example:
"따뜻한 아메리카노 한 잔 주세요","ホットコーヒーを一つください","Hotto kōhī o hitotsu kudasai","music,cafe"
Return ONLY the CSV content, no introduction or markdown code blocks.`;

  const resultText = await callGemini(prompt, apiKey);
  const csvStr = resultText.replace(/```csv/g, '').replace(/```/g, '').trim();
  
  return csvStr;
};
