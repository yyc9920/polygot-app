import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import YouTube from 'react-youtube';
import { Music as MusicIcon, ArrowLeft } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { LyricsView } from '../../components/music/LyricsView';
import { GeminiService } from '../../lib/services/GeminiService';
import { initialMusicState, type MusicViewState } from '../../context/MusicContextDefinition';
import { useMusicContext } from '../../context/MusicContext';
import type { PlaylistItem, SongMaterials } from '../../types';
import { useToast } from '../../context/ToastContext';

interface HomeSongViewProps {
  song: PlaylistItem;
  onClose: () => void;
  apiKey: string;
  language: string;
  LANGUAGE_NAMES: Record<string, string>;
  t: (key: string) => string;
}

export const HomeSongView = React.memo(function HomeSongView({ 
     song, 
     onClose,
     apiKey,
     language,
     LANGUAGE_NAMES,
     t
}: HomeSongViewProps) {
     const { songLyrics, setSongLyrics } = useMusicContext();
     const toast = useToast();

    const [localMusicState, setLocalMusicState] = useState<MusicViewState>({
        ...initialMusicState,
        selectedVideo: { 
            ...song.video, 
            artist: song.song.artist 
        },
    });

    const [localPlaylist, setLocalPlaylist] = useState<PlaylistItem[]>([song]);
    const fetchingRef = useRef<string | null>(null);
    const [confirmationStep, setConfirmationStep] = useState<'none' | 'confirm' | 'select'>('none');

    // Use ref to access latest songLyrics without adding to dependency array
    const songLyricsRef = useRef(songLyrics);
    songLyricsRef.current = songLyrics;

    const fetchLyrics = async (targetLang: string) => {
        const video = { ...song.video, artist: song.song.artist };
        const cacheKey = `song_lyrics_${video.videoId}_${targetLang}`;

        if (!apiKey) return;
        
        // Prevent duplicate requests
        if (fetchingRef.current === cacheKey) return;
        fetchingRef.current = cacheKey;

        setConfirmationStep('none');
        setLocalMusicState(prev => ({ ...prev, isLoading: true }));
        try {
            const targetLanguageName = LANGUAGE_NAMES[targetLang as keyof typeof LANGUAGE_NAMES] || targetLang;
            const userLocaleName = LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES] || language;
            
            const data = await GeminiService.generateSongLyrics(video.artist, video.title, apiKey, targetLanguageName, userLocaleName);
            
            setSongLyrics(prev => ({ ...prev, [cacheKey]: data }));
            setLocalMusicState(prev => ({ ...prev, materials: data }));
         } catch (err: unknown) {
             const message = err instanceof Error ? err.message : 'Unknown error';
             toast.error(t('music.failedGenerateMaterials').replace('{{error}}', message));
             // Fallback: Enable manual entry
             setLocalMusicState(prev => ({
                ...prev, 
                materials: { 
                    artist: video.artist,
                    title: video.title,
                    lyrics: [], 
                    phrases: [] 
                } 
            }));
        } finally {
            setLocalMusicState(prev => ({ ...prev, isLoading: false }));
            fetchingRef.current = null;
        }
    };

    useEffect(() => {
        const loadLyrics = async () => {
            const video = { ...song.video, artist: song.song.artist };
            const cacheKey = `song_lyrics_${video.videoId}_${language}`;
            
            // Use ref to get latest songLyrics value
            const cachedMaterials = songLyricsRef.current[cacheKey];

            if (cachedMaterials) {
                setLocalMusicState(prev => ({ ...prev, materials: cachedMaterials }));
                setConfirmationStep('none');  // FIX: Reset confirmation when cache found
                return;
            }

            const rawCached = localStorage.getItem(cacheKey);
            if (rawCached) {
                try {
                    const parsed = JSON.parse(rawCached);
                    setSongLyrics(prev => ({ ...prev, [cacheKey]: parsed }));
                    setLocalMusicState(prev => ({ ...prev, materials: parsed }));
                    setConfirmationStep('none');  // FIX: Reset confirmation when cache found
                    return;
                } catch {
                    localStorage.removeItem(cacheKey);
                }
            }

            // No cache -> Prompt user
            setConfirmationStep('confirm');
        };

        loadLyrics();
    }, [song, language, setSongLyrics]);

    const handleMaterialsUpdate = (newMaterials: SongMaterials) => {
        setLocalMusicState(prev => ({ ...prev, materials: newMaterials }));
        
        const cacheKey = `song_lyrics_${song.video.videoId}_${language}`;
        setSongLyrics(prev => ({ ...prev, [cacheKey]: newMaterials }));
    };

    const contextValue = useMemo(() => ({
        musicState: localMusicState,
        setMusicState: setLocalMusicState,
        playlist: localPlaylist,
        setPlaylist: setLocalPlaylist,
        songLyrics: songLyrics,
        setSongLyrics: setSongLyrics
    }), [localMusicState, localPlaylist, songLyrics, setSongLyrics]);

    const [isSheetOpen] = useState(true);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-full flex flex-col p-4 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                    <div className="space-y-4 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                        <div className="flex justify-between items-center flex-none">
                            <button 
                                onClick={onClose}
                                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                            >
                                <ArrowLeft size={16} /> {t('common.close')}
                            </button>
                        </div>
                        {localMusicState.selectedVideo && (
                            <>
                                <div className="rounded-xl overflow-hidden shadow-2xl bg-black aspect-video ring-4 ring-black/5 dark:ring-white/5 flex-none">
                                    <YouTube 
                                        videoId={localMusicState.selectedVideo.videoId} 
                                        opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1 } }} 
                                        className="w-full h-full"
                                    />
                                </div>
                                <div className="flex-none">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{localMusicState.selectedVideo.title}</h3>
                                    <p className="text-gray-500">{localMusicState.selectedVideo.artist}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <BottomSheet
                    isOpen={isSheetOpen}
                    onClose={onClose}
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
                            <LyricsView 
                                onMaterialsUpdate={handleMaterialsUpdate}
                                contextOverrides={contextValue}
                            />
                            
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
                                                onClick={() => fetchLyrics(language)}
                                                className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 shadow-sm"
                                            >
                                                {t('common.yes') || "Yes"}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setConfirmationStep('none');
                                                // Set empty materials to allow manual entry / viewing without lyrics
                                                setLocalMusicState(prev => ({ 
                                                    ...prev, 
                                                    materials: { 
                                                        artist: song.song.artist,
                                                        title: song.song.title,
                                                        lyrics: [], 
                                                        phrases: [] 
                                                    } 
                                                }));
                                            }}
                                            className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            {t('common.cancel') || "Cancel"}
                                        </button>
                                    </div>
                                </div>
                            )}

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
                                                    onClick={() => fetchLyrics(code)}
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
        </div>,
        document.body
    );
});
