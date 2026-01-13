# Genius Lyrics Integration - Deployment Guide

## Overview

This implementation adds exact song lyrics fetching using the Genius API with a Vercel serverless backend.

## Architecture

```
┌─────────────┐
│   React     │
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Vercel/Netlify │
│  Serverless     │
│  Function      │
└──────┬──────────┘
       │
       ├─→ Genius API (free tier)
       │
       ▼
   Browser (localStorage cache)
```

## Files Changed

### Backend (Vercel Serverless)
- `api/lyrics.ts` - Serverless function that fetches lyrics from Genius API

### Frontend (React)
- `src/lib/lyrics.ts` - Frontend utility for calling the API
- `src/lib/gemini.ts` - Modified to try exact lyrics first, then AI translation
- `src/views/SettingsView.tsx` - Added Genius API key configuration UI
- `src/context/PhraseContext.tsx` - Added geniusApiKey state management

### Configuration
- `.env.example` - Added GENIUS_ACCESS_TOKEN documentation
- `src/lib/locales/en.json` - Added Genius API translation keys

## Deployment Instructions

### Option 1: Vercel (Recommended)

1. **Set up Genius API Key**:
   ```bash
   # Get your token from https://genius.com/api-clients
   # Add to Vercel environment variables
   vercel env add GENIUS_ACCESS_TOKEN
   ```

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

3. **Verify API is working**:
   - Visit `https://your-app.vercel.app/api/lyrics?artist=Beyonce&title=Halo`
   - Should return JSON with lyrics field

### Option 2: Local Development with Vercel Dev

```bash
# Install Vercel CLI
npm i -g vercel

# Start local development
vercel dev

# The API will be available at http://localhost:3000/api/lyrics
```

## Environment Variables

### Required

| Variable | Purpose | Where to Set |
|----------|-----------|---------------|
| `GENIUS_ACCESS_TOKEN` | Genius API token for fetching exact lyrics | Vercel dashboard → Settings → Environment Variables |

### Optional (already configured)

| Variable | Purpose | Default Location |
|----------|-----------|------------------|
| `VITE_GEMINI_API_KEY` | Google Gemini API for translation | Vercel env vars |
| `VITE_YOUTUBE_API_KEY` | YouTube Data API for video search | Vercel env vars |

## How It Works

1. **User selects a song** in MusicLearnView
2. **App checks localStorage cache** for existing materials
3. **If cache miss**:
   - Frontend calls `/api/lyrics?artist=X&title=Y`
   - Backend cleans artist/title to remove YouTube annotations (e.g., "Official Video）", brackets, extra whitespace)
   - Backend sends cleaned query `q` to Genius API
   - Backend fetches from Genius API
   - Returns exact lyrics or 404 if not found
4. **If exact lyrics found**:
   - AI translates lyrics to Korean (source language preserved)
   - Returns bilingual lyrics to UI
5. **If exact lyrics NOT found**:
   - Falls back to AI generation with search grounding
   - Same behavior as before, but with better error messages

## Genius API Limits (Free Tier)

- **120 requests/day** - More than enough for personal use
- **Rate limit exceeded** - Shows user-friendly error after 429 response
- **Missing song** - Returns 404 with helpful error message

## Testing

### Test 1: Exact Lyrics
```bash
# In your browser console:
fetch('/api/lyrics?artist=Beyonce&title=Halo')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Test 2: Fallback to AI
```bash
# Try a song not in Genius database
fetch('/api/lyrics?artist=Unknown&title=Song')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Test 3: Full Flow
1. Open Music Learn tab
2. Search for "Shape of You" by Ed Sheeran
3. Click on a video
4. Check browser console for:
   - "Fetching exact lyrics for..." (if found)
   - "Exact lyrics not found, falling back..." (if not found)
5. Verify lyrics display in UI

## Troubleshooting

### Issue: "Server configuration error: Genius API token not configured"
**Solution**: Set GENIUS_ACCESS_TOKEN in Vercel dashboard → Settings → Environment Variables

### Issue: "Rate limit exceeded"
**Solution**: Wait a few hours before searching again, or upgrade to Genius commercial tier

### Issue: "Song not found in Genius database"
**Solution**: The app will fall back to AI generation. This is expected for obscure songs.

### Issue: "Query seems malformed or not matching"
**Solution**: The app now automatically cleans YouTube-specific annotations from artist/title before searching Genius:
- Removes: `（Official Video）`, `(Official Video)`, `[Official Video]`, `【Official Video】`, `Official MV`, `MV`, extra whitespace
- Handles CJK characters (Chinese/Japanese/Korean) in parentheses and brackets
- Normalizes spaces and trims text

This improves Genius matching by removing YouTube metadata artifacts that don't exist in the Genius database.

### Issue: CORS errors in browser console
**Solution**: Ensure the API endpoint is deployed (not running on localhost with different port)

## Benefits

✅ **Exact lyrics** when available in Genius database
✅ **AI translation** preserves original accuracy
✅ **Graceful fallback** to AI for obscure songs
✅ **User-friendly errors** with helpful messages
✅ **Free hosting** on Vercel/Netlify
✅ **No CORS issues** (serverless function handles API calls)
✅ **Scalable** - Easy to add more lyrics sources (Musixmatch, etc.)

## Future Enhancements

- [ ] Add Musixmatch as secondary source (requires commercial license)
- [ ] Cache Genius results on backend to reduce API calls
- [ ] Add lyrics quality indicator (exact vs AI-generated)
- [ ] Support synced lyrics (karaoke-style timestamps)
- [ ] Add option to manually edit/correct lyrics
