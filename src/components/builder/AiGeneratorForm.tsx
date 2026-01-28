import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { FunButton } from '../FunButton';
import { GeminiService } from '../../lib/services/GeminiService';
import { createPhraseEntity } from '../../lib/utils';
import { usePhraseAppContext } from '../../context/PhraseContext';
import type { PhraseEntity } from '../../types/schema';
import useLanguage from '../../hooks/useLanguage';
import { useToast } from '../../context/ToastContext';

interface AiGeneratorFormProps {
  onGenerate: (items: PhraseEntity[]) => void;
}

export function AiGeneratorForm({ onGenerate }: AiGeneratorFormProps) {
   const { apiKey } = usePhraseAppContext();
   const { t } = useLanguage();
   const toast = useToast();
   const [aiPrompt, setAiPrompt] = useState('');
   const [aiCount, setAiCount] = useState(5);
   const [isGenerating, setIsGenerating] = useState(false);

   const handleAiGenerate = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!apiKey) {
       toast.warning(t('learn.pleaseEnterApiKey'));
       return;
     }
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const rows = await GeminiService.generatePhrases(aiPrompt, aiCount, apiKey);
      
      const newItems: PhraseEntity[] = [];
      for (const row of rows) {
          newItems.push(createPhraseEntity({
              meaning: row.meaning,
              sentence: row.sentence,
              pronunciation: row.pronunciation || '',
              tags: row.tags || []
          }));
      }

       if (newItems.length > 0) {
          onGenerate(newItems);
          setAiPrompt('');
       } else {
         toast.error(t('builder.failedToParse'));
       }
     } catch (err: unknown) {
       const message = err instanceof Error ? err.message : 'Unknown error';
       toast.error(t('builder.aiGenerationFailed').replace('{{message}}', message));
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
