import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PhraseCard } from '../../components/PhraseCard';
import { FunButton } from '../../components/FunButton';
import { useTTS } from '../../hooks/useTTS';
import { useDailyStats } from '../../hooks/useDailyStats';
import useLanguage from '../../hooks/useLanguage';
import type { PhraseEntity, LearningStatus } from '../../types/schema';

interface CardDeckProps {
  displayList: PhraseEntity[];
  currentIndex: number;
  status: LearningStatus;
  isFlipped: boolean;
  setIsFlipped: (flipped: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onAiExplain: (e: React.MouseEvent) => void;
  onOpenMemo: (e: React.MouseEvent) => void;
  onEdit: () => void;
}

export function CardDeck({
  displayList,
  currentIndex,
  status,
  isFlipped,
  setIsFlipped,
  onNext,
  onPrev,
  onAiExplain,
  onOpenMemo,
  onEdit
}: CardDeckProps) {
  const { t } = useLanguage();
  const { speak } = useTTS();
  const { increment } = useDailyStats();
  
  const [swipeDiff, setSwipeDiff] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startTime = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    startX.current = e.clientX;
    startTime.current = Date.now();
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX.current;
    setSwipeDiff(diff);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const diff = e.clientX - startX.current;
    
    // Use performance.now() if available or a ref for time
    // eslint-disable-next-line react-hooks/purity
    const endTime = Date.now(); 
    const timeElapsed = endTime - startTime.current;
    
    const threshold = 100;
    const tapThreshold = 5;

    if (Math.abs(diff) > threshold) {
       const direction = diff > 0 ? 'right' : 'left';
       finishSwipe(direction);
    } else if (Math.abs(diff) < tapThreshold && timeElapsed < 300) {
       if (!isFlipped) {
         speak(displayList[currentIndex].sentence);
         increment('speakCount');
       }
       setIsFlipped(!isFlipped);
       increment('reviewCount', 1, displayList[currentIndex].id);
       setSwipeDiff(0);
    } else {
       setSwipeDiff(0);
    }
  };

  const finishSwipe = (direction: 'left' | 'right') => {
      const endX = direction === 'right' ? 1000 : -1000;
      setSwipeDiff(endX);

      setTimeout(() => {
          if (direction === 'right') {
              onPrev();
          } else {
              onNext();
          }
          setSwipeDiff(0);
      }, 300);
  };

  const getCardStyle = () => {
      const rotate = swipeDiff / 20;
      const opacity = Math.max(0, 1 - Math.abs(swipeDiff) / 800);
      return {
          transform: `translateX(${swipeDiff}px) rotate(${rotate}deg)`,
          opacity: opacity,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s',
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none' as const
      };
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-none mb-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / displayList.length) * 100}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-400 mt-1">
          {currentIndex + 1} / {displayList.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col perspective-1000 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center w-full min-h-full">
          <div 
            key={currentIndex}
            className="relative w-full max-w-md group my-auto select-none"
            style={getCardStyle()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div 
              className={`w-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} grid grid-cols-1 grid-rows-1`}
            >
              <PhraseCard
                item={displayList[currentIndex]}
                status={status}
                side="front"
                onSpeak={() => {
                  speak(displayList[currentIndex].sentence);
                  increment('speakCount');
                }}
                onAiExplain={onAiExplain}
                onOpenMemo={onOpenMemo}
                onEdit={onEdit}
                className="col-start-1 row-start-1 backface-hidden"
              />

              <PhraseCard
                item={displayList[currentIndex]}
                status={status}
                side="back"
                className="col-start-1 row-start-1 backface-hidden rotate-y-180"
              />
            </div>
          </div>

          <div className="flex-none flex gap-4 mt-4 mb-4 h-14 w-full max-w-md">
            <FunButton 
              type="button"
              onClick={onPrev}
              className="flex-1 flex items-center justify-center gap-2"
              variant="neutral"
            >
              <ChevronLeft size={20} /> {t('learn.prev')}
            </FunButton>
            <FunButton 
              type="button"
              onClick={onNext}
              className="flex-1 flex items-center justify-center gap-2"
              variant="primary"
            >
              {t('learn.next')} <ChevronRight size={20} />
            </FunButton>
          </div>
        </div>
      </div>
    </div>
  );
}
