import { Sparkles, X, Check, Trash2, Tag } from 'lucide-react';
import type { PhraseItem } from '../types';
import { generateId } from '../lib/utils';
import useLanguage from '../hooks/useLanguage';

interface ConfirmationModalProps {
  items: PhraseItem[];
  onConfirm: () => void;
  onCancel: () => void;
  onUpdate: (items: PhraseItem[]) => void;
}

export function ConfirmationModal({ items, onConfirm, onCancel, onUpdate }: ConfirmationModalProps) {
  const { t } = useLanguage();

  const handleChange = (index: number, field: keyof PhraseItem, value: string) => {
      const newItems = [...items];
      let updatedValue: any = value;

      if (field === 'tags') {
          updatedValue = value.split(',').map(t => t.trim()).filter(Boolean);
      }

      const item = { ...newItems[index], [field]: updatedValue };
      
      // Regenerate ID if key fields change
      if (field === 'meaning' || field === 'sentence') {
          item.id = generateId(item.meaning, item.sentence);
      }
      
      newItems[index] = item;
      onUpdate(newItems);
  };

  const handleDelete = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onUpdate(newItems);
  };

  return (
    <div className="absolute inset-x-0 top-16 z-50 mx-4 p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-2xl rounded-2xl border border-blue-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[80vh]">
      <div className="flex justify-between items-start mb-2 flex-none">
        <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Sparkles size={16} /> {t('builder.confirmGeneration')}
        </h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-none">
         <span className="text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
            {items.length} {t('settings.items')}
         </span>
         <span className="text-xs text-gray-400">{t('builder.reviewAndEdit')}</span>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-2 space-y-2 mb-4 min-h-0">
         {items.map((item, i) => (
             <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm group relative">
                 <div className="pr-8 space-y-1">
                     <input 
                        className="w-full font-bold text-gray-800 dark:text-gray-200 bg-transparent border-b border-transparent focus:border-blue-500 outline-none transition-colors"
                        value={item.sentence}
                        onChange={(e) => handleChange(i, 'sentence', e.target.value)}
                        placeholder={t('builder.sentenceLabel')}
                     />
                     <input 
                        className="w-full text-gray-500 dark:text-gray-400 bg-transparent border-b border-transparent focus:border-blue-500 outline-none transition-colors"
                        value={item.meaning}
                        onChange={(e) => handleChange(i, 'meaning', e.target.value)}
                        placeholder={t('builder.meaningLabel')}
                     />
                     <input 
                        className="w-full text-xs text-gray-400 bg-transparent border-b border-transparent focus:border-blue-500 outline-none transition-colors"
                        value={item.pronunciation || ''}
                        onChange={(e) => handleChange(i, 'pronunciation', e.target.value)}
                        placeholder={t('builder.pronunciationLabel')}
                     />
                     <div className="flex items-center gap-2 mt-1">
                        <Tag size={12} className="text-gray-400 flex-none" />
                        <input 
                            className="flex-1 text-[10px] text-gray-500 dark:text-gray-400 bg-transparent border-b border-transparent focus:border-blue-500 outline-none transition-colors"
                            value={item.tags.join(', ')}
                            onChange={(e) => handleChange(i, 'tags', e.target.value)}
                            placeholder={t('builder.tagsLabel') + ' (' + t('builder.tagsPlaceholder') + ')'}
                        />
                     </div>
                 </div>
                 <button 
                    onClick={() => handleDelete(i)}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title={t('common.removeItem')}
                 >
                     <Trash2 size={16} />
                 </button>
             </div>
         ))}
         {items.length === 0 && (
             <div className="p-8 text-center text-gray-400">
                 {t('learn.noDataToDisplay')}
             </div>
         )}
      </div>

      <div className="flex gap-3 h-10 flex-none">
         <button 
            onClick={onCancel} 
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
         >
             {t('common.cancel')}
         </button>
         <button 
            onClick={onConfirm} 
            disabled={items.length === 0}
            className="flex-1 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
         >
             <Check size={16}/> {t('builder.confirmAndAdd')}
         </button>
      </div>
    </div>
  );
}
