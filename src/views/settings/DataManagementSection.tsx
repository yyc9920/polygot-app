import { useRef } from 'react';
import { Database, Save, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { usePhraseAppContext } from '../../context/PhraseContext';
import { useDialog } from '../../context/DialogContext';
import { FunButton } from '../../components/FunButton';
import useLanguage from '../../hooks/useLanguage';
import { useToast } from '../../context/ToastContext';

export function DataManagementSection() {
   const { phraseList, status, voiceURI, apiKey, savedUrls, setPhraseList, setStatus, setVoiceURI, setApiKey, setSavedUrls, handleReset, handleDeleteAllData } = usePhraseAppContext();
   const { confirm } = useDialog();
   const { t } = useLanguage();
   const toast = useToast();
   const fileInputRef = useRef<HTMLInputElement>(null);

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
    link.download = `polyglot_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await confirm({
      title: t('settings.loadBackup'),
      message: t('settings.overwriteConfirm'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    });
    
    if (!confirmed) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const data = JSON.parse(text);
        
        const list = data.phraseList || data.vocabList;
        if (!list || !Array.isArray(list)) throw new Error(t('settings.invalidFormat'));

         setPhraseList(list);
         if (data.status) setStatus(data.status);
         if (data.voiceURI) setVoiceURI(data.voiceURI);
         if (data.apiKey) setApiKey(data.apiKey);
         if (data.savedUrls) setSavedUrls(data.savedUrls);
         if (data.savedUrl && (!data.savedUrls || data.savedUrls.length === 0)) setSavedUrls([data.savedUrl]);

         toast.success(t('settings.loadSuccess'));
       } catch (err: unknown) {
         const message = err instanceof Error ? err.message : 'Unknown error';
         toast.error(t('settings.loadFailed').replace('{{error}}', message));
       } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
        <Database className="text-red-500" /> {t('settings.dataManagement')}
      </h3>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FunButton 
            onClick={handleSaveData} 
            className="flex-1 flex items-center justify-center gap-2"
            variant="primary"
          >
            <Save size={18} /> {t('settings.backupData')}
          </FunButton>
          
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleLoadData} />
          <FunButton 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2"
            variant="neutral"
          >
            <Upload size={18} /> {t('settings.loadBackup')}
          </FunButton>
        </div>
        
        <div className="h-[1px] bg-gray-100 dark:bg-gray-700 my-2"></div>

        <FunButton 
          onClick={async () => {
            const confirmed = await confirm({
              title: t('settings.resetProgress'),
              message: t('settings.resetConfirm'),
              confirmText: t('common.confirm'),
              cancelText: t('common.cancel'),
            });
            if (confirmed) handleReset();
          }} 
          fullWidth
          variant="neutral"
          className="flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} /> {t('settings.resetProgress')}
        </FunButton>
        <FunButton 
          onClick={async () => {
            const confirmed = await confirm({
              title: t('settings.deleteAllData'),
              message: t('settings.deleteAllConfirm'),
              confirmText: t('common.delete'),
              cancelText: t('common.cancel'),
              variant: 'danger',
            });
            if (confirmed) handleDeleteAllData();
          }} 
          fullWidth
          variant="danger"
          className="flex items-center justify-center gap-2 border-red-200"
        >
          <Trash2 size={18} /> {t('settings.deleteAllData')}
        </FunButton>
      </div>
    </section>
  );
}
