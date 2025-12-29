import { Sparkles, X, Check } from 'lucide-react';
import type { VocabItem } from '../types';

interface ConfirmationModalProps {
  items: VocabItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({ items, onConfirm, onCancel }: ConfirmationModalProps) {
  return (
    <div className="absolute inset-x-0 top-16 z-50 mx-4 p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-2xl rounded-2xl border border-blue-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[80vh]">
      <div className="flex justify-between items-start mb-2 flex-none">
        <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Sparkles size={16} /> Confirm Generation
        </h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-none">
         <span className="text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
            {items.length} items
         </span>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-2 space-y-2 mb-4 min-h-0">
         {items.map((item, i) => (
             <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                 <div className="font-bold text-gray-800 dark:text-gray-200">{item.sentence}</div>
                 <div className="text-gray-500 dark:text-gray-400">{item.meaning}</div>
                 <div className="flex gap-1 mt-1 flex-wrap">
                    {item.tags.map(t => <span key={t} className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-600 dark:text-gray-300">{t}</span>)}
                 </div>
             </div>
         ))}
      </div>

      <div className="flex gap-3 h-10 flex-none">
         <button 
            onClick={onCancel} 
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
         >
             Cancel
         </button>
         <button 
            onClick={onConfirm} 
            className="flex-1 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
         >
             <Check size={16}/> Confirm & Add
         </button>
      </div>
    </div>
  );
}
