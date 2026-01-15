export interface LyricsResponse {
  lyrics: string;
  artist: string;
  title: string;
  source: 'gemini-search';
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  image: string;
  url: string;
  previewUrl?: string;
}

export async function searchSongs(query: string): Promise<Song[]> {
  const params = new URLSearchParams({
    term: query,
    entity: 'song',
    limit: '25'
  });

  try {
    const response = await fetch(`https://itunes.apple.com/search?${params}`);
    if (!response.ok) {
      throw new Error(`iTunes Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      id: item.trackId,
      title: item.trackName,
      artist: item.artistName,
      image: item.artworkUrl100?.replace('100x100bb', '300x300bb'),
      url: item.trackViewUrl,
      previewUrl: item.previewUrl
    }));

  } catch (error) {
    console.error('Error searching songs:', error);
    return [];
  }
}

export function parseLyricsLines(lyricsText: string): string[] {
  return lyricsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
