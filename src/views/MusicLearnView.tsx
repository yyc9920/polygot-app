import React, { useState } from 'react';
import YouTube from 'react-youtube';
import { Search, Plus, Check, Volume2, Loader2, Sparkles, User as UserIcon, Youtube, ChevronLeft, ChevronRight, ListMusic, Trash2, Edit2, Save, X } from 'lucide-react';
import { usePhraseAppContext } from '../context/PhraseContext';
import { searchYouTube, type YouTubeVideo } from '../lib/youtube';
import { generateSongLyrics, generatePhraseFromLyric } from '../lib/gemini';
import { searchSongs, type Song } from '../lib/lyrics';
import { FunButton } from '../components/FunButton';
import { generateId, detectLanguage } from '../lib/utils';
import type { SongData, PhraseItem, PlaylistItem, SongMaterials } from '../types';
import useLanguage from '../hooks/useLanguage';

const SONGS_PER_PAGE = 5;
const VIDEOS_PER_PAGE = 5;

export function MusicLearnView() {
  const { 
    apiKey, 
    youtubeApiKey, 
    setPhraseList, 
    phraseList, 
    voiceURI,
    musicState,
    setMusicState,
    playlist,
    setPlaylist
  } = usePhraseAppContext();
  const { t, language, LANGUAGE_NAMES } = useLanguage();
  
  const { 
      query, 
      results,
      songResults,
      selectedVideo, 
      selectedSong,
      materials, 
      isLoading, 
      isSearching,
      searchStep,
      activeTab,
      songPage,
      videoPage
  } = musicState;

  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  
  // Edit Lyrics State
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editForm, setEditForm] = useState({ original: '', translated: '' });

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

    updateState({ isSearching: true, searchStep: 'song', selectedSong: null, selectedVideo: null, materials: null, results: [], songResults: [], songPage: 1 });
    
    try {
      const songs = await searchSongs(query);
      updateState({ songResults: songs });
    } catch (err) {
      const error = err as Error;
      alert(error.message);
    } finally {
      updateState({ isSearching: false });
    }
  };

  const handleSelectSong = async (song: Song) => {
    if (!youtubeApiKey) {
      alert(t('music.pleaseSetYoutubeKey'));
      return;
    }

    updateState({ 
      selectedSong: song, 
      isSearching: true,
      searchStep: 'video',
      videoPage: 1
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

  const addToPlaylist = (video: YouTubeVideo, artist: string, title: string, lyricsText: string) => {
    const detectedLang = detectLanguage(lyricsText);
    const newItem: PlaylistItem = {
      id: video.videoId,
      song: {
        videoId: video.videoId,
        title: title,
        artist: artist,
        thumbnailUrl: video.thumbnailUrl
      },
      video: {
        videoId: video.videoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl
      },
      language: detectedLang,
      addedAt: Date.now()
    };

    setPlaylist(prev => {
      // If already exists, just update the language if it changed (or do nothing)
      const existingIdx = prev.findIndex(item => item.id === newItem.id);
      if (existingIdx >= 0) {
          const updated = [...prev];
          // We don't overwrite unless explicitly needed, but here we might want to ensure language is up to date if we are re-adding
          return updated;
      }
      return [newItem, ...prev];
    });
  };

  const updatePlaylistLanguage = (videoId: string, newLang: string) => {
      setPlaylist(prev => prev.map(item => 
          item.id === videoId ? { ...item, language: newLang } : item
      ));
  };

  const handleEditLyricsStart = () => {
      if (!materials) return;
      const originalText = materials.lyrics.map(l => l.original).join('\n');
      const translatedText = materials.lyrics.map(l => l.translated).join('\n');
      setEditForm({ original: originalText, translated: translatedText });
      setIsEditingLyrics(true);
  };

  const handleSaveLyrics = () => {
      if (!materials || !selectedVideo) return;
      
      const originals = editForm.original.split('\n').map(s => s.trim()).filter(s => s);
      const translations = editForm.translated.split('\n').map(s => s.trim()); // Allow empty lines for translation alignment? 
      // Better to just map by index, assuming one-to-one. 
      // If mismatch, just use what we have.
      
      const newLyrics = originals.map((line, i) => ({
          original: line,
          translated: translations[i] || '',
          isGenerated: false // Reset generation status as text changed
      }));

      const newMaterials: SongMaterials = {
          ...materials,
          lyrics: newLyrics
      };

      updateState({ materials: newMaterials });
      
      const cacheKey = `song_lyrics_${selectedVideo.videoId}_${language}`;
      localStorage.setItem(cacheKey, JSON.stringify(newMaterials));

      // Update detected language in playlist if present
      if (newLyrics.length > 0) {
          const newLang = detectLanguage(newLyrics[0].original);
          updatePlaylistLanguage(selectedVideo.videoId, newLang);
      }

      setIsEditingLyrics(false);
  };

  const handleSelectVideo = async (video: YouTubeVideo) => {
    updateState({ selectedVideo: video, materials: null });
    
    const cacheKey = `song_lyrics_${video.videoId}_${language}`;
    const cached = localStorage.getItem(cacheKey);
    
    const artist = selectedSong ? selectedSong.artist : video.artist;
    const title = selectedSong ? selectedSong.title : video.title;

    if (cached) {
        try {
            const parsedMaterials = JSON.parse(cached);
            updateState({ materials: parsedMaterials });
            if (parsedMaterials.lyrics && parsedMaterials.lyrics.length > 0) {
              addToPlaylist(video, artist, title, parsedMaterials.lyrics[0].original);
            }
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
        const targetLanguageName = LANGUAGE_NAMES[language];

        const data = await generateSongLyrics(artist, title, apiKey, targetLanguageName);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        updateState({ materials: data });
        
        if (data.lyrics && data.lyrics.length > 0) {
          addToPlaylist(video, artist, title, data.lyrics[0].original);
        }
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
         const targetLanguageName = LANGUAGE_NAMES[language];
         const phraseData = await generatePhraseFromLyric(line, selectedVideo.artist, selectedVideo.title, apiKey, targetLanguageName);
         
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
             
             const cacheKey = `song_lyrics_${selectedVideo.videoId}_${language}`;
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

  const totalPages = Math.ceil(songResults.length / SONGS_PER_PAGE);
  const currentSongs = songResults.slice(
      (songPage - 1) * SONGS_PER_PAGE, 
      songPage * SONGS_PER_PAGE
  );

  const handlePrevPage = () => {
      if (songPage > 1) updateState({ songPage: songPage - 1 });
  };

  const handleNextPage = () => {
      if (songPage < totalPages) updateState({ songPage: songPage + 1 });
  };

  const totalVideoPages = Math.ceil(results.length / VIDEOS_PER_PAGE);
  const currentVideos = results.slice(
      (videoPage - 1) * VIDEOS_PER_PAGE, 
      videoPage * VIDEOS_PER_PAGE
  );

  const handlePrevVideoPage = () => {
      if (videoPage > 1) updateState({ videoPage: videoPage - 1 });
  };

  const handleNextVideoPage = () => {
      if (videoPage < totalVideoPages) updateState({ videoPage: videoPage + 1 });
  };

    return (
      <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className={`${selectedVideo ? 'h-[40%] flex-shrink-0' : 'flex-1'} flex flex-col p-4 overflow-y-auto border-b border-gray-200 dark:border-gray-800 transition-all duration-300`}>
          
          {!selectedVideo && (
            <div className="flex gap-2 mb-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
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
              <button 
                  onClick={() => updateState({ searchStep: searchStep === 'playlist' ? 'song' : 'playlist', results: [], songResults: [] })}
                  className={`p-3 rounded-xl border transition-colors ${searchStep === 'playlist' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  title="Playlist"
              >
                  <ListMusic size={20} />
              </button>
            </div>
          )}

          {!selectedVideo && searchStep === 'playlist' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">My Playlist</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{playlist.length} songs</span>
                </div>

                {playlist.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <ListMusic size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No songs in playlist yet.</p>
                        <p className="text-sm mt-2">Search and select a video to add it automatically.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {playlist.map(item => (
                            <div 
                                key={item.id}
                                className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-800 group relative"
                            >
                                <div 
                                    className="w-24 aspect-video bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                                    onClick={() => handleSelectVideo({
                                        videoId: item.video.videoId,
                                        title: item.video.title,
                                        thumbnailUrl: item.video.thumbnailUrl,
                                        artist: item.song.artist
                                    })}
                                >
                                    <img src={item.video.thumbnailUrl} alt={item.video.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 cursor-pointer"
                                     onClick={() => handleSelectVideo({
                                        videoId: item.video.videoId,
                                        title: item.video.title,
                                        thumbnailUrl: item.video.thumbnailUrl,
                                        artist: item.song.artist
                                     })}
                                >
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                                        {item.song.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{item.song.artist}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const langs = ['en', 'ko', 'ja', 'zh'];
                                                const currentIdx = langs.indexOf(item.language);
                                                const nextLang = langs[(currentIdx + 1) % langs.length];
                                                updatePlaylistLanguage(item.id, nextLang);
                                            }} 
                                            className="uppercase font-mono bg-gray-100 dark:bg-gray-700 px-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
                                            title="Click to change language"
                                        >
                                            {item.language}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(confirm('Remove from playlist?')) {
                                                setPlaylist(prev => prev.filter(p => p.id !== item.id));
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          )}
  
          {!selectedVideo && searchStep === 'song' && (
              <div className="space-y-3">
                  {songResults.length > 0 && <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Select a Song</h3>}
                  
                  {currentSongs.map(song => (
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
                
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-4 pb-2">
                    <button 
                        onClick={handlePrevPage} 
                        disabled={songPage === 1}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {songPage} / {totalPages}
                    </span>
                    <button 
                        onClick={handleNextPage} 
                        disabled={songPage === totalPages}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                  </div>
                )}
             </div>
           )}

           {!selectedVideo && searchStep === 'video' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="flex items-center gap-2 mb-2">
                       <button 
                           onClick={() => updateState({ searchStep: 'song', results: [] })}
                           className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                       >
                           <ChevronLeft size={24} />
                       </button>
                       <div className="flex-1">
                           <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight">
                               {selectedSong?.title}
                           </h3>
                           <p className="text-sm text-gray-500">{selectedSong?.artist}</p>
                       </div>
                   </div>
                   
                    <div className="grid gap-3">
                        {currentVideos.map(video => (
                            <div 
                                key={video.videoId}
                                onClick={() => handleSelectVideo(video)}
                                className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-800 group"
                            >
                                <div className="w-32 aspect-video bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm relative">
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {video.title}
                                    </h4>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Youtube size={12} />
                                        <span className="truncate">{video.artist}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalVideoPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-4 pb-2">
                        <button 
                            onClick={handlePrevVideoPage} 
                            disabled={videoPage === 1}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {videoPage} / {totalVideoPages}
                        </span>
                        <button 
                            onClick={handleNextVideoPage} 
                            disabled={videoPage === totalVideoPages}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
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
                                {isEditingLyrics ? (
                                    <div className="space-y-4 p-2">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-600 dark:text-blue-300 flex items-start gap-2">
                                            <Sparkles size={16} className="mt-0.5 flex-shrink-0" />
                                            <p>Edit the lyrics below. Paste the original lyrics on the left and translation on the right. Lines should match.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 h-96">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Original</label>
                                                <textarea 
                                                    className="flex-1 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                    value={editForm.original}
                                                    onChange={e => setEditForm(prev => ({ ...prev, original: e.target.value }))}
                                                    placeholder="Paste original lyrics here..."
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Translation</label>
                                                <textarea 
                                                    className="flex-1 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                    value={editForm.translated}
                                                    onChange={e => setEditForm(prev => ({ ...prev, translated: e.target.value }))}
                                                    placeholder="Paste translation here..."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <FunButton onClick={() => setIsEditingLyrics(false)} variant="neutral">
                                                <X size={16} className="mr-2" /> Cancel
                                            </FunButton>
                                            <FunButton onClick={handleSaveLyrics} variant="primary">
                                                <Save size={16} className="mr-2" /> Save Changes
                                            </FunButton>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-end px-2 mb-2">
                                            <button 
                                                onClick={handleEditLyricsStart}
                                                className="text-xs flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Edit2 size={12} /> Edit Lyrics
                                            </button>
                                        </div>
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
                                    </>
                                )}
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
