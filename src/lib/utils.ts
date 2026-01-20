
export const generateId = (meaning: string, sentence: string): string => {
  const input = `${meaning.trim()}|${sentence.trim()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
};

export const detectLanguage = (text: string): string => {
  const koPattern = /[\uAC00-\uD7AF]/;
  const jaPattern = /[\u3040-\u309F\u30A0-\u30FF]/;
  const zhPattern = /[\u4E00-\u9FFF]/;
  
  if (koPattern.test(text)) return 'ko';
  if (jaPattern.test(text)) return 'ja';
  if (zhPattern.test(text)) return 'zh';
  return 'en';
};

export const detectLanguageFromTags = (tags: string[]): string | undefined => {
  const lowerTags = new Set(tags.map(t => t.toLowerCase()));
  
  const langMap: Record<string, string> = {
    'japanese': 'ja', '일본어': 'ja', 'japan': 'ja',
    'english': 'en', '영어': 'en',
    'korean': 'ko', '한국어': 'ko',
    'chinese': 'zh', '중국어': 'zh',
    'spanish': 'es', '스페인어': 'es',
    'french': 'fr', '프랑스어': 'fr',
    'german': 'de', '독일어': 'de',
    'portuguese': 'pt', '포르투갈어': 'pt'
  };

  for (const tag of lowerTags) {
    if (langMap[tag]) {
      return langMap[tag];
    }
  }
  
  return undefined;
};

// Enhanced Fuzzy Matching
export const checkAnswer = (input: string, answer: string): boolean => {
  const normalize = (str: string) => 
    str.toLowerCase()
       .replace(/[.,?!:;"'(){}[\]<>~`\-\u3000-\u303F]/g, '') // punctuation
       .replace(/\s+/g, ''); // spaces
  return normalize(input) === normalize(answer);
};

// Improved CSV Parser
export const parseCSV = (text: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    
    if (inQuotes) {
      if (char === '"' && normalizedText[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
            rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
        rows.push(currentRow);
    }
  }
  return rows;
};
