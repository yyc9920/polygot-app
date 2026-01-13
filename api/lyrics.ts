import Genius from 'genius-lyrics';

let geniusClient: any = null;

function getGeniusClient(headerToken?: string) {
  if (headerToken) {
    return new Genius.Client(headerToken);
  }

  if (!geniusClient) {
    const accessToken = process.env.GENIUS_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('GENIUS_ACCESS_TOKEN environment variable is not set');
    }
    geniusClient = new Genius.Client(accessToken);
  }
  return geniusClient;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  const headerToken = req.headers['x-genius-token'];

  if (!q) {
    return res.status(400).json({
      error: 'Missing required parameter: q (search query)'
    });
  }

  try {
    const Client = getGeniusClient(headerToken as string);

    const searches = await Client.songs.search(q);

    if (!searches || searches.length === 0) {
      return res.status(404).json({
        error: 'Song not found in Genius database',
        query: q
      });
    }

    const song = searches[0];
    const lyrics = await song.lyrics();

    if (!lyrics) {
      return res.status(404).json({
        error: 'Lyrics not available for this song',
        query: q
      });
    }

    res.status(200).json({
      lyrics,
      source: 'genius',
      geniusUrl: song.url
    });

  } catch (error: any) {
    console.error('Error fetching lyrics:', error);

    if (error.message?.includes('GENIUS_ACCESS_TOKEN') || error.message?.includes('401')) {
      return res.status(500).json({
        error: 'Server configuration error: Genius API token not configured or invalid'
      });
    }

    if (error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        query: q
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch lyrics from Genius',
      message: error.message,
      query: q
    });
  }
}
