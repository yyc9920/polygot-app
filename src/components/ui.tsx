
import React from 'react';

export function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${active ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} type="button">
      <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}

export const GlobalStyles = () => (
  <style>{`
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
    .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);
