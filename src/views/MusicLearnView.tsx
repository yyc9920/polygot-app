import YouTube from 'react-youtube';
import { useMusicContext } from '../context/MusicContext';
import { usePhraseAppContext } from '../context/PhraseContext';
import { generateSongLyrics } from '../lib/gemini';
import { detectLanguage } from '../lib/utils';
import type { YouTubeVideo } from '../lib/youtube';
import type { SongMaterials, PlaylistItem } from '../types';
import useLanguage from '../hooks/useLanguage';
import { LyricsView } from '../components/music/LyricsView';
import { VideoSearchPanel } from '../components/music/VideoSearchPanel';
import { BottomSheet } from '../components/BottomSheet';
import { Music as MusicIcon } from 'lucide-react';

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
  
  const { 
      selectedVideo, 
      selectedSong,
  } = musicState;

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

  const handleSelectVideo = async (video: YouTubeVideo, forceArtist?: string) => {
    updateState({ selectedVideo: video, materials: null });
    
    const cacheKey = `song_lyrics_${video.videoId}_${language}`;
    // Use synced storage instead of raw localStorage
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

    if (!apiKey) {
        alert(t('music.geminiKeyMissing'));
        return;
    }

    updateState({ isLoading: true });
    try {
        const targetLanguageName = LANGUAGE_NAMES[language];

        const data = await generateSongLyrics(artist, title, apiKey, targetLanguageName);
        
        // Save to synced storage
        setSongLyrics(prev => ({ ...prev, [cacheKey]: data }));
        
        updateState({ materials: data });
        
        if (data.lyrics && data.lyrics.length > 0) {
          const genre = selectedSong?.genre;
          addToPlaylist(video, artist, title, data.lyrics[0].original, genre);
        }
    } catch (err) {
        const error = err as Error;
        alert(t('music.failedGenerateMaterials').replace('{{error}}', error.message));
    } finally {
        updateState({ isLoading: false });
    }
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
            <div className="flex-1 overflow-hidden">
                <LyricsView onMaterialsUpdate={handleMaterialsUpdate} />
            </div>
        </div>
      </BottomSheet>
    </div>
  );
}
