import React, { useState } from 'react';
import { 
  BookOpen, 
  Brain, 
  Settings, 
  PlusCircle, 
  Moon, 
  Sun, 
  Sparkles,
} from 'lucide-react';
import type { ViewMode } from './types';
import { GlobalStyles, NavButton } from './components/ui';
import useTheme from './hooks/useTheme';
import { VocabAppProvider } from './context/VocabContext';
import { LearnView } from './views/LearnView';
import { QuizView } from './views/QuizView';
import { BuilderView } from './views/BuilderView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('learn');
  const { darkMode, toggleTheme } = useTheme();

  return (
    <VocabAppProvider>
      <div className={`fixed inset-0 flex flex-col transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans`}>
        {/* Header */}
        <header className="flex-none sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent truncate pr-4 flex items-center gap-2">
            Learn Language via CSV <Sparkles size={16} className="text-yellow-500" />
          </h1>
          <button 
            onClick={toggleTheme}
            className="flex-none p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden w-full max-w-md mx-auto relative">
          <div className="absolute inset-0 overflow-y-auto p-4 pb-20">
            {currentView === 'learn' && <LearnView />}
            {currentView === 'quiz' && <QuizView />}
            {currentView === 'builder' && <BuilderView />}
            {currentView === 'settings' && <SettingsView />}
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="flex-none bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-20">
          <div className="max-w-md mx-auto flex justify-around items-center h-16">
            <NavButton 
              active={currentView === 'learn'} 
              onClick={() => setCurrentView('learn')} 
              icon={<BookOpen size={24} />} 
              label="학습" 
            />
            <NavButton 
              active={currentView === 'quiz'} 
              onClick={() => setCurrentView('quiz')} 
              icon={<Brain size={24} />} 
              label="퀴즈" 
            />
            <NavButton 
              active={currentView === 'builder'} 
              onClick={() => setCurrentView('builder')} 
              icon={<PlusCircle size={24} />} 
              label="빌더" 
            />
            <NavButton 
              active={currentView === 'settings'} 
              onClick={() => setCurrentView('settings')} 
              icon={<Settings size={24} />} 
              label="설정" 
            />
          </div>
        </nav>
        
        <GlobalStyles />
      </div>
    </VocabAppProvider>
  );
}