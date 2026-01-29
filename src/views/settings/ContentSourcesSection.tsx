import { useState } from 'react';
import { Link as LinkIcon, HelpCircle, RefreshCw, Trash2, Plus, X } from 'lucide-react';
import { usePhraseAppContext } from '../../context/PhraseContext';
import { useDialog } from '../../context/DialogContext';
import { FunButton } from '../../components/FunButton';
import useLanguage from '../../hooks/useLanguage';
import { useToast } from '../../context/ToastContext';

export function ContentSourcesSection() {
   const { savedUrls, setSavedUrls, syncUrl } = usePhraseAppContext();
   const { t } = useLanguage();
   const { confirm } = useDialog();
   const toast = useToast();
   
   const [newUrl, setNewUrl] = useState('');
   const [isSyncing, setIsSyncing] = useState<string | null>(null);
   const [showCSVGuide, setShowCSVGuide] = useState(false);

   const handleAddUrl = (e: React.FormEvent) => {
     e.preventDefault();
     if (!newUrl) return;
     if (savedUrls.includes(newUrl)) {
       toast.warning(t('settings.urlExists'));
       return;
     }
    setSavedUrls([...savedUrls, newUrl]);
    setNewUrl('');
  };

  const handleRemoveUrl = async (url: string) => {
    const confirmed = await confirm({
      title: t('common.confirm'),
      message: t('settings.removeUrl'),
      variant: 'danger'
    });
    if (confirmed) {
      setSavedUrls(savedUrls.filter(u => u !== url));
    }
  };

  const handleSyncUrl = async (url: string) => {
    setIsSyncing(url);
    const result = await syncUrl(url);
    setIsSyncing(null);
    
    if (result.success) {
      toast.success(t('settings.syncSuccess').replace('{{count}}', String(result.count)));
    } else {
      toast.warning(t('settings.syncNoItems'));
    }
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <LinkIcon className="text-indigo-500" /> {t('settings.contentSources')}
          </h3>
          <button 
            onClick={() => setShowCSVGuide(true)}
            className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
            title={t('settings.csvFormatGuide')}
          >
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            {savedUrls.length === 0 && <p className="text-sm text-gray-400 italic">{t('settings.noCsvSources')}</p>}
            {savedUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg group">
                <LinkIcon size={14} className="text-gray-400 flex-none" />
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 font-mono">{url}</span>
                <button 
                  onClick={() => handleSyncUrl(url)} 
                  disabled={isSyncing === url}
                  className={`p-1 text-gray-400 hover:text-blue-500 ${isSyncing === url ? 'animate-spin text-blue-500' : ''}`}
                  title={t('settings.syncNow')}
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
              placeholder={t('settings.addUrlPlaceholder')}
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
            {t('settings.dataAutoFetched')}
          </p>
        </div>
      </section>

      {/* CSV Format Guide Modal */}
      {showCSVGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <LinkIcon size={20} className="text-indigo-500" /> {t('settings.csvFormatGuide')}
              </h4>
              <button onClick={() => setShowCSVGuide(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('settings.csvGuideDescription')}
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <code className="text-xs text-indigo-600 dark:text-indigo-400 font-mono break-all">
                  {t('settings.csvFormat')}
                </code>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-gray-700 dark:text-gray-200">{t('settings.exampleRows')}</h5>
                <pre className="text-[10px] bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
{`こんにちは,Hello,Konnichiwa,"greeting,basic"
ありがとう,Thank you,Arigatou,"greeting,polite"
猫 (ねこ),Cat,Neko,"animal,N5"`}
                </pre>
              </div>
              <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc pl-4 space-y-1">
                <li>{t('settings.csvFieldsInfo.intro')}</li>
                <li>{t('settings.csvFieldsInfo.quotes')}</li>
                <li>{t('settings.csvFieldsInfo.optional')}</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
              <FunButton onClick={() => setShowCSVGuide(false)} variant="primary" className="px-6">{t('common.gotIt')}</FunButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
