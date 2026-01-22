import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePhraseAppContext } from '../context/PhraseContext';
import { useMusicContext } from '../context/MusicContext';
import { FlippablePhraseCard } from '../components/PhraseCard';
import { Sparkles, Brain, Calendar, Music as MusicIcon, Tag, CheckCircle2, RefreshCw, History } from 'lucide-react';
import { StarterPackageSelection } from '../components/StarterPackageSelection';
import useLanguage from '../hooks/useLanguage';
import useCloudStorage from '../hooks/useCloudStorage';
import { useDailyStats } from '../hooks/useDailyStats';
import type { DailyStats } from '../hooks/useDailyStats';
import { getLocalDate, formatDateDisplay } from '../lib/dateUtils';
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

const mergeDailyHistory = (local: Record<string, DailyRecommendation>, cloud: Record<string, DailyRecommendation>): Record<string, DailyRecommendation> => {
    const merged = { ...local };
    for (const [key, cloudVal] of Object.entries(cloud)) {
        const localVal = merged[key];
        if (!localVal) {
             merged[key] = cloudVal;
        } else {
             const cloudTime = cloudVal.updatedAt || 0;
             const localTime = localVal.updatedAt || 0;
             if (cloudTime > localTime) {
                 merged[key] = cloudVal;
             }
        }
    }
    return merged;
};

export function HomeView() {
  const { phraseList, status, setCurrentView, setCustomQuizQueue, apiKey } = usePhraseAppContext();
  const { playlist } = useMusicContext();
  const { t, language, LANGUAGE_NAMES } = useLanguage();
  const { stats, increment, getStatsForDate } = useDailyStats();
  
  const [dailyHistory, setDailyHistory] = useCloudStorage<Record<string, DailyRecommendation>>(
    'daily_recommendation_history', 
    {},
    undefined,
    mergeDailyHistory
  );
  
  const today = getLocalDate();
  const dailyData = dailyHistory[today] || null;

  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedHomeSong, setSelectedHomeSong] = useState<PlaylistItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleOpenSong = (song: PlaylistItem) => {
    increment('listenCount');
    setSelectedHomeSong(song);
  };

  const handleCloseSong = useCallback(() => setSelectedHomeSong(null), []);

  const generateDaily = useCallback((keepMissions = false) => {
    const todayStr = getLocalDate();
    
    const unlearned = phraseList.filter(item => !status.completedIds.includes(item.id));
    const pool = unlearned.length >= 3 ? unlearned : phraseList;
    const shuffledPhrases = [...pool].sort(() => 0.5 - Math.random());
    const selectedPhrases = shuffledPhrases.slice(0, 3).map(p => p.id);

    let selectedSongId = null;
    let selectedSongPhrases: string[] = [];
    if (playlist.length > 0) {
        const randomSong = playlist[Math.floor(Math.random() * playlist.length)];
        selectedSongId = randomSong.id;
        
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
    
    const keywordPhraseMap: Record<string, string[]> = {};
    selectedKeywords.forEach(keyword => {
        const phrasesForTag = phraseList.filter(p => p.tags.includes(keyword));
        keywordPhraseMap[keyword] = phrasesForTag
            .sort(() => 0.5 - Math.random())
            .slice(0, 5)
            .map(p => p.id);
    });

    let selectedMissions;
    if (keepMissions && dailyData?.missions) {
        selectedMissions = dailyData.missions;
    } else {
        const shuffledMissions = [...MISSION_POOL].sort(() => 0.5 - Math.random());
        selectedMissions = shuffledMissions.slice(0, 3);
    }
    
    const newDaily: DailyRecommendation = {
        date: todayStr,
        phraseIds: selectedPhrases,
        songId: selectedSongId,
        keywords: selectedKeywords,
        missions: selectedMissions,
        keywordPhraseIds: keywordPhraseMap,
        songPhraseIds: selectedSongPhrases,
        updatedAt: Date.now()
    };

    setDailyHistory(prev => ({
        ...prev,
        [todayStr]: newDaily
    }));
  }, [phraseList, playlist, status.completedIds, setDailyHistory, dailyData]);

  useEffect(() => {
    if (!dailyData) {
        if (phraseList.length > 0) {
            generateDaily(false);
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
    
    const storedIds = dailyData.keywordPhraseIds[selectedKeyword];
    if (storedIds) {
        return phraseList.filter(p => storedIds.includes(p.id));
    }
    
    return phraseList.filter(p => p.tags.includes(selectedKeyword)).slice(0, 5);
  }, [selectedKeyword, phraseList, dailyData]);

  const progressPercentage = useMemo(() => {
    if (phraseList.length === 0) return 0;
    return (status.completedIds.length / phraseList.length) * 100;
  }, [phraseList.length, status.completedIds.length]);

  const isMissionCompleted = (mission: DailyMission, dateStats: DailyStats) => {
      switch (mission.type) {
          case 'review': return dateStats.reviewCount >= mission.target;
          case 'speak': return dateStats.speakCount >= mission.target;
          case 'quiz': return dateStats.quizCount >= mission.target;
          case 'add': return dateStats.addCount >= mission.target;
          case 'listen': return dateStats.listenCount >= mission.target;
          default: return false;
      }
  };

  const getProgress = (mission: DailyMission, dateStats: DailyStats) => {
      let current = 0;
      switch (mission.type) {
          case 'review': current = dateStats.reviewCount; break;
          case 'speak': current = dateStats.speakCount; break;
          case 'quiz': current = dateStats.quizCount; break;
          case 'add': current = dateStats.addCount; break;
          case 'listen': current = dateStats.listenCount; break;
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

  const getHistoryCompletion = (date: string) => {
      const rec = dailyHistory[date];
      const dateStats = getStatsForDate(date);
      if (!rec || !rec.missions || rec.missions.length === 0) return 0;

      const completedCount = rec.missions.filter(m => isMissionCompleted(m, dateStats)).length;
      return Math.round((completedCount / rec.missions.length) * 100);
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
             <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800 dark:text-white">
                    <Calendar className="text-green-500" size={20} />
                    {t('home.dailyMission')}
                </h3>
                <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                    <History size={20} />
                </button>
             </div>

             {showHistory && (
                 <div className="mb-4 overflow-x-auto pb-2">
                     <div className="flex gap-2">
                         {Object.keys(dailyHistory)
                             .sort((a, b) => b.localeCompare(a))
                             .slice(0, 7)
                             .map(date => {
                                 const isToday = date === today;
                                 const completion = getHistoryCompletion(date);
                                 return (
                                     <div key={date} className={`flex-shrink-0 p-3 rounded-xl border ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'} flex flex-col items-center min-w-[80px]`}>
                                         <span className="text-xs text-gray-500">{formatDateDisplay(date, language)}</span>
                                         <span className={`font-bold mt-1 ${completion === 100 ? 'text-green-500' : 'text-gray-700'}`}>{completion}%</span>
                                     </div>
                                 );
                             })}
                     </div>
                 </div>
             )}

            {dailyData.missions?.map(mission => {
                const completed = isMissionCompleted(mission, stats);
                const current = getProgress(mission, stats);
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
             onClick={() => generateDaily(true)}
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

      <KeywordPhrasesModal
        keyword={selectedKeyword}
        phrases={keywordPhrases}
        status={status}
        onClose={() => setSelectedKeyword(null)}
      />

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
