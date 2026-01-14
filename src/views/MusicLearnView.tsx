import React, { useState } from 'react';
import YouTube from 'react-youtube';
import { Search, Music, Plus, Check, Volume2, Loader2, Sparkles, User as UserIcon, Youtube } from 'lucide-react';
import { usePhraseAppContext } from '../context/PhraseContext';
import { searchYouTube, type YouTubeVideo } from '../lib/youtube';
import { generateSongLyrics, generatePhraseFromLyric } from '../lib/gemini';
import { searchGeniusSongs, type GeniusSong } from '../lib/lyrics';
import { FunButton } from '../components/FunButton';
import { generateId } from '../lib/utils';
import type { SongData, PhraseItem } from '../types';
import useLanguage from '../hooks/useLanguage';

export function MusicLearnView() {
  const { 
    apiKey, 
    youtubeApiKey, 
    geniusApiKey,
    setPhraseList, 
    phraseList, 
    voiceURI,
    musicState,
    setMusicState
  } = usePhraseAppContext();
  const { t } = useLanguage();
  
  const { 
      query, 
      results,
      geniusResults,
      selectedVideo, 
      selectedSong,
      materials, 
      isLoading, 
      isSearching,
      searchStep,
      activeTab 
  } = musicState;

  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const isSaved = (meaning: string, sentence: string) => {
    const id = generateId(meaning, sentence);
    return phraseList.some(v => v.id === id);
  };

  const updateState = (updates: Partial<typeof musicState>) => {
      setMusicState(prev => ({ ...prev, ...updates }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    updateState({ isSearching: true, searchStep: 'song', selectedSong: null, selectedVideo: null, materials: null, results: [], geniusResults: [] });
    
    try {
      const songs = await searchGeniusSongs(query, geniusApiKey);
      updateState({ geniusResults: songs });
    } catch (err) {
      const error = err as Error;
      alert(error.message);
    } finally {
      updateState({ isSearching: false });
    }
  };

  const handleSelectSong = async (song: GeniusSong) => {
    if (!youtubeApiKey) {
      alert(t('music.pleaseSetYoutubeKey'));
      return;
    }

    updateState({ 
      selectedSong: song, 
      isSearching: true,
      searchStep: 'video' 
    });

    try {
      const searchQuery = `${song.artist} ${song.title}`;
      const videos = await searchYouTube(searchQuery, youtubeApiKey);
      updateState({ results: videos });
    } catch (err) {
      const error = err as Error;
      alert(error.message);
      updateState({ searchStep: 'song', selectedSong: null });
    } finally {
      updateState({ isSearching: false });
    }
  };

  const handleSelectVideo = async (video: YouTubeVideo) => {
    updateState({ selectedVideo: video, materials: null });
    
    const cacheKey = `song_lyrics_${video.videoId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
        try {
            const parsedMaterials = JSON.parse(cached);
            updateState({ materials: parsedMaterials });
            return;
        } catch (e) {
            console.error("Failed to parse cached materials", e);
            localStorage.removeItem(cacheKey);
        }
    }

    if (!apiKey) {
        alert(t('music.geminiKeyMissing'));
        return;
    }

    updateState({ isLoading: true });
    try {
        const artist = selectedSong ? selectedSong.artist : video.artist;
        const title = selectedSong ? selectedSong.title : video.title;
        const songId = selectedSong ? selectedSong.id : undefined;

        const data = await generateSongLyrics(artist, title, apiKey, geniusApiKey, songId);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        updateState({ materials: data });
    } catch (err) {
        const error = err as Error;
        alert(t('music.failedGenerateMaterials').replace('{{error}}', error.message));
    } finally {
        updateState({ isLoading: false });
    }
  };

  const handleGenerateCard = async (line: string, index: number) => {
      if (!apiKey || !selectedVideo || !materials) return;
      setGeneratingIdx(index);
      try {
         const phraseData = await generatePhraseFromLyric(line, selectedVideo.artist, selectedVideo.title, apiKey);
         
         if (phraseData && phraseData.meaning && phraseData.sentence) {
             const newPhrase = {
                 meaning: phraseData.meaning,
                 sentence: phraseData.sentence,
                 pronunciation: phraseData.pronunciation || ''
             };
             
             const updatedLyrics = [...materials.lyrics];
             updatedLyrics[index] = { ...updatedLyrics[index], isGenerated: true };

             const updatedMaterials = {
                 ...materials,
                 lyrics: updatedLyrics,
                 phrases: [...(materials.phrases || []), newPhrase]
             };
             
             updateState({ materials: updatedMaterials });
             const cacheKey = `song_lyrics_${selectedVideo.videoId}`;
             localStorage.setItem(cacheKey, JSON.stringify(updatedMaterials));
         }
      } catch (err) {
         const error = err as Error;
         alert(t('music.failedGeneratePhrase').replace('{{error}}', error.message));
      } finally {
         setGeneratingIdx(null);
      }
  };

  const handleSavePhrase = (item: { meaning: string; sentence: string; pronunciation: string }) => {
      if (!selectedVideo) return;

      const songData: SongData = {
          videoId: selectedVideo.videoId,
          title: selectedVideo.title,
          artist: selectedVideo.artist,
          thumbnailUrl: selectedVideo.thumbnailUrl
      };

      const newItem: PhraseItem = {
          id: generateId(item.meaning, item.sentence),
          meaning: item.meaning,
          sentence: item.sentence,
          pronunciation: item.pronunciation,
          tags: ['music', 'generated'],
          memo: `From song: ${selectedVideo.title} by ${selectedVideo.artist}`,
          song: songData
      };

      setPhraseList(prev => {
          if (prev.some(v => v.id === newItem.id)) return prev;
          return [...prev, newItem];
      });
  };

    return (
      <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className={`${selectedVideo ? 'h-[40%] flex-shrink-0' : 'flex-1'} flex flex-col p-4 overflow-y-auto border-b border-gray-200 dark:border-gray-800 transition-all duration-300`}>
          
          {!selectedVideo && (
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder={t('music.searchPlaceholder')}
                   value={query}
                   onChange={(e) => updateState({ query: e.target.value })}
                   className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                 />
              </div>
              <FunButton type="submit" variant="primary" disabled={isSearching}>
                 {isSearching ? <Loader2 className="animate-spin" size={20} /> : t('music.search')}
              </FunButton>
            </form>
          )}
  
          {!selectedVideo && searchStep === 'song' && (
              <div className="space-y-3">
                  {geniusResults.length > 0 && <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Select a Song</h3>}
                  
                  {geniusResults.map(song => (
                      <div 
                          key={song.id} 
                          onClick={() => handleSelectSong(song)}
                          className="flex gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-800 group"
                      >
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                            <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {song.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <UserIcon size={12} className="text-gray-400" />
                                <p className="text-sm text-gray-500">{song.artist}</p>
                              </div>
                          </div>
                          <div className="flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600">
                               <Sparkles size={16} />
                             </div>
                          </div>
                      </div>
                  ))}
                  
                  {geniusResults.length === 0 && !isSearching && query && (
                      <div className="text-center text-gray-400 mt-10">
                          <p>No songs found. Try a different search.</p>
                      </div>
                  )}

                  {geniusResults.length === 0 && !isSearching && !query && (
                      <div className="text-center text-gray-400 mt-10 space-y-4">
                          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto flex items-center justify-center">
                            <Music size={40} className="opacity-30" />
                          </div>
                          <p>{t('music.searchToStart')}</p>
                      </div>
                  )}
              </div>
          )}

          {!selectedVideo && searchStep === 'video' && (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <button 
                    onClick={() => updateState({ searchStep: 'song', results: [] })}
                    className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
                 >
                    &larr; Back to Songs
                 </button>
                 <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                    {selectedSong?.title} - {selectedSong?.artist}
                 </span>
               </div>

               <div className="space-y-3">
                  <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Select a Video Version</h3>
                  {results.map(video => (
                      <div 
                          key={video.videoId} 
                          onClick={() => handleSelectVideo(video)}
                          className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-900 group"
                      >
                          <div className="relative w-32 aspect-video bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                             <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                             <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                <Youtube size={10} />
                             </div>
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {video.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{video.artist}</p>
                          </div>
                      </div>
                  ))}
               </div>
            </div>
          )}
  
          {selectedVideo && (
              <div className="space-y-4 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center">
                      <button 
                          onClick={() => updateState({ selectedVideo: null, searchStep: 'video' })}
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                      >
                          &larr; {t('music.backToResults')}
                      </button>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-2xl bg-black aspect-video ring-4 ring-black/5 dark:ring-white/5">
                       <YouTube 
                          videoId={selectedVideo.videoId} 
                          opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1 } }} 
                          className="w-full h-full"
                       />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{selectedVideo.title}</h3>
                      <p className="text-gray-500">{selectedVideo.artist}</p>
                  </div>
              </div>
          )}
        </div>
  
        {selectedVideo && (
          <div className="flex-1 flex flex-col p-4 bg-white dark:bg-gray-800 overflow-hidden shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-10 rounded-t-3xl">             
             {isLoading ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                     <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Sparkles size={16} className="text-blue-500 animate-pulse" />
                        </div>
                     </div>
                     <p className="animate-pulse font-medium">{t('music.generating')}</p>
                 </div>
             ) : materials ? (
                 <>
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 px-2">
                        <button 
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'lyrics' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            onClick={() => updateState({ activeTab: 'lyrics' })}
                        >
                            {t('music.lyricsTab')}
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'phrase' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            onClick={() => updateState({ activeTab: 'phrase' })}
                        >
                            {t('music.phrasesTab')} <span className="ml-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-xs">{materials.phrases?.length || 0}</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {activeTab === 'lyrics' && (
                            <div className="space-y-6 pb-10">
                                {materials.lyrics.map((line, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl group transition-colors">
                                        <div className="flex-1 space-y-1.5">
                                            <p className="text-lg text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{line.original}</p>
                                            {line.translated && <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{line.translated}</p>}
                                        </div>
                                        <button 
                                          onClick={() => handleGenerateCard(line.original, idx)}
                                          disabled={generatingIdx === idx || line.isGenerated}
                                          className={`p-2 rounded-full transition-all flex-shrink-0 ${
                                              line.isGenerated 
                                                ? 'opacity-100 text-green-500 bg-green-50 dark:bg-green-900/20 cursor-default' 
                                                : 'opacity-0 group-hover:opacity-100 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-110 active:scale-95'
                                          }`}
                                          title={line.isGenerated ? t('music.cardGenerated') : t('music.generateCard')}
                                        >
                                          {generatingIdx === idx ? (
                                              <Loader2 size={20} className="animate-spin" />
                                          ) : line.isGenerated ? (
                                              <Check size={20} />
                                          ) : (
                                              <Sparkles size={20} />
                                          )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'phrase' && (
                            <div className="space-y-3 pb-10">
                                {materials.phrases?.length > 0 ? materials.phrases.map((phrase, idx) => {
                                    const saved = isSaved(phrase.meaning, phrase.sentence);
                                    
                                    const tempItem: PhraseItem = {
                                        id: `temp-${idx}`,
                                        meaning: phrase.meaning,
                                        sentence: phrase.sentence,
                                        pronunciation: phrase.pronunciation,
                                        tags: ['music', 'generated']
                                    };

                                    return (
                                        <FlipListItem 
                                            key={idx}
                                            item={tempItem}
                                            idx={idx}
                                            saved={saved}
                                            onSave={() => handleSavePhrase(phrase)}
                                            speak={speak}
                                            t={t}
                                        />
                                    );
                                }) : (
                                  <div className="text-center text-gray-400 mt-10">
                                    <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>{t('music.clickSparkle')}</p>
                                  </div>
                                )}
                            </div>
                        )}
                    </div>
                 </>
             ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                     <p>{t('music.selectVideo')}</p>
                 </div>
             )}
          </div>
        )}
      </div>
    );
}

function FlipListItem({ item, idx, saved, onSave, speak, t }: { 
    item: PhraseItem, 
    idx: number, 
    saved: boolean, 
    onSave: () => void,
    speak: (t:string)=>void,
    t: (key: string) => string
}) {
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <div 
      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex justify-between items-center group cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
      onClick={() => setShowMeaning(!showMeaning)}
    >
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-500 w-6 flex-none">{idx + 1}</span>
          <h4 className={`font-bold transition-all duration-300 ${showMeaning ? 'text-gray-500 dark:text-gray-400 text-sm' : 'text-blue-900 dark:text-blue-100 text-lg'}`}>
            {showMeaning ? item.meaning : item.sentence}
          </h4>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 pl-8 truncate min-h-[1.25rem]">
          {showMeaning ? (
             <span className="text-blue-500 font-medium">{item.sentence}</span>
          ) : (
             <span className="opacity-50 text-xs italic">{t('learn.tapToRevealMeaning')}</span>
          )}
        </p>
        <div className="flex gap-1 mt-1 pl-8 items-center">
           {saved && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-bold">{t('music.savedBadge')}</span>}
           {item.pronunciation && (
               <span className="text-[10px] font-mono bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">/{item.pronunciation}/</span>
           )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
            onClick={(e) => { e.stopPropagation(); speak(item.sentence); }}
            className="p-3 bg-white dark:bg-gray-600 rounded-full shadow-sm text-blue-500 active:scale-90 transition-transform hover:shadow-md"
        >
            <Volume2 size={18} />
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); if (!saved) onSave(); }}
            disabled={saved}
            className={`p-3 rounded-full shadow-sm transition-transform active:scale-90 hover:shadow-md ${saved ? 'bg-green-100 text-green-600' : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-blue-500'}`}
        >
            {saved ? <Check size={18} /> : <Plus size={18} />}
        </button>
      </div>
    </div>
  );
}
