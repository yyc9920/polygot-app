
import { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  RefreshCw,
  Search,
  Key,
  Trash2,
  Activity,
  Settings,
  Mic,
  Database,
  Eye,
  EyeOff,
  Filter,
  Save,
  Upload
} from 'lucide-react';
import { useVocabAppContext } from '../context/VocabContext';

export function SettingsView() {
  const { 
    voiceURI, 
    setVoiceURI, 
    handleReset, 
    handleDeleteAllData, 
    status, 
    setStatus,
    apiKey, 
    setApiKey,
    vocabList,
    setVocabList,
    savedUrl,
    setSavedUrl
  } = useVocabAppContext();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState('');
  
  // Progress Filter
  const [progressFilterTag, setProgressFilterTag] = useState('All');

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
    const allTags = new Set(vocabList.flatMap(v => v.tags.map(t => t.toLowerCase())));
    
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
      alert("No recognizable language tags found to auto-detect voice.");
      return;
    }

    const bestVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
    if (bestVoice) {
      setVoiceURI(bestVoice.voiceURI);
      alert(`Auto-selected voice: ${bestVoice.name} (${bestVoice.lang})`);
    } else {
      alert(`No voice found for language code: ${targetLang}`);
    }
  };

  const handleSaveData = () => {
      const data = {
          version: 1,
          timestamp: new Date().toISOString(),
          vocabList,
          status,
          voiceURI,
          apiKey,
          savedUrl
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `polygot_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleLoadData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!confirm("Loading a backup will OVERWRITE your current data. Continue?")) {
          e.target.value = ''; // reset input
          return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const text = evt.target?.result as string;
              const data = JSON.parse(text);
              
              // Basic validation
              if (!data.vocabList || !Array.isArray(data.vocabList)) throw new Error("Invalid format: missing vocabList");

              setVocabList(data.vocabList);
              if (data.status) setStatus(data.status);
              if (data.voiceURI) setVoiceURI(data.voiceURI);
              if (data.apiKey) setApiKey(data.apiKey);
              if (data.savedUrl) setSavedUrl(data.savedUrl);

              alert("Data loaded successfully!");
          } catch (err: any) {
              alert(`Failed to load data: ${err.message}`);
          } finally {
              e.target.value = ''; // reset input
          }
      };
      reader.readAsText(file);
  };

  const filteredVoices = voices.filter(v => 
    v.name.toLowerCase().includes(voiceFilter.toLowerCase()) || 
    v.lang.toLowerCase().includes(voiceFilter.toLowerCase())
  );

  // Filtered Stats
  const allTags = ['All', ...Array.from(new Set(vocabList.flatMap(v => v.tags)))];
  
  const filteredList = progressFilterTag === 'All' 
    ? vocabList 
    : vocabList.filter(v => v.tags.includes(progressFilterTag));
    
  const filteredTotalCount = filteredList.length;
  const filteredCompleted = filteredList.filter(v => status.completedIds.includes(v.id)).length;
  const filteredIncorrect = filteredList.filter(v => status.incorrectIds.includes(v.id)).length;
  const progressPercent = filteredTotalCount > 0 ? Math.round((filteredCompleted / filteredTotalCount) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto p-1">
      
      {/* 1. Learning Progress Dashboard */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Activity className="text-blue-500" /> Learning Progress
            </h3>
            {/* Tag Filter */}
            <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-400"/>
                <select 
                    value={progressFilterTag} 
                    onChange={(e) => setProgressFilterTag(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 py-1"
                >
                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
            </div>
        </div>
        
        <div className="flex items-center gap-6 mb-4">
          <div className="relative w-24 h-24 flex items-center justify-center flex-none">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
               <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * progressPercent) / 100} className="text-blue-500 transition-all duration-1000 ease-out" />
             </svg>
             <span className="absolute text-xl font-bold text-gray-700 dark:text-gray-200">{progressPercent}%</span>
          </div>
          
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500 flex items-center gap-1"><Check size={14} className="text-green-500"/> Completed</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{filteredCompleted}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
               <div className="bg-green-500 h-full" style={{ width: `${filteredTotalCount > 0 ? (filteredCompleted / filteredTotalCount) * 100 : 0}%` }}></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500 flex items-center gap-1"><X size={14} className="text-red-500"/> To Review</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{filteredIncorrect}</span>
            </div>
             <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
               <div className="bg-red-500 h-full" style={{ width: `${filteredTotalCount > 0 ? (filteredIncorrect / filteredTotalCount) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400">
            {progressFilterTag === 'All' ? `Total Vocabulary: ${filteredTotalCount}` : `Vocabulary in '${progressFilterTag}': ${filteredTotalCount}`}
        </p>
      </section>

      {/* 2. AI Configuration */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Settings className="text-purple-500" /> AI Configuration
        </h3>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Google Gemini API Key</label>
          <div className="flex gap-2 relative">
             <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type={showApiKey ? "text" : "password"}
               placeholder="Enter your API Key..." 
               value={apiKey} 
               onChange={(e) => setApiKey(e.target.value)}
               className="flex-1 pl-10 pr-10 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
             />
             <button 
               onClick={() => setShowApiKey(!showApiKey)}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
             >
               {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
             </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Your key is stored locally in your browser and used only for AI features.
          </p>
        </div>
      </section>

      {/* 3. Text-to-Speech Settings */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Mic className="text-orange-500" /> TTS Voice
           </h3>
           <button onClick={handleAutoDetectVoice} className="text-xs px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg font-bold hover:bg-orange-100 transition-colors">
             Auto-detect
           </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Search voices (e.g. 'Google', 'jp')..." 
               value={voiceFilter}
               onChange={(e) => setVoiceFilter(e.target.value)}
               className="w-full pl-10 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
             />
          </div>
          
          <select 
            value={voiceURI || ''} 
            onChange={(e) => setVoiceURI(e.target.value || null)}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          >
            <option value="">Default System Voice</option>
            {filteredVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}) {v.default ? ' — Default' : ''}
              </option>
            ))}
          </select>
          {filteredVoices.length === 0 && (
            <p className="text-xs text-gray-400 text-center">No voices match your search.</p>
          )}
        </div>
      </section>

      {/* 4. Data Management */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Database className="text-red-500" /> Data Management
        </h3>
        <div className="flex flex-col gap-3">
           <div className="flex gap-2">
               <button 
                onClick={handleSaveData} 
                className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
               >
                   <Save size={18} /> Backup Data (Save)
               </button>
               <label className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                   <Upload size={18} /> Load Backup
                   <input type="file" accept=".json" className="hidden" onChange={handleLoadData} />
               </label>
           </div>
           
           <div className="h-[1px] bg-gray-100 dark:bg-gray-700 my-2"></div>

          <button 
            onClick={handleReset} 
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={18} /> Reset Learning Progress
          </button>
          <button 
            onClick={handleDeleteAllData} 
            className="w-full p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-transparent hover:border-red-200"
          >
            <Trash2 size={18} /> Delete All Data (Hard Reset)
          </button>
        </div>
      </section>

    </div>
  );
}
