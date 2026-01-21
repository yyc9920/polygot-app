import { X, Tag } from 'lucide-react';
import type { PhraseItem, LearningStatus } from '../types';
import { useDailyStats } from '../hooks/useDailyStats';
import { FlippablePhraseCard } from './PhraseCard';
import useLanguage from '../hooks/useLanguage';

interface KeywordPhrasesModalProps {
  keyword: string | null;
  phrases: PhraseItem[];
  status: LearningStatus;
  onClose: () => void;
}

export function KeywordPhrasesModal({ keyword, phrases, status, onClose }: KeywordPhrasesModalProps) {
  const { t } = useLanguage();
  const { increment } = useDailyStats();

  if (!keyword) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-white/20 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="p-5 flex justify-between items-center bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-blue-500" />
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100">#{keyword}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {phrases.length > 0 ? (
            phrases.map(item => (
              <FlippablePhraseCard 
                key={item.id} 
                item={item} 
                status={status} 
                className="!min-h-[180px] !p-6"
                onFlip={() => increment('reviewCount', 1, item.id)} 
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">{t('home.noPhrasesForKeyword')}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-center">
            <button 
                onClick={onClose}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl font-bold transition-colors"
            >
                {t('common.close') || 'Close'}
            </button>
        </div>
      </div>
    </div>
  );
}
