import { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { useMusicContext } from '../context/MusicContext';
import { usePhraseAppContext } from '../context/PhraseContext';
import { GeminiService } from '../lib/services/GeminiService';
import { detectLanguage } from '../lib/utils';
import type { YouTubeVideo } from '../lib/youtube';
import type { SongMaterials, PlaylistItem } from '../types';
import useLanguage from '../hooks/useLanguage';
import { LyricsView } from '../components/music/LyricsView';
import { VideoSearchPanel } from '../components/music/VideoSearchPanel';
import { BottomSheet } from '../components/BottomSheet';
import { Music as MusicIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export function MusicLearnView() {
   const { 
     apiKey, 
   } = usePhraseAppContext();
   const {
     musicState,
     setMusicState,
     setPlaylist,
     songLyrics,
     setSongLyrics
   } = useMusicContext();
   const { t, language, LANGUAGE_NAMES } = useLanguage();
   const toast = useToast();
  
  const { 
      selectedVideo, 
      selectedSong,
  } = musicState;

  // Track active fetch to prevent duplicates
  const loadingRef = useRef<string | null>(null);

  // New state for confirmation flow
  const [confirmationStep, setConfirmationStep] = useState<'none' | 'confirm' | 'select'>('none');
  const [pendingVideo, setPendingVideo] = useState<YouTubeVideo | null>(null);

  // Reset confirmation state when video is deselected
  useEffect(() => {
      if (!selectedVideo) {
          setConfirmationStep('none');
          setPendingVideo(null);
      }
  }, [selectedVideo]);

  const updateState = (updates: Partial<typeof musicState>) => {
      setMusicState(prev => ({ ...prev, ...updates }));
  };

  const addToPlaylist = (video: YouTubeVideo, artist: string, title: string, lyricsText: string, genre?: string) => {
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
      genre: genre,
      addedAt: Date.now()
    };

    setPlaylist((prev: PlaylistItem[]) => {
      const existingIdx = prev.findIndex((item: PlaylistItem) => item.id === newItem.id);
      if (existingIdx >= 0) {
          const updated = [...prev];
          return updated;
      }
      return [newItem, ...prev];
    });
  };

   const fetchLyrics = async (video: YouTubeVideo, targetLang: string) => {
     if (!apiKey) {
         toast.warning(t('music.geminiKeyMissing'));
         return;
     }

    loadingRef.current = video.videoId;
    updateState({ isLoading: true });
    
    // Reset confirmation state
    setConfirmationStep('none');
    setPendingVideo(null);

    try {
        const targetLanguageName = LANGUAGE_NAMES[targetLang as keyof typeof LANGUAGE_NAMES] || targetLang;
        const userLocaleName = LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES] || language;

        const data = await GeminiService.generateSongLyrics(video.artist, video.title, apiKey, targetLanguageName, userLocaleName);
        
        // Cache using the target language to ensure correct retrieval later
        const effectiveCacheKey = `song_lyrics_${video.videoId}_${targetLang}`;

        // Save to synced storage
        setSongLyrics(prev => ({ ...prev, [effectiveCacheKey]: data }));
        
        updateState({ materials: data });
        
        if (data.lyrics && data.lyrics.length > 0) {
          const genre = selectedSong?.genre;
          // Use the fetched lyrics language for playlist item
          addToPlaylist(video, video.artist, video.title, data.lyrics[0].original, genre);
        }
     } catch (err) {
         const error = err as Error;
         toast.error(t('music.failedGenerateMaterials').replace('{{error}}', error.message));
         
         // Fallback: Enable manual entry
         updateState({
            materials: { 
                artist: video.artist,
                title: video.title,
                lyrics: [], 
                phrases: [] 
            } 
        });
    } finally {
        updateState({ isLoading: false });
        if (loadingRef.current === video.videoId) {
            loadingRef.current = null;
        }
    }
  };

  const handleSelectVideo = async (video: YouTubeVideo, forceArtist?: string) => {
    // Prevent duplicate processing
    if (loadingRef.current === video.videoId) return;

    updateState({ selectedVideo: video, materials: null });
    
    // Check if lyrics exist in the current language first
    const cacheKey = `song_lyrics_${video.videoId}_${language}`;
    const cached = songLyrics[cacheKey];
    
    const artist = selectedSong ? selectedSong.artist : (forceArtist || video.artist);
    const title = selectedSong ? selectedSong.title : video.title;

    if (cached) {
        updateState({ materials: cached });
        if (cached.lyrics && cached.lyrics.length > 0) {
          const genre = selectedSong?.genre || cached.genre;
          addToPlaylist(video, artist, title, cached.lyrics[0].original, genre);
        }
        return;
    }

    // No cache -> Start confirmation flow
    setPendingVideo(video);
    setConfirmationStep('confirm');
  };

  const handleMaterialsUpdate = (newMaterials: SongMaterials) => {
      updateState({ materials: newMaterials });
      if (selectedVideo) {
          const cacheKey = `song_lyrics_${selectedVideo.videoId}_${language}`;
          setSongLyrics(prev => ({ ...prev, [cacheKey]: newMaterials }));
      }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedVideo ? (
            <VideoSearchPanel onVideoSelect={handleSelectVideo} />
        ) : (
            <div className="h-full flex flex-col p-4 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                <div className="space-y-4 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                    <div className="flex justify-between items-center flex-none">
                        <button 
                            onClick={() => updateState({ selectedVideo: null, searchStep: 'song', selectedSong: null, results: [] })}
                            className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                        >
                            &larr; {t('music.backToResults')}
                        </button>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-2xl bg-black aspect-video ring-4 ring-black/5 dark:ring-white/5 flex-none">
                        <YouTube 
                            videoId={selectedVideo.videoId} 
                            opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1 } }} 
                            className="w-full h-full"
                        />
                    </div>
                    <div className="flex-none">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{selectedVideo.title}</h3>
                        <p className="text-gray-500">{selectedVideo.artist}</p>
                    </div>
                </div>
            </div>
        )}
      </div>

      <BottomSheet
        isOpen={!!selectedVideo}
        onClose={() => updateState({ selectedVideo: null })}
        initialSnap={0.5}
        modal={false}
        peekHeight={120}
        title={
            <div className="flex items-center gap-2 truncate">
                <MusicIcon size={20} className="text-pink-500 flex-shrink-0" />
                <h3 className="font-bold text-lg truncate">
                    {t('music.lyricsAndPhrases') || 'Lyrics & Phrases'}
                </h3>
            </div>
        }
      >
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden relative">
                <LyricsView onMaterialsUpdate={handleMaterialsUpdate} />
                
                {/* Confirmation Overlay */}
                {confirmationStep === 'confirm' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
                                {t('music.confirmLanguage') || "Confirm Language"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {t('music.fetchLyricsIn') || "Fetch lyrics in"} <span className="font-bold text-blue-500">{language.toUpperCase()}</span>?
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setConfirmationStep('select')}
                                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {t('common.no') || "No"}
                                </button>
                                <button 
                                    onClick={() => pendingVideo && fetchLyrics(pendingVideo, language)}
                                    className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 shadow-sm"
                                >
                                    {t('common.yes') || "Yes"}
                                </button>
                            </div>
                            <button 
                                onClick={() => {
                                    setConfirmationStep('none');
                                    setPendingVideo(null);
                                    // Set empty materials to allow manual entry / viewing without lyrics
                                    updateState({ 
                                        materials: { 
                                            artist: pendingVideo?.artist || '',
                                            title: pendingVideo?.title || '',
                                            lyrics: [], 
                                            phrases: [] 
                                        } 
                                    });
                                }}
                                className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {t('common.cancel') || "Cancel"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Language Selection Overlay */}
                {confirmationStep === 'select' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-sm w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex-shrink-0">
                                {t('music.selectLanguage') || "Select Language"}
                            </h3>
                            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2">
                                {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                                    <button
                                        key={code}
                                        onClick={() => pendingVideo && fetchLyrics(pendingVideo, code)}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                                    >
                                        <span className="font-medium">{name}</span>
                                        {code === language && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Default</span>}
                                    </button>
                                ))}
                            </div>
                                <button 
                                    onClick={() => setConfirmationStep('confirm')}
                                    className="mt-4 w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                                >
                                    {t('common.cancel') || "Cancel"}
                                </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </BottomSheet>
    </div>
  );
}
