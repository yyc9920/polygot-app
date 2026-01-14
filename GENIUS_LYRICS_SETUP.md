# Genius Lyrics Integration - Backend Setup Guide

## Overview

This implementation separates the Genius API integration into a dedicated backend service (`polyglot-backend`) to allow the frontend (`polyglot-app`) to be hosted on static hosting like GitHub Pages while the backend handles API secrets and external requests.

## Architecture

```
┌─────────────┐
│   React     │
│   Frontend  │
│ (GH Pages)  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   Express API   │
│   Backend       │
│ (Render/etc.)   │
└──────┬──────────┘
       │
       ├─→ Genius API
       │
       ▼
   Genius Data
```

## Repositories

-   **Frontend**: `polyglot-app`
-   **Backend**: `polyglot-backend`

## Setup Instructions

### 1. Backend Setup (`polyglot-backend`)

The backend is an Express.js server that proxies requests to the Genius API.

1.  Navigate to `polyglot-backend`.
2.  Install dependencies: `npm install`
3.  Configure `.env`:
    ```env
    PORT=3000
    GENIUS_ACCESS_TOKEN=your_token_here
    ```
4.  Run locally: `npm run dev`
5.  Deploy to a Node.js hosting provider (e.g., Render, Railway, Fly.io).

### 2. Frontend Setup (`polyglot-app`)

The frontend consumes the backend API.

1.  Navigate to `polyglot-app`.
2.  Configure `.env` (create if needed):
    ```env
    VITE_BACKEND_URL=http://localhost:3000
    ```
    (Or set to your deployed backend URL in production)
3.  Build/Deploy as usual.

## API Endpoints

The backend exposes:
-   `GET /api/search-genius?q=...`
-   `GET /api/lyrics?q=...`

## Troubleshooting

-   **CORS Errors**: The backend is configured to accept CORS. Ensure your frontend calls the correct backend URL.
-   **Missing Token**: Ensure `GENIUS_ACCESS_TOKEN` is set in the backend environment.
