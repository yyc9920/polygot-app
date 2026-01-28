import { Suspense, lazy } from 'react';
import {
  BookOpen,
  Brain,
  Settings,
  PlusCircle,
  Moon,
  Sun,
  Sparkles,
  Music,
  Home,
} from 'lucide-react';
import { GlobalStyles, NavButton } from './components/ui';
import useTheme from './hooks/useTheme';
import { PhraseAppProvider, usePhraseAppContext } from './context/PhraseContext';
import { AuthProvider } from './context/AuthContext';
import { MusicProvider } from './context/MusicContext';
import { MigrationProvider } from './context/MigrationContext';
import useLanguage from './hooks/useLanguage';
import { LoadingSpinner } from './components/LoadingSpinner';

const LearnView = lazy(() => import('./views/LearnView').then(module => ({ default: module.LearnView })));
const QuizView = lazy(() => import('./views/QuizView').then(module => ({ default: module.QuizView })));
const BuilderView = lazy(() => import('./views/BuilderView').then(module => ({ default: module.BuilderView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(module => ({ default: module.SettingsView })));
const MusicLearnView = lazy(() => import('./views/MusicLearnView').then(module => ({ default: module.MusicLearnView })));
const HomeView = lazy(() => import('./views/HomeView').then(module => ({ default: module.HomeView })));

function AppContent() {
  const { currentView, setCurrentView, customQuizQueue } = usePhraseAppContext();
  const { darkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className={`fixed inset-0 flex flex-col transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans`}>
      {/* Header */}
      <header className="flex-none sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent truncate pr-4 flex items-center gap-2">
          {t('app.title')} <Sparkles size={16} className="text-yellow-500" />
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
        <div className="absolute inset-0 overflow-y-auto p-4 pb-0">
          <Suspense fallback={<LoadingSpinner />}>
            {currentView === 'home' && <HomeView />}
            {currentView === 'learn' && <LearnView />}
            {currentView === 'quiz' && <QuizView customQueue={customQuizQueue.length > 0 ? customQuizQueue : undefined} />}
            {currentView === 'builder' && <BuilderView />}
            {currentView === 'settings' && <SettingsView />}
            {currentView === 'music' && <MusicLearnView />}
          </Suspense>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-20">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <NavButton
            active={currentView === 'home'}
            onClick={() => setCurrentView('home')}
            icon={<Home size={24} />}
            label={t('nav.home')}
          />
          <NavButton
            active={currentView === 'learn'}
            onClick={() => setCurrentView('learn')}
            icon={<BookOpen size={24} />}
            label={t('nav.learn')}
          />
          <NavButton
            active={currentView === 'music'}
            onClick={() => setCurrentView('music')}
            icon={<Music size={24} />}
            label={t('nav.music')}
          />
          <NavButton
            active={currentView === 'quiz'}
            onClick={() => setCurrentView('quiz')}
            icon={<Brain size={24} />}
            label={t('nav.quiz')}
          />
          <NavButton
            active={currentView === 'builder'}
            onClick={() => setCurrentView('builder')}
            icon={<PlusCircle size={24} />}
            label={t('nav.build')}
          />
          <NavButton
            active={currentView === 'settings'}
            onClick={() => setCurrentView('settings')}
            icon={<Settings size={24} />}
            label={t('nav.settings')}
          />
        </div>
      </nav>
      
      <GlobalStyles />
    </div>
  );
}

export default function App() {
  return (
    <MigrationProvider>
      <AuthProvider>
        <PhraseAppProvider>
          <MusicProvider>
            <AppContent />
          </MusicProvider>
        </PhraseAppProvider>
      </AuthProvider>
    </MigrationProvider>
  );
}
