import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { FunButton } from '../FunButton';
import { callGemini } from '../../lib/gemini';
import { generateId } from '../../lib/utils';
import { usePhraseAppContext } from '../../context/PhraseContext';
import type { PhraseItem } from '../../types';
import useLanguage from '../../hooks/useLanguage';

interface AiGeneratorFormProps {
  onGenerate: (items: PhraseItem[]) => void;
}

export function AiGeneratorForm({ onGenerate }: AiGeneratorFormProps) {
  const { apiKey } = usePhraseAppContext();
  const { t } = useLanguage();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert(t('learn.pleaseEnterApiKey'));
      return;
    }
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const prompt = `Act like a function that generates a phrase list with a given situation or context.
Input: Situation or context: '${aiPrompt}', Number of output data: ${aiCount}.
Output: List of phrases.
Contents:
Meaning: Native language translation (e.g. Korean)
Sentence: Target language sentence (e.g. Japanese)
Pronunciation: Pronunciation guide (e.g. Romaji)
Tags: Tags in Native language (e.g. "일상,비즈니스"). If context implies a specific language, add that as a tag (e.g. "일본어").
    - Suggested Tag List(in Native Language):
      1. 일상
      2. 여행
      3. 식사
      4. 비즈니스
      5. IT
      6. 사회
      7. 스포츠
      8. 학습
      9. 감정
`;

      const schema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                meaning: { type: "STRING" },
                sentence: { type: "STRING" },
                pronunciation: { type: "STRING" },
                tags: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["meaning", "sentence"]
        }
      };

      const resultText = await callGemini(prompt, apiKey, {
          responseMimeType: "application/json",
          responseSchema: schema
      });
      const rows = JSON.parse(resultText);
      
      const newItems: PhraseItem[] = [];
      for (const row of rows) {
          newItems.push({
              id: generateId(row.meaning, row.sentence),
              meaning: row.meaning,
              sentence: row.sentence,
              pronunciation: row.pronunciation || '',
              tags: row.tags || []
          });
      }

      if (newItems.length > 0) {
         onGenerate(newItems);
         setAiPrompt('');
      } else {
        alert(t('builder.failedToParse'));
      }
    } catch (err: any) {
      alert(t('builder.aiGenerationFailed').replace('{{message}}', err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-blue-500" />
        <h3 className="font-bold text-lg">{t('builder.aiPhraseGenerator')}</h3>
      </div>
      <form onSubmit={handleAiGenerate} className="flex flex-col gap-3">
         <div className="flex gap-2">
           <input 
             className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" 
             placeholder={t('builder.aiPromptPlaceholder')}
             value={aiPrompt} 
             onChange={(e) => setAiPrompt(e.target.value)} 
             required 
           />
           <input 
             type="number" 
             min="1" 
             max="20" 
             value={aiCount} 
             onChange={(e) => setAiCount(parseInt(e.target.value))} 
             className="w-16 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" 
           />
         </div>
         <FunButton type="submit" disabled={isGenerating} fullWidth variant="primary" className="flex items-center justify-center gap-2">
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} {t('builder.generatePhrases')}
         </FunButton>
      </form>
    </div>
  );
}
