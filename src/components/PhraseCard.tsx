import { useState } from 'react';
import { CheckCircle, AlertCircle, Volume2, BookOpen, MessageCircleQuestion, Music, Pencil } from 'lucide-react';
import type { PhraseEntity, LearningStatus } from '../types/schema';
import useLanguage from '../hooks/useLanguage';
import { useTTS } from '../hooks/useTTS';
import { useDailyStats } from '../hooks/useDailyStats';

interface PhraseCardProps {
  item: PhraseEntity;
  status: LearningStatus;
  side: 'front' | 'back';
  onSpeak?: () => void;
  onAiExplain?: (e: React.MouseEvent) => void;
  onOpenMemo?: (e: React.MouseEvent) => void;
  onEdit?: () => void;
  className?: string;
}

export function FlippablePhraseCard({ 
  item, 
  status, 
  onFlip,
  className = ""
}: { 
  item: PhraseEntity, 
  status: LearningStatus, 
  onFlip?: () => void,
  className?: string
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { speak } = useTTS();
  const { increment } = useDailyStats();

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFlipped && onFlip) {
        onFlip();
    }
    setIsFlipped(!isFlipped);
  };
  
  return (
    <div 
      className="cursor-pointer transition-transform duration-200 active:scale-95"
      onClick={handleFlip}
    >
        <PhraseCard 
            item={item} 
            status={status} 
            side={isFlipped ? 'back' : 'front'}
            className={`${className} hover:shadow-xl transition-all`}
            onSpeak={!isFlipped ? () => { speak(item.sentence); increment('speakCount'); } : undefined}
        />
    </div>
  );
}

export function PhraseCard({ 
  item, 
  status, 
  side, 
  onSpeak, 
  onAiExplain, 
  onOpenMemo,
  onEdit,
  className = ""
}: PhraseCardProps) {
  const { t } = useLanguage();
  const [showSongInfo, setShowSongInfo] = useState(false);
  const isCompleted = status.completedIds.includes(item.id);
  const isIncorrect = status.incorrectIds.includes(item.id);

  if (side === 'front') {
    return (
      <div className={`bg-blue-50 dark:bg-gray-800 rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700 flex flex-col p-6 text-center min-h-[200px] relative ${className}`}>
              <div className="absolute top-4 right-4 flex gap-1 z-10">
                {isCompleted && (
                   <div className="relative group/icon">
                     <CheckCircle className="text-green-500" size={24} />
                     <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black/80 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none shadow-lg">
                       {t('learn.passed')} {status.quizStats?.[item.id]?.correct.join(', ') || 'N/A'}
                     </div>
                   </div>
                )}
                {isIncorrect && (
                   <div className="relative group/icon">
                     <AlertCircle className="text-red-500" size={24} />
                     <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black/80 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none shadow-lg">
                       {t('learn.failed')} {status.quizStats?.[item.id]?.incorrect.join(', ') || t('learn.reviewNeeded')}
                     </div>
                   </div>
                )}
              </div>        
        {showSongInfo && item.song && (
          <div 
             className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 rounded-3xl z-20 text-white transition-opacity cursor-pointer"
             onClick={(e) => { e.stopPropagation(); setShowSongInfo(false); }}
          >
             <img src={item.song.thumbnailUrl} alt="Thumbnail" className="w-48 h-32 object-cover rounded-lg mb-4 shadow-lg border border-gray-700" />
             <h3 className="font-bold text-xl text-center mb-1 line-clamp-2">{item.song.title}</h3>
             <p className="text-gray-400 font-medium mb-8">{item.song.artist}</p>
             <p className="text-xs text-gray-500">{t('common.tapToClose')}</p>
          </div>
        )}

        <div className="flex-none mb-4">
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{t('common.expression')}</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-bold break-words w-full text-blue-900 dark:text-blue-100 leading-snug">
            {item.sentence}
          </h2>
          {item.pronunciation && !item.tags.some(t => t.toLowerCase() === 'english' || t === '영어') && (
            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium text-lg break-words w-full">
              {item.pronunciation}
            </p>
          )}
          <div className="flex gap-2 mt-4 flex-wrap justify-center w-full">
             {item.tags.map(tag => (
               <span key={tag} className="text-xs px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-500 flex-shrink-0">
                 #{tag}
               </span>
             ))}
          </div>
          
          {item.memo && onOpenMemo && (
              <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenMemo(e); }}
                  className="mt-4 flex items-center gap-1 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
              >
                  <BookOpen size={12} /> {t('common.viewMemo')}
              </button>
          )}
        </div>

        {(onSpeak || onAiExplain) && (
          <div className="flex-none mt-4 pt-2">
            <div className="flex justify-center gap-3">
              {onSpeak && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSpeak(); }}
                  className="p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:scale-95 transition-all"
                >
                  <Volume2 size={24} />
                </button>
              )}
              
              {item.memo && onOpenMemo && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenMemo(e); }}
                  className="p-4 bg-yellow-500 text-white rounded-full shadow-lg hover:bg-yellow-600 active:scale-95 transition-all"
                >
                  <BookOpen size={24} />
                </button>
              )}

              {onAiExplain && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAiExplain(e); }}
                  className="p-4 bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-300 rounded-full shadow-lg border border-blue-100 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 active:scale-95 transition-all"
                >
                  <MessageCircleQuestion size={24} />
                </button>
              )}

              {onEdit && (
                  <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(); }}
                      className="p-4 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all"
                  >
                      <Pencil size={24} />
                  </button>
              )}

              {item.song && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowSongInfo(!showSongInfo); }}
                  className="p-4 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                >
                  <Music size={24} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col p-6 text-center min-h-[200px] relative ${className}`}>
      <div className="absolute top-4 right-4 flex gap-1 z-10">
        {isCompleted && (
           <div className="relative group/icon">
             <CheckCircle className="text-green-500" size={24} />
             <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black/80 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none shadow-lg">
               {t('learn.passed')} {status.quizStats?.[item.id]?.correct.join(', ') || 'N/A'}
             </div>
           </div>
        )}
        {isIncorrect && (
           <div className="relative group/icon">
             <AlertCircle className="text-red-500" size={24} />
             <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black/80 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none shadow-lg">
               {t('learn.failed')} {status.quizStats?.[item.id]?.incorrect.join(', ') || t('learn.reviewNeeded')}
             </div>
           </div>
        )}
      </div>
      
      <div className="flex-none mb-4">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('builder.meaningLabel')}</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl md:text-3xl font-bold break-words w-full leading-snug">
          {item.meaning}
        </h2>
        <div className="flex gap-2 mt-6 flex-wrap justify-center w-full">
           {isCompleted && (
             <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium flex-shrink-0">{t('common.learned')}</span>
           )}
           {isIncorrect && (
             <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-medium flex-shrink-0">{t('common.review')}</span>
           )}
        </div>
      </div>
    </div>
  );
}
