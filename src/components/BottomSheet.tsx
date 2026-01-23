import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimation, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  initialSnap?: number; // 0 to 1, where 1 is bottom (closed) and 0 is top (fully open)
  modal?: boolean;
  peekHeight?: number;
}

export function BottomSheet({ 
  children, 
  isOpen, 
  onClose, 
  title, 
  initialSnap = 0.5,
  modal = true,
  peekHeight = 80
}: BottomSheetProps) {
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const controls = useAnimation();
  const dragControls = useDragControls();

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SNAP_TOP = 0;
  const SNAP_INITIAL = windowHeight * initialSnap;
  const SNAP_PEEK = windowHeight - peekHeight;
  const SNAP_CLOSED = windowHeight;

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure component is fully mounted/measured
      const timer = setTimeout(() => {
        controls.start({ y: SNAP_INITIAL });
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen, SNAP_INITIAL, controls]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    
    if (velocity > 500) {
      if (modal) onClose();
      else controls.start({ y: SNAP_PEEK });
    } else if (velocity < -500) {
      controls.start({ y: SNAP_TOP });
    } else {
      if (info.offset.y > 100) {
         if (modal) onClose();
         else controls.start({ y: SNAP_PEEK });
      } else if (info.offset.y < -100) {
         controls.start({ y: SNAP_TOP });
      } else {
         controls.start({ y: SNAP_INITIAL });
      }
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none isolate"
          initial={{ opacity: 1 }}
          exit={{ opacity: 1, transition: { duration: 0.5 } }}
        >
          {/* Backdrop */}
          {modal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            />
          )}

          {/* Sheet */}
          <motion.div
            initial={{ y: SNAP_CLOSED }}
            animate={controls}
            exit={{ y: SNAP_CLOSED }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="relative w-full bg-white dark:bg-gray-900 rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden pointer-events-auto h-full max-h-[100vh]"
            style={{ height: windowHeight }}
          >
            {/* Handle */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="flex-none flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 touch-none"
            >
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mb-3" />
              
              <div className="w-full px-6 flex justify-between items-center min-h-[40px]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate flex-1 pr-4">
                  {title}
                </h2>
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }} 
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Wrapper */}
            <div 
              className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-gray-900 touch-pan-y" 
              onPointerDown={(e) => e.stopPropagation()} 
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}