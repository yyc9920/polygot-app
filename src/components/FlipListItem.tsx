import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { PhraseEntity } from '../types/schema';
import useLanguage from '../hooks/useLanguage';

interface FlipListItemProps {
  item: PhraseEntity;
  index: number;
  onSpeak: () => void;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FlipListItem({ 
  item, 
  index, 
  onSpeak, 
  badges, 
  actions,
  className = ''
}: FlipListItemProps) {
  const { t } = useLanguage();
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <div 
      className={`p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex justify-between items-center group cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 ${className}`}
      onClick={() => setShowMeaning(!showMeaning)}
    >
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-500 w-6 flex-none">{index + 1}</span>
          <h4 className={`font-bold transition-all duration-300 ${showMeaning ? 'text-gray-500 dark:text-gray-400 text-sm' : 'text-blue-900 dark:text-blue-100 text-lg'}`}>
            {showMeaning ? item.meaning : item.sentence}
          </h4>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 pl-8 truncate min-h-[1.25rem]">
          {showMeaning ? (
             <span className="text-blue-500 font-medium">{item.sentence}</span>
          ) : (
             <span className="opacity-50 text-xs italic">{t('learn.tapToRevealMeaning')}</span>
          )}
        </p>
        <div className="flex gap-1 mt-1 pl-8 items-center flex-wrap">
           {badges}
           {item.pronunciation && (
               <span className="text-[10px] font-mono bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">/{item.pronunciation}/</span>
           )}
        </div>
      </div>
      
      <div className="flex gap-2 items-center">
        <button
            onClick={(e) => { e.stopPropagation(); onSpeak(); }}
            className="p-3 bg-white dark:bg-gray-600 rounded-full shadow-sm text-blue-500 active:scale-90 transition-transform hover:shadow-md"
        >
            <Volume2 size={18} />
        </button>
        {actions}
      </div>
    </div>
  );
}
