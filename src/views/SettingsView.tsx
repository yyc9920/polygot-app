import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  PlayCircle,
  Plus,
  Link as LinkIcon,
  ExternalLink,
  HelpCircle,
  Trophy
} from 'lucide-react';
import { usePhraseAppContext } from '../context/PhraseContext';
import { FunButton } from '../components/FunButton';

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
    youtubeApiKey,
    setYoutubeApiKey,
    phraseList,
    setPhraseList,
    savedUrls,
    setSavedUrls,
    setReviewMode,
    setCurrentView,
    syncUrl
  } = usePhraseAppContext();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showYoutubeApiKey, setShowYoutubeApiKey] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState('');
  
  // Progress Filter
  const [progressFilterTag, setProgressFilterTag] = useState('All');
  
  // URL Management
  const [newUrl, setNewUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Guide Modals
  const [showCSVGuide, setShowCSVGuide] = useState(false);
  const [showAPIKeyGuide, setShowAPIKeyGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      setVoices(vs.sort((a, b) => a.name.localeCompare(b.name)));
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const handleStartReview = () => {
      setReviewMode(true);
      setCurrentView('learn');
  };

  const handleAddUrl = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUrl) return;
      if (savedUrls.includes(newUrl)) {
          alert("URL already exists.");
          return;
      }
      setSavedUrls([...savedUrls, newUrl]);
      setNewUrl('');
  };

  const handleRemoveUrl = (url: string) => {
      if (confirm("Remove this URL?")) {
          setSavedUrls(savedUrls.filter(u => u !== url));
      }
  };

  const handleSyncUrl = async (url: string) => {
      setIsSyncing(url);
      await syncUrl(url);
      setIsSyncing(null);
  };

  const handleAutoDetectVoice = () => {
    // Collect all tags
    const allTags = new Set(phraseList.flatMap(v => v.tags.map(t => t.toLowerCase())));
    
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
          phraseList,
          status,
          voiceURI,
          apiKey,
          savedUrls
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
              
              // Basic validation - check for phraseList OR vocabList (migration)
              const list = data.phraseList || data.vocabList;
              if (!list || !Array.isArray(list)) throw new Error("Invalid format: missing phraseList/vocabList");

              setPhraseList(list);
              if (data.status) setStatus(data.status);
              if (data.voiceURI) setVoiceURI(data.voiceURI);
              if (data.apiKey) setApiKey(data.apiKey);
              if (data.savedUrls) setSavedUrls(data.savedUrls);
              // Backward compatibility
              if (data.savedUrl && (!data.savedUrls || data.savedUrls.length === 0)) setSavedUrls([data.savedUrl]);

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
  const allTags = ['All', ...Array.from(new Set(phraseList.flatMap(v => v.tags)))];
  
  const filteredList = progressFilterTag === 'All' 
    ? phraseList 
    : phraseList.filter(v => v.tags.includes(progressFilterTag));
    
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

        <FunButton 
            onClick={handleStartReview}
            disabled={filteredIncorrect === 0}
            fullWidth
            variant="danger"
            className="flex items-center justify-center gap-2"
        >
            <PlayCircle size={20} />
            Start Review Session ({filteredIncorrect} items)
        </FunButton>

        <p className="text-center text-sm text-gray-400 mt-2">
            {progressFilterTag === 'All' ? `Total Phrases: ${filteredTotalCount}` : `Phrases in '${progressFilterTag}': ${filteredTotalCount}`}
        </p>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/50 flex flex-col items-center">
            <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-6 py-3 rounded-2xl border border-yellow-200 dark:border-yellow-800 shadow-sm transition-transform hover:scale-105">
                <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-xl">
                    <Trophy size={24} className="fill-current" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 leading-none mb-1">Total Polygot Score</span>
                    <span className="font-black text-2xl leading-none">{status.points || 0} <span className="text-sm font-bold opacity-60">pts</span></span>
                </div>
            </div>
        </div>
      </section>

      {/* 2. Content Sources */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <LinkIcon className="text-indigo-500" /> Content Sources (CSV)
            </h3>
            <button 
              onClick={() => setShowCSVGuide(true)}
              className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
              title="CSV Format Guide"
            >
              <HelpCircle size={20} />
            </button>
          </div>
          <div className="space-y-4">
              <div className="space-y-2">
                  {savedUrls.length === 0 && <p className="text-sm text-gray-400 italic">No CSV sources added.</p>}
                  {savedUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg group">
                          <LinkIcon size={14} className="text-gray-400 flex-none" />
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 font-mono">{url}</span>
                          <button 
                            onClick={() => handleSyncUrl(url)} 
                            disabled={isSyncing === url}
                            className={`p-1 text-gray-400 hover:text-blue-500 ${isSyncing === url ? 'animate-spin text-blue-500' : ''}`}
                            title="Sync now"
                          >
                              <RefreshCw size={14} />
                          </button>
                          <button onClick={() => handleRemoveUrl(url)} className="p-1 text-gray-400 hover:text-red-500">
                              <Trash2 size={14} />
                          </button>
                      </div>
                  ))}
              </div>
              
              <form onSubmit={handleAddUrl} className="flex gap-2">
                  <input 
                      type="url" 
                      placeholder="https://.../data.csv" 
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="flex-1 p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                  />
                  <button type="submit" className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                      <Plus size={20} />
                  </button>
              </form>
              <p className="text-xs text-gray-400">
                  Data from these URLs is automatically fetched and merged on startup.
              </p>
          </div>
      </section>

      {/* 3. AI Configuration */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Settings className="text-purple-500" /> AI Configuration
          </h3>
          <button 
            onClick={() => setShowAPIKeyGuide(true)}
            className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
            title="API Key Setup Guide"
          >
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Google Gemini API Key</label>
            <a 
              href="https://aistudio.google.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-purple-500 hover:text-purple-600 flex items-center gap-1 font-medium"
            >
              Get Key <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex gap-2 relative">
             <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type={showApiKey ? "text" : "password"}
               placeholder="Enter your API Key..." 
               value={apiKey} 
               onChange={(e) => setApiKey(e.target.value)}
               className="flex-1 pl-10 pr-10 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
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

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">YouTube Data API Key</label>
            <a 
              href="https://console.developers.google.com/apis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
            >
              Get Key <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex gap-2 relative">
             <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type={showYoutubeApiKey ? "text" : "password"}
               placeholder="Enter your YouTube API Key..." 
               value={youtubeApiKey} 
               onChange={(e) => setYoutubeApiKey(e.target.value)}
               className="flex-1 pl-10 pr-10 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
             />
             <button 
               onClick={() => setShowYoutubeApiKey(!showYoutubeApiKey)}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
             >
               {showYoutubeApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
             </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Required for searching music videos.
          </p>
        </div>
      </section>

      {/* 4. Text-to-Speech Settings */}
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
               className="w-full pl-10 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
             />
          </div>
          
          <select 
            value={voiceURI || ''} 
            onChange={(e) => setVoiceURI(e.target.value || null)}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
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

      {/* 5. Data Management */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Database className="text-red-500" /> Data Management
        </h3>
        <div className="flex flex-col gap-3">
           <div className="flex gap-2">
               <FunButton 
                onClick={handleSaveData} 
                className="flex-1 flex items-center justify-center gap-2"
                variant="primary"
               >
                   <Save size={18} /> Backup Data (Save)
               </FunButton>
               
               <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleLoadData} />
               <FunButton 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2"
                variant="neutral"
               >
                   <Upload size={18} /> Load Backup
               </FunButton>
           </div>
           
           <div className="h-[1px] bg-gray-100 dark:bg-gray-700 my-2"></div>

          <FunButton 
            onClick={handleReset} 
            fullWidth
            variant="neutral"
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Reset Learning Progress
          </FunButton>
          <FunButton 
            onClick={handleDeleteAllData} 
            fullWidth
            variant="danger"
            className="flex items-center justify-center gap-2 border-red-200"
          >
            <Trash2 size={18} /> Delete All Data (Hard Reset)
          </FunButton>
        </div>
      </section>

      {/* CSV Format Guide Modal */}
      {showCSVGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <LinkIcon size={20} className="text-indigo-500" /> CSV Format Guide
              </h4>
              <button onClick={() => setShowCSVGuide(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your CSV file should follow this structure. The first row (header) is optional but recommended.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <code className="text-xs text-indigo-600 dark:text-indigo-400 font-mono break-all">
                  sentence,meaning,pronunciation,tags
                </code>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-gray-700 dark:text-gray-200">Example Rows:</h5>
                <pre className="text-[10px] bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
{`こんにちは,Hello,Konnichiwa,"greeting,basic"
ありがとう,Thank you,Arigatou,"greeting,polite"
猫 (ねこ),Cat,Neko,"animal,N5"`}
                </pre>
              </div>
              <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc pl-4 space-y-1">
                <li>Fields are separated by commas.</li>
                <li>If a field contains a comma (like tags), wrap it in double quotes.</li>
                <li>The <code className="font-mono">pronunciation</code> and <code className="font-mono">tags</code> fields are optional.</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
              <FunButton onClick={() => setShowCSVGuide(false)} variant="primary" className="px-6">Got it!</FunButton>
            </div>
          </div>
        </div>
      )}

      {/* API Key Guide Modal */}
      {showAPIKeyGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Key size={20} className="text-purple-500" /> API Key Setup Guide
              </h4>
              <button onClick={() => setShowAPIKeyGuide(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <h5 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  1. Google Gemini API
                </h5>
                <ol className="text-sm text-gray-600 dark:text-gray-300 list-decimal pl-4 space-y-2">
                  <li>Go to <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12}/></a></li>
                  <li>Sign in with your Google account.</li>
                  <li>Click <strong>"Create API key"</strong> then <strong>"Create API key in new project"</strong>.</li>
                  <li>Copy the key and paste it into the Gemini API field.</li>
                </ol>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-700" />

              <div className="space-y-3">
                <h5 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  2. YouTube Data API
                </h5>
                <ol className="text-sm text-gray-600 dark:text-gray-300 list-decimal pl-4 space-y-2">
                  <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink size={12}/></a></li>
                  <li>Create a new project (or select an existing one).</li>
                  <li>Go to <strong>"Enabled APIs & Services"</strong> and click <strong>"+ ENABLE APIS AND SERVICES"</strong>.</li>
                  <li>Search for <strong>"YouTube Data API v3"</strong> and enable it.</li>
                  <li>Go to <strong>"Credentials"</strong> &rarr; <strong>"Create Credentials"</strong> &rarr; <strong>"API key"</strong>.</li>
                </ol>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
              <FunButton onClick={() => setShowAPIKeyGuide(false)} variant="primary" className="px-6">Got it!</FunButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
