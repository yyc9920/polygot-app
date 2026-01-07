export interface GeminiOptions {
  maxTokens?: number;
  tools?: unknown[];
  responseMimeType?: string;
  responseSchema?: any;
}

export const callGemini = async (prompt: string, apiKey: string, options: GeminiOptions = {}) => {
  if (!apiKey) throw new Error("API Key is missing. Please set it in Settings.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const body: any = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (options.maxTokens || options.responseMimeType || options.responseSchema) {
    body.generationConfig = {};
    if (options.maxTokens) body.generationConfig.maxOutputTokens = options.maxTokens;
    if (options.responseMimeType) body.generationConfig.responseMimeType = options.responseMimeType;
    if (options.responseSchema) body.generationConfig.responseSchema = options.responseSchema;
  }

  if (options.tools) {
    body.tools = options.tools;
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
  
  Output MUST be valid JSON conforming to the schema.
  Provide the full lyrics. The 'translated' field MUST be in Korean.
  `;
  
  const schema = {
    type: "OBJECT",
    properties: {
      lyrics: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            original: { type: "STRING" },
            translated: { type: "STRING" }
          },
          required: ["original", "translated"]
        }
      },
      artist: { type: "STRING" },
      title: { type: "STRING" }
    },
    required: ["lyrics", "artist", "title"]
  };

  try {
      // Try with Google Search grounding for accuracy
      const text = await callGemini(prompt, apiKey, { 
          tools: [{ google_search: {} }],
          responseMimeType: "application/json",
          responseSchema: schema
      });
      return JSON.parse(text);
  } catch (err) {
      console.warn("Gemini with search failed or not supported, falling back to basic generation.", err);
      const text = await callGemini(prompt, apiKey, {
          responseMimeType: "application/json",
          responseSchema: schema
      });
      return JSON.parse(text);
  }
};

export const generatePhraseFromLyric = async (lyric: string, artist: string, title: string, apiKey: string) => {
  const prompt = `Act like a function that generates a vocabulary list.
Context: The lyric line "${lyric}" from the song "${title}" by "${artist}".
Task: Generate 1 vocabulary item or phrase card based on this lyric.
Output: Corresponding vocabulary or phrases.
Format: JSON object with meaning, sentence, pronunciation, tags.
Meaning: Korean translation of the phrase/sentence
Sentence: The original lyric line or key phrase from it
Pronunciation: Pronunciation guide (e.g. Romaji for Japanese, Pinyin for Chinese, or Phonetic for English)
Tags: "music" and any other relevant tags (e.g. "expression", "love", etc.)
`;

  const schema = {
    type: "OBJECT",
    properties: {
      meaning: { type: "STRING" },
      sentence: { type: "STRING" },
      pronunciation: { type: "STRING" },
      tags: { type: "ARRAY", items: { type: "STRING" } }
    },
    required: ["meaning", "sentence"]
  };

  const text = await callGemini(prompt, apiKey, {
      responseMimeType: "application/json",
      responseSchema: schema
  });
  
  return JSON.parse(text);
};