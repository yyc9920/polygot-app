import { User, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePhraseAppContext } from '../../context/PhraseContext';
import { FunButton } from '../../components/FunButton';
import useLanguage, { type Language } from '../../hooks/useLanguage';

interface UserProfileSectionProps {
  onShowLoginModal: () => void;
}

export function UserProfileSection({ onShowLoginModal }: UserProfileSectionProps) {
  const { user, signOut } = useAuth();
  const { t, LANGUAGE_NAMES } = useLanguage();
  const { status } = usePhraseAppContext();

  const learningLangName = status.learningLanguage 
    ? LANGUAGE_NAMES[status.learningLanguage as Language] || status.learningLanguage 
    : null;

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <User className="text-green-500" /> {t('settings.account')}
        </h3>
      </div>
      
      {user ? (
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border-2 border-green-500" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xl">
              {user.displayName?.[0] || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{user.displayName}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            {learningLangName && (
               <div className="flex items-center gap-1 mt-1 text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full w-fit">
                 <Globe size={12} />
                 <span>Learning: {learningLangName}</span>
               </div>
            )}
          </div>
          <button 
            onClick={() => signOut()}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title={t('settings.signOut')}
          >
            <LogOut size={20} />
          </button>
        </div>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">{t('settings.syncProgress')}</p>
          <FunButton 
            onClick={onShowLoginModal} 
            variant="primary" 
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <User size={18} /> {t('settings.signIn')}
          </FunButton>
          {learningLangName && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
               <Globe size={12} />
               <span>Currently learning: {learningLangName}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
