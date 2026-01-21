import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePhraseAppContext } from '../context/PhraseContext';
import { useMusicContext } from '../context/MusicContext';
import { FlippablePhraseCard } from '../components/PhraseCard';
import { Sparkles, Brain, Calendar, Music as MusicIcon, Tag, CheckCircle2, RefreshCw } from 'lucide-react';
import { StarterPackageSelection } from '../components/StarterPackageSelection';
import useLanguage from '../hooks/useLanguage';
import useLocalStorage from '../hooks/useLocalStorage';
import { useDailyStats } from '../hooks/useDailyStats';
import type { PlaylistItem, DailyMission, DailyRecommendation } from '../types';

import { KeywordPhrasesModal } from '../components/KeywordPhrasesModal';
import { HomeSongView } from './home/HomeSongView';

const MISSION_POOL: Omit<DailyMission, 'text'>[] = [
  { id: 'review_5', type: 'review', target: 5 },
  { id: 'quiz_1', type: 'quiz', target: 1 },
  { id: 'speak_5', type: 'speak', target: 5 },
  { id: 'add_3', type: 'add', target: 3 },
  { id: 'listen_song', type: 'listen', target: 1 },
  { id: 'review_10', type: 'review', target: 10 },
  { id: 'speak_10', type: 'speak', target: 10 },
];

export function HomeView() {
  const { phraseList, status, setCurrentView, setCustomQuizQueue, apiKey } = usePhraseAppContext();
  const { playlist } = useMusicContext();
  const { t, language, LANGUAGE_NAMES } = useLanguage();
  const { stats, increment } = useDailyStats();
  
  const [dailyData, setDailyData] = useLocalStorage<DailyRecommendation | null>('dailyRecommendation', null, (data) => {
    if (!data) return null;
    const rec = data as Partial<DailyRecommendation>;
    if (!rec.missions || !Array.isArray(rec.missions) || !Array.isArray(rec.phraseIds)) {
        return null; 
    }
    return data;
  });
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedHomeSong, setSelectedHomeSong] = useState<PlaylistItem | null>(null);

  const handleOpenSong = (song: PlaylistItem) => {
    increment('listenCount');
    setSelectedHomeSong(song);
  };

  const handleCloseSong = useCallback(() => setSelectedHomeSong(null), []);

  const generateDaily = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const unlearned = phraseList.filter(item => !status.completedIds.includes(item.id));
    const pool = unlearned.length >= 3 ? unlearned : phraseList;
    const shuffledPhrases = [...pool].sort(() => 0.5 - Math.random());
    const selectedPhrases = shuffledPhrases.slice(0, 3).map(p => p.id);

    let selectedSongId = null;
    let selectedSongPhrases: string[] = [];
    if (playlist.length > 0) {
        const randomSong = playlist[Math.floor(Math.random() * playlist.length)];
        selectedSongId = randomSong.id;
        
        // Select up to 5 random phrases from this song
        const songVideoId = randomSong.video.videoId;
        const songPhrases = phraseList.filter(p => p.song?.videoId === songVideoId);
        selectedSongPhrases = songPhrases
            .sort(() => 0.5 - Math.random())
            .slice(0, 5)
            .map(p => p.id);
    }

    const allTags = Array.from(new Set(phraseList.flatMap(p => p.tags)));
    const shuffledTags = allTags.sort(() => 0.5 - Math.random());
    const selectedKeywords = shuffledTags.slice(0, 5);
    
    // Select up to 5 random phrases for each keyword
    const keywordPhraseMap: Record<string, string[]> = {};
    selectedKeywords.forEach(keyword => {
        const phrasesForTag = phraseList.filter(p => p.tags.includes(keyword));
        keywordPhraseMap[keyword] = phrasesForTag
            .sort(() => 0.5 - Math.random())
            .slice(0, 5)
            .map(p => p.id);
    });

    const shuffledMissions = [...MISSION_POOL].sort(() => 0.5 - Math.random());
    const selectedMissions = shuffledMissions.slice(0, 3);
    
    setDailyData({
        date: today,
        phraseIds: selectedPhrases,
        songId: selectedSongId,
        keywords: selectedKeywords,
        missions: selectedMissions,
        keywordPhraseIds: keywordPhraseMap,
        songPhraseIds: selectedSongPhrases
    });
  }, [phraseList, playlist, status.completedIds, setDailyData]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!dailyData || dailyData.date !== today) {
        if (phraseList.length > 0) {
            generateDaily();
        }
    }
  }, [dailyData, phraseList, generateDaily]);

  const recommendedPhrases = useMemo(() => {
    if (!dailyData) return [];
    return phraseList.filter(p => dailyData.phraseIds.includes(p.id));
  }, [dailyData, phraseList]);

  const recommendedSong = useMemo(() => {
    if (!dailyData?.songId) return null;
    return playlist.find(p => p.id === dailyData.songId);
  }, [dailyData, playlist]);

  const keywordPhrases = useMemo(() => {
    if (!selectedKeyword || !dailyData?.keywordPhraseIds) return [];
    
    // Use the stored random selection if available
    const storedIds = dailyData.keywordPhraseIds[selectedKeyword];
    if (storedIds) {
        return phraseList.filter(p => storedIds.includes(p.id));
    }
    
    // Fallback to old behavior if data missing (e.g. old data)
    return phraseList.filter(p => p.tags.includes(selectedKeyword)).slice(0, 5);
  }, [selectedKeyword, phraseList, dailyData]);

  const progressPercentage = useMemo(() => {
    if (phraseList.length === 0) return 0;
    return (status.completedIds.length / phraseList.length) * 100;
  }, [phraseList.length, status.completedIds.length]);

  const isMissionCompleted = (mission: DailyMission) => {
      switch (mission.type) {
          case 'review': return stats.reviewCount >= mission.target;
          case 'speak': return stats.speakCount >= mission.target;
          case 'quiz': return stats.quizCount >= mission.target;
          case 'add': return stats.addCount >= mission.target;
          case 'listen': return stats.listenCount >= mission.target;
          default: return false;
      }
  };

  const getProgress = (mission: DailyMission) => {
      let current = 0;
      switch (mission.type) {
          case 'review': current = stats.reviewCount; break;
          case 'speak': current = stats.speakCount; break;
          case 'quiz': current = stats.quizCount; break;
          case 'add': current = stats.addCount; break;
          case 'listen': current = stats.listenCount; break;
      }
      return Math.min(current, mission.target);
  };

  const getMissionText = (mission: DailyMission) => {
    switch (mission.type) {
      case 'review': return t('home.mission.review').replace('{{count}}', String(mission.target));
      case 'quiz': return t('home.mission.quiz');
      case 'speak': return t('home.mission.speak').replace('{{count}}', String(mission.target));
      case 'add': return t('home.mission.add').replace('{{count}}', String(mission.target));
      case 'listen': return t('home.mission.listen');
      default: return '';
    }
  };

  const handleTakeDailyQuiz = () => {
    if (!dailyData) return;
    
    localStorage.setItem('quizMode', JSON.stringify('daily'));
    
    setCustomQuizQueue([]);
    
    setCurrentView('quiz');
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('home.welcomeBack')}</h2>
        <p className="text-indigo-100 mb-6">{t('home.progressMessage').replace('{{count}}', String(status.completedIds.length))}</p>
        
        <div className="bg-black/20 rounded-full h-3 w-full backdrop-blur-sm">
          <div 
            className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2 text-indigo-200">
          <span>{t('home.percentComplete').replace('{{percent}}', progressPercentage.toFixed(2))}</span>
          <span>{t('home.totalPhrases').replace('{{count}}', String(phraseList.length))}</span>
        </div>
      </div>

      {dailyData && dailyData.missions?.length > 0 && (
        <div className="flex flex-col gap-3">
             <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800 dark:text-white px-2">
                <Calendar className="text-green-500" size={20} />
                {t('home.dailyMission')}
            </h3>
            {dailyData.missions?.map(mission => {
                const completed = isMissionCompleted(mission);
                const current = getProgress(mission);
                return (
                    <div 
                        key={mission.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center gap-4 shadow-sm
                        ${completed 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                            : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}
                    >
                        <div className={`p-2 rounded-full flex-shrink-0 ${completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                            {completed ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-medium ${completed ? 'text-green-700 dark:text-green-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {getMissionText(mission)}
                                </span>
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                    {current}/{mission.target}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${completed ? 'bg-green-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${(current / mission.target) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800 dark:text-white">
            <Sparkles className="text-yellow-500" size={20} />
            {t('home.todaysPicks')}
          </h3>
          <button 
             onClick={generateDaily}
             className="text-gray-400 hover:text-blue-500 transition-colors p-2"
             title="Refresh recommendations"
          >
             <RefreshCw size={16} />
          </button>
        </div>

        {recommendedPhrases.length > 0 ? (
          <div className="flex flex-col gap-6">
            {recommendedPhrases.map(item => (
              <FlippablePhraseCard 
                key={item.id} 
                item={item} 
                status={status} 
                className="!min-h-[200px] !p-6"
                onFlip={() => increment('reviewCount', 1, item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
             <p className="text-gray-500 dark:text-gray-400 mb-4">{t('home.noPhrases')}</p>
             <button onClick={() => setCurrentView('builder')} className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold">
                {t('home.createNewList')}
             </button>
          </div>
        )}
      </div>

      {recommendedSong && (
        <div>
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800 dark:text-white">
                    <MusicIcon className="text-pink-500" size={20} />
                    {t('home.todaysSong')}
                </h3>
            </div>
            <div 
                onClick={() => handleOpenSong(recommendedSong)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-gray-100 dark:border-gray-700 flex gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
            >
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                    <img src={recommendedSong.video.thumbnailUrl} alt={recommendedSong.song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
                            <MusicIcon size={16} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                    <h4 className="font-bold text-lg truncate pr-2 text-gray-900 dark:text-gray-100">{recommendedSong.song.title}</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{recommendedSong.song.artist}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 rounded-full w-fit">
                        {recommendedSong.genre || 'Music'}
                    </span>
                </div>
            </div>
        </div>
      )}

      {dailyData && dailyData.keywords?.length > 0 && (
         <div>
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800 dark:text-white">
                    <Tag className="text-blue-500" size={20} />
                    {t('home.todaysKeywords')}
                </h3>
            </div>
            <div className="flex flex-wrap gap-3">
                {dailyData.keywords?.map(keyword => (
                    <button
                        key={keyword}
                        onClick={() => setSelectedKeyword(keyword)}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-gray-600 dark:text-gray-300 font-medium"
                    >
                        #{keyword}
                    </button>
                ))}
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 gap-3 mt-4">
        <button 
          onClick={handleTakeDailyQuiz}
          className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex flex-col items-center gap-2"
        >
          <Brain size={32} />
          <span className="font-bold">{t('home.takeDailyQuiz')}</span>
        </button>
        <p className="text-xs text-center text-gray-400 px-4">
            {t('home.dailyQuizDesc')}
        </p>
      </div>

      {phraseList.length < 20 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm mt-4">
           <StarterPackageSelection />
        </div>
      )}

      {/* Keyword Phrases Modal */}
      <KeywordPhrasesModal
        keyword={selectedKeyword}
        phrases={keywordPhrases}
        status={status}
        onClose={() => setSelectedKeyword(null)}
      />

      {/* Independent Song View Portal */}
      {selectedHomeSong && (
          <HomeSongView 
             song={selectedHomeSong}
             onClose={handleCloseSong}
             apiKey={apiKey}
             language={language}
             LANGUAGE_NAMES={LANGUAGE_NAMES}
             t={t}
          />
      )}
    </div>
  );
}
