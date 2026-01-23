import { GoogleGenerativeAI, type Tool, type Schema, SchemaType } from "@google/generative-ai";

export interface GeminiOptions {
  maxTokens?: number;
  tools?: Tool[];
  responseMimeType?: string;
  responseSchema?: Schema;
}

export const callGemini = async (prompt: string, apiKey: string, options: GeminiOptions = {}) => {
  if (!apiKey) throw new Error("API Key is missing. Please set it in Settings.");

  const genAI = new GoogleGenerativeAI(apiKey);

  const generationConfig: {
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: Schema;
  } = {};
  if (options.maxTokens) generationConfig.maxOutputTokens = options.maxTokens;
  if (options.responseMimeType) generationConfig.responseMimeType = options.responseMimeType;
  if (options.responseSchema) generationConfig.responseSchema = options.responseSchema;

  const modelParams: {
    model: string;
    generationConfig: typeof generationConfig;
    tools?: Tool[];
  } = {
    model: "gemini-2.0-flash",
    generationConfig
  };

  if (options.tools) {
    modelParams.tools = options.tools;
  }

  const model = genAI.getGenerativeModel(modelParams);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gemini API Error";
    throw new Error(message);
  }
};

export const generateSongLyrics = async (artist: string, title: string, apiKey: string, targetLanguage: string, locale: string) => {
  console.log(`Searching lyrics for "${title}" by "${artist}" in ${targetLanguage} using Gemini Google Search...`);

  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      lyrics: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            original: { type: SchemaType.STRING },
            translated: { type: SchemaType.STRING }
          },
          required: ["original", "translated"]
        }
      },
      artist: { type: SchemaType.STRING },
      title: { type: SchemaType.STRING },
      genre: { type: SchemaType.STRING }
    },
    required: ["lyrics", "artist", "title"]
  };

  try {
    const searchPrompt = `
    Find the official lyrics for the song "${title}" by "${artist}".
    IMPORTANT: Ensure the fetched lyrics are in ${targetLanguage}.
    Also find the meaning or translation in ${locale}.
    Identify the music genre of the song.
    Return the lyrics, translation, and genre in a raw text format.
    `;

    const searchResult = await callGemini(searchPrompt, apiKey, {
      tools: [{ googleSearch: {} } as unknown as Tool]
    });

    console.log("Search completed. Now formatting to JSON...");

    const formattingPrompt = `
    I have some raw text containing song lyrics and translation.
    Please format this into a structured JSON object.

    Raw Text:
    ${searchResult}

    Task:
    Extract the lyrics and their ${locale} translation.
    The 'original' field MUST be in ${targetLanguage}.
    The 'translated' field MUST be in ${locale}.
    If the translation is missing in the raw text, generate it yourself based on the lyrics.
    Identify the genre of the song (e.g. Pop, Rock, Hip Hop, Ballad, etc).

    Output JSON Schema:
    {
      "lyrics": [
        { "original": "line 1", "translated": "translation 1" },
        { "original": "line 2", "translated": "translation 2" }
      ],
      "artist": "${artist}",
      "title": "${title}",
      "genre": "Genre Name"
    }
    `;

    const jsonText = await callGemini(formattingPrompt, apiKey, {
      responseMimeType: "application/json",
      responseSchema: schema
    });

    return JSON.parse(jsonText);

  } catch (error) {
    console.warn(`Gemini search failed for "${title}" by "${artist}", falling back to pure generation`, error);

    const fallbackPrompt = `
    You are a language tutor. I am learning a language by listening to music.
    Please generate lyrics for song "${title}" by "${artist}".

    IMPORTANT: Search for official lyrics to ensure accuracy. 
    The 'original' field MUST be in ${targetLanguage}.
    The 'translated' field MUST be in ${locale}.
    
    If you cannot find them, be honest and generate general educational lyrics.

    Output MUST be valid JSON conforming to the schema.
    Provide the full lyrics. 
    Identify the genre of the song.
    `;

    const text = await callGemini(fallbackPrompt, apiKey, {
      responseMimeType: "application/json",
      responseSchema: schema
    });

    return JSON.parse(text);
  }
};

export const generatePhraseFromLyric = async (lyric: string, translated: string, artist: string, title: string, apiKey: string, locale: string) => {
  const prompt = `Act like a function that generates a vocabulary list.
  Context: The lyric and translation line "${lyric}", "${translated}" from the song "${title}" by "${artist}".
  Task: Generate 1 vocabulary item or phrase card based on this lyric.
  Output: Corresponding vocabulary or phrases.
  Format: JSON object with meaning, sentence, pronunciation, tags.
  Meaning: ${translated}
  Sentence: ${lyric}
  Pronunciation: Pronunciation guide (e.g. Let empty for English, 振り仮名(ふりがな) for Japanese, Pinyin for Chinese, or Phonetic for Other languages)
  Tags: "music", "${artist}", "${title}", language tag(e.g. "japanese" for japanese sentnece,"chinese" for Chinese. In ${locale} language) and any other relevant tags (e.g. "expression", "love", etc.)
  `;

  console.log("Prompt: ", prompt);

  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      meaning: { type: SchemaType.STRING },
      sentence: { type: SchemaType.STRING },
      pronunciation: { type: SchemaType.STRING },
      tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["meaning", "sentence"]
  };

  const text = await callGemini(prompt, apiKey, {
    responseMimeType: "application/json",
    responseSchema: schema
  });

  return JSON.parse(text);
};
