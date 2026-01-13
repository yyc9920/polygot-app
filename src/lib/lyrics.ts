export interface LyricsResponse {
  lyrics: string;
  artist: string;
  title: string;
  source: 'genius';
  geniusUrl?: string;
}

export interface LyricsError {
  error: string;
  artist?: string;
  title?: string;
  message?: string;
}

function cleanSearchQuery(text: string): string {
  const annotationPatterns = [
    /（.*?）/g,
    /\(Official Video\)/gi,
    /\(Official MV\)/gi,
    /\(Music Video\)/gi,
    /\(Official\)/gi,
    /\(MV\)/gi,
    /\[.*?\]/g,
    /【.*?】/g,
    /「.*?」/g,
    /\s*-\s*Official\s*Video/gi,
    /\s*-\s*MV/gi,
    /\(Lyrics\)/gi,
    /\s*-\s*Lyrics/gi,
    /\(Audio\)/gi,
    /\s*-\s*Audio/gi,
    /\(Official Audio\)/gi,
    /\(HQ\)/gi,
    /\(HD\)/gi,
    /\(4K\)/gi,
    /\s+Lyrics$/gi,
    /\s+Audio$/gi,
    /\s+Official\s+Video$/gi,
    /\s+ft\.?\s+/gi,
    /\s+feat\.?\s+/gi,
    /\s+featuring\s+/gi,
    /\s+with\s+/gi,
    /^\s+|\s+$/g
  ];

  let cleanText = text;
  for (const pattern of annotationPatterns) {
    cleanText = cleanText.replace(pattern, ' ');
  }

  return cleanText.replace(/\s+/g, ' ').trim();
}

export interface GeniusSong {
  id: number;
  title: string;
  artist: string;
  image: string;
  url: string;
}

async function performSearch(query: string, apiKey?: string): Promise<GeniusSong[]> {
  const params = new URLSearchParams({
    q: encodeURIComponent(query)
  });

  const headers: HeadersInit = {};
  if (apiKey) {
    headers['x-genius-token'] = apiKey;
  }

  const response = await fetch(`/api/search-genius?${params}`, {
    headers
  });

  if (!response.ok) {
    console.warn(`Failed to search Genius for query: ${query}`);
    return [];
  }

  const data = await response.json();
  return data.songs || [];
}

export async function searchGeniusSongs(query: string, apiKey?: string): Promise<GeniusSong[]> {
  const cleanedQuery = cleanSearchQuery(query);
  
  const separators = [
    /\s+by\s+/i,
    /\s+-\s+/,
    /\s+:\s+/
  ];
  
  const searchQueries = new Set<string>();
  searchQueries.add(query);
  searchQueries.add(cleanedQuery);
  
  const noSpecialChars = cleanedQuery.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  searchQueries.add(noSpecialChars);

  const noSpaces = cleanedQuery.replace(/\s/g, '');
  if (noSpaces.length > 0 && noSpaces !== cleanedQuery) {
    searchQueries.add(noSpaces);
  }

  for (const separator of separators) {
    if (separator.test(query)) {
      const parts = query.split(separator).map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 2) {
        parts.forEach(p => searchQueries.add(cleanSearchQuery(p)));
        
        const p0 = cleanSearchQuery(parts[0]);
        const p1 = cleanSearchQuery(parts[1]);
        searchQueries.add(`${p0} ${p1}`);
        searchQueries.add(`${p1} ${p0}`);
      }
    }
  }

  const finalQueries = Array.from(searchQueries).filter(q => q.length > 1).slice(0, 6);

  try {
    const results = await Promise.all(
      finalQueries.map(q => performSearch(q, apiKey))
    );

    const seenIds = new Set<number>();
    const allSongs: GeniusSong[] = [];

    for (const songList of results) {
      for (const song of songList) {
        if (!seenIds.has(song.id)) {
          seenIds.add(song.id);
          allSongs.push(song);
        }
      }
    }

    return allSongs;
  } catch (err) {
    console.error('Error in smart search:', err);
    return performSearch(query, apiKey);
  }
}


export async function fetchExactLyrics(artist: string, title: string, apiKey?: string): Promise<LyricsResponse> {
  const cleanArtist = cleanSearchQuery(artist);
  const cleanTitle = cleanSearchQuery(title);

  const searchQuery = `${cleanArtist} ${cleanTitle}`;

  const params = new URLSearchParams({
    q: searchQuery
  });

  const headers: HeadersInit = {};
  if (apiKey) {
    headers['x-genius-token'] = apiKey;
  }

  const response = await fetch(`/api/lyrics?${params}`, {
    headers
  });

  if (!response.ok) {
    const errorData: LyricsError = await response.json();

    throw new Error(
      errorData.error || 'Failed to fetch lyrics',
      { cause: errorData }
    );
  }

  return response.json() as Promise<LyricsResponse>;
}

export function isSongMatch(ytTitle: string, ytChannel: string, geniusSong: GeniusSong): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  
  const ytTitleNorm = normalize(ytTitle);
  const ytChannelNorm = normalize(ytChannel);
  const gTitleNorm = normalize(geniusSong.title);
  const gArtistNorm = normalize(geniusSong.artist);

  const titleMatch = ytTitleNorm.includes(gTitleNorm) || gTitleNorm.includes(ytTitleNorm);
  
  const artistMatch = ytTitleNorm.includes(gArtistNorm) || 
                      ytChannelNorm.includes(gArtistNorm) ||
                      gArtistNorm.includes(ytChannelNorm);

  return titleMatch && artistMatch;
}

export function parseLyricsLines(lyricsText: string): string[] {
  const lines = lyricsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines;
}
