import { Client } from 'genius-lyrics';

let geniusClient: any = null;

function getGeniusClient(headerToken?: string) {
  if (headerToken) {
    return new Client(headerToken);
  }

  if (!geniusClient) {
    const accessToken = process.env.GENIUS_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('GENIUS_ACCESS_TOKEN environment variable is not set');
    }
    geniusClient = new Client(accessToken);
  }
  return geniusClient;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  const headerToken = req.headers['x-genius-token'];

  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      error: 'Missing required parameter: q (search query)'
    });
  }

  try {
    const genius = getGeniusClient(headerToken as string);

    const searchResults = await genius.songs.search(q);

    if (!searchResults) {
      return res.status(200).json({ songs: [] });
    }

    const songs = searchResults.map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist.name,
      image: song.image,
      url: song.url
    }));

    res.status(200).json({ songs });

  } catch (error: any) {
    console.error('Error searching Genius:', error);
    
    if (error.message?.includes('GENIUS_ACCESS_TOKEN') || error.message?.includes('401')) {
       console.warn('Genius API token missing or invalid');
       return res.status(200).json({ songs: [], error: 'Genius not configured or invalid key' });
    }

    res.status(500).json({
      error: 'Failed to search Genius',
      message: error.message
    });
  }
}
