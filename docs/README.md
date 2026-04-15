# MoodSync Documentation

This folder contains additional guides for running and deploying MoodSync.

## Quick Links

- [Main Project README](../README.md)
- [Frontend Notes](../frontend/README.md)

## Deployment Overview

MoodSync is split into two deployable apps:

1. Frontend: Vercel (Root Directory: frontend)
2. Backend: Render (Root Directory: backend)

Set these environment variables:

- Frontend: VITE_API_BASE_URL=https://your-backend-url.com
- Backend: MONGO_URI, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT, CORS_ORIGIN

## API Summary

Base URL:

```text
http://localhost:3000
```

Endpoints:

- GET /songs
- POST /songs (multipart/form-data: audio, title, artist, mood)

## Notes

- The `mood` field is required when creating songs.
- Keep `CORS_ORIGIN` aligned with your deployed frontend URL.
