import { useState, useEffect } from 'react';
import { useMusicContext } from '../../context/MusicContext';
import { usePhraseAppContext } from '../../context/PhraseContext';
import { searchSongs, type Song } from '../../lib/lyrics';
import { searchYouTube, type YouTubeVideo } from '../../lib/youtube';
import { getTopTracksByTag } from '../../lib/lastfm';
import { PlaylistPanel } from './PlaylistPanel';
import useLanguage from '../../hooks/useLanguage';
import { useToast } from '../../context/ToastContext';

import { SearchBar } from './video-search/SearchBar';
import { RecommendationList } from './video-search/RecommendationList';
import { SongResultsList } from './video-search/SongResultsList';
import { VideoResultsList } from './video-search/VideoResultsList';

const SONGS_PER_PAGE = 5;
const VIDEOS_PER_PAGE = 5;

interface VideoSearchPanelProps {
  onVideoSelect: (video: YouTubeVideo) => void;
}

export function VideoSearchPanel({ onVideoSelect }: VideoSearchPanelProps) {
   const { musicState, setMusicState } = useMusicContext();
   const { 
     query, 
     results, 
     songResults, 
     selectedSong, 
     isSearching, 
     searchStep, 
     songPage, 
     videoPage 
   } = musicState;
   
   const { youtubeApiKey, lastFmApiKey } = usePhraseAppContext();
   const { t } = useLanguage();
   const toast = useToast();
   const [recommendations, setRecommendations] = useState<Song[]>([]);
   const [loadingRecs, setLoadingRecs] = useState(false);
   const { playlist } = useMusicContext();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!lastFmApiKey || playlist.length === 0 || recommendations.length > 0) return;

      // Find the most frequent genre
      const genreCounts: Record<string, number> = {};
      playlist.forEach(item => {
        if (item.genre) {
          genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
        }
      });

      let topGenre = '';
      let maxCount = 0;
      for (const [genre, count] of Object.entries(genreCounts)) {
        if (count > maxCount) {
          maxCount = count;
          topGenre = genre;
        }
      }

      if (!topGenre) topGenre = 'pop';

      setLoadingRecs(true);
      try {
        const tracks = await getTopTracksByTag(topGenre, lastFmApiKey);
        const recSongs: Song[] = tracks.map((track, index) => ({
          id: parseInt(track.mbid, 16) || index,
          title: track.name,
          artist: track.artist.name,
          image: track.image[2]['#text'] || '',
          url: track.url,
          genre: topGenre
        }));
        setRecommendations(recSongs);
      } catch (error) {
        console.error('Failed to fetch recommendations', error);
      } finally {
        setLoadingRecs(false);
      }
    };

    if (searchStep === 'song' && !query && songResults.length === 0) {
        fetchRecommendations();
    }
  }, [searchStep, query, songResults.length, playlist, lastFmApiKey, recommendations.length]);

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
       toast.error(error.message);
     } finally {
       updateState({ isSearching: false });
     }
  };

   const handleSelectSong = async (song: Song) => {
     if (!youtubeApiKey) {
       toast.warning(t('music.pleaseSetYoutubeKey'));
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
       toast.error(error.message);
       updateState({ searchStep: 'song', selectedSong: null });
     } finally {
       updateState({ isSearching: false });
     }
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
    <div className="flex-1 flex flex-col p-4 overflow-y-auto border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <SearchBar 
          query={query}
          setQuery={(q) => updateState({ query: q })}
          isSearching={isSearching}
          searchStep={searchStep}
          onSearch={handleSearch}
          onTogglePlaylist={() => updateState({ searchStep: searchStep === 'playlist' ? 'song' : 'playlist', results: [], songResults: [] })}
        />

        {searchStep === 'playlist' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{t('music.myPlaylist')}</h3>
                </div>
                <PlaylistPanel onSelect={onVideoSelect} />
            </div>
        )}

        {searchStep === 'song' && (
            <div className="space-y-3">
                {songResults.length > 0 && <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Select a Song</h3>}
                
                {songResults.length === 0 && !query && (
                    <div className="space-y-3">
                      <RecommendationList 
                        recommendations={recommendations}
                        loadingRecs={loadingRecs}
                        hasPlaylist={playlist.length > 0}
                        hasApiKey={!!lastFmApiKey}
                        onSelectSong={handleSelectSong}
                      />
                    </div>
                )}

                <SongResultsList 
                  songs={currentSongs}
                  currentPage={songPage}
                  totalPages={totalPages}
                  onSelectSong={handleSelectSong}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                />
            </div>
        )}

        {searchStep === 'video' && (
            <VideoResultsList 
              videos={currentVideos}
              currentPage={videoPage}
              totalPages={totalVideoPages}
              selectedSong={selectedSong}
              onSelectVideo={onVideoSelect}
              onBack={() => updateState({ searchStep: 'song', results: [] })}
              onPrevPage={handlePrevVideoPage}
              onNextPage={handleNextVideoPage}
            />
        )}
    </div>
  );
}
