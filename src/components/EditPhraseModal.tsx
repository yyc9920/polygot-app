import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { FunButton } from './FunButton';
import type { PhraseEntity } from '../types/schema';
import useLanguage from '../hooks/useLanguage';

interface EditPhraseModalProps {
  item: PhraseEntity | null;
  onSave: (updatedItem: PhraseEntity) => void;
  onCancel: () => void;
}

export function EditPhraseModal({ item, onSave, onCancel }: EditPhraseModalProps) {
  const { t } = useLanguage();
  
  // State to track the form values
  const [form, setForm] = useState({ meaning: '', sentence: '', pronunciation: '', tags: '' });
  
  // State to track the current item ID for resetting form when item changes
  const [currentItemId, setCurrentItemId] = useState<string | undefined>(undefined);

  // Sync form with item when item changes (Derived State Pattern)
  if (item && item.id !== currentItemId) {
    setCurrentItemId(item.id);
    setForm({
      meaning: item.meaning,
      sentence: item.sentence,
      pronunciation: item.pronunciation || '',
      tags: item.tags.join(', ')
    });
  }

  if (!item) return null;

  const handleSave = () => {
    if (!form.meaning || !form.sentence) {
        alert("Meaning and Sentence are required.");
        return;
    }

     const updatedItem: PhraseEntity = {
        ...item,
        meaning: form.meaning,
        sentence: form.sentence,
        pronunciation: form.pronunciation,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    onSave(updatedItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-lg">{t('common.editItem')}</h3>
                <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20}/></button>
            </div>
            <div className="p-4 flex flex-col gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">{t('builder.meaningLabel')}</label>
                    <input 
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" 
                        value={form.meaning} 
                        onChange={e => setForm({...form, meaning: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">{t('builder.sentenceLabel')}</label>
                    <input 
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" 
                        value={form.sentence} 
                        onChange={e => setForm({...form, sentence: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">{t('builder.pronunciationLabel')}</label>
                    <input 
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" 
                        value={form.pronunciation} 
                        onChange={e => setForm({...form, pronunciation: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">{t('builder.tagsLabel')} ({t('builder.tagsPlaceholder')})</label>
                    <input 
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" 
                        value={form.tags} 
                        onChange={e => setForm({...form, tags: e.target.value})} 
                    />
                </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">{t('common.cancel')}</button>
                <FunButton onClick={handleSave} variant="primary" className="flex items-center gap-2">
                    <Save size={16} /> {t('common.saveChanges')}
                </FunButton>
            </div>
        </div>
    </div>
  );
}
