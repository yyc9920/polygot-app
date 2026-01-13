export interface YouTubeVideo {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  hasLyrics?: boolean;
}

interface SearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string; // approximate artist
    thumbnails: { default: { url: string }, medium: { url: string }, high: { url: string } };
  };
}

export const searchYouTube = async (query: string, apiKey: string): Promise<YouTubeVideo[]> => {
  if (!apiKey) throw new Error("YouTube API Key is missing. Please set it in Settings.");
  
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
     const err = await response.json();
     throw new Error(err.error?.message || "YouTube API Error");
  }
  
  const data = await response.json();
  return data.items.map((item: SearchResult) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
  }));
};
