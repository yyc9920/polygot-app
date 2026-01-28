import { useState, useEffect } from 'react';
import { Mic, Search } from 'lucide-react';
import { usePhraseAppContext } from '../../context/PhraseContext';
import useLanguage from '../../hooks/useLanguage';
import { useToast } from '../../context/ToastContext';

export function TtsVoiceSection() {
   const { voiceURI, setVoiceURI, phraseList } = usePhraseAppContext();
   const { t } = useLanguage();
   const toast = useToast();
   
   const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
   const [voiceFilter, setVoiceFilter] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      setVoices(vs.sort((a, b) => a.name.localeCompare(b.name)));
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const handleAutoDetectVoice = () => {
    // Collect all tags
    const allTags = new Set(phraseList.flatMap(v => v.tags.map(tag => tag.toLowerCase())));
    
    // Heuristics mapping
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

    let targetLang = '';
    
    for (const tag of allTags) {
      if (langMap[tag]) {
        targetLang = langMap[tag];
        break; // Found a match
      }
    }

     if (!targetLang) {
       toast.warning(t('settings.noRecognizableLanguageTags'));
       return;
     }

     const bestVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
     if (bestVoice) {
       setVoiceURI(bestVoice.voiceURI);
       toast.success(t('settings.voiceSelected').replace('{{name}}', bestVoice.name).replace('{{lang}}', bestVoice.lang));
     } else {
       toast.warning(t('settings.noVoiceFound').replace('{{lang}}', targetLang));
     }
  };

  const filteredVoices = voices.filter(v => 
    v.name.toLowerCase().includes(voiceFilter.toLowerCase()) || 
    v.lang.toLowerCase().includes(voiceFilter.toLowerCase())
  );

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Mic className="text-orange-500" /> {t('settings.ttsVoice')}
        </h3>
        <button onClick={handleAutoDetectVoice} className="text-xs px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg font-bold hover:bg-orange-100 transition-colors">
          {t('settings.autoDetect')}
        </button>
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder={t('settings.searchVoices')}
            value={voiceFilter}
            onChange={(e) => setVoiceFilter(e.target.value)}
            className="w-full pl-10 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>
        
        <select 
          value={voiceURI || ''} 
          onChange={(e) => setVoiceURI(e.target.value || null)}
          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
        >
          <option value="">{t('settings.defaultSystemVoice')}</option>
          {filteredVoices.map(v => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang}) {v.default ? t('settings.defaultSuffix') : ''}
            </option>
          ))}
        </select>
        {filteredVoices.length === 0 && (
          <p className="text-xs text-gray-400 text-center">{t('settings.noVoicesMatch')}</p>
        )}
      </div>
    </section>
  );
}
