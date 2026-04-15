# MoodSync

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express)](https://expressjs.com/)

AI-powered mood detection meets music discovery.

[Live Demo](https://mood-sync-lovat.vercel.app) • [Documentation](./docs/README.md) • [Issues](https://github.com/NovaWhisperer/MoodSync/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Open Source Notices](#open-source-notices)
- [Contributing](#contributing)
- [License](#license)

---

<a id="overview"></a>
## Overview

MoodSync is a full-stack web app that detects facial expressions in the browser and recommends songs that match the detected mood.

The frontend runs face detection locally using face-api.js and sends mood-based requests to the backend API for song retrieval.

---

<a id="features"></a>
## Features

- Real-time mood detection using webcam input
- Emotion-based song filtering
- Song upload endpoint with file + metadata validation
- In-browser audio playback with queue controls
- Theme toggle and responsive UI

---

<a id="tech-stack"></a>
## Tech Stack

### Frontend

- React 19
- Vite 8
- face-api.js
- Zustand
- Framer Motion
- Tailwind CSS

### Backend

- Node.js 18+
- Express 5
- MongoDB + Mongoose
- Multer (multipart upload)
- ImageKit (file storage)

---

<a id="project-structure"></a>
## Project Structure

```text
MoodSync/
|- backend/
|  |- server.js
|  |- package.json
|  |- .env.example
|  \- src/
|     |- app.js
|     |- db/db.js
|     |- models/song.model.js
|     |- routes/song.routes.js
|     \- service/storage.service.js
|- frontend/
|  |- index.html
|  |- package.json
|  |- .env.example
|  \- src/
|     |- App.jsx
|     |- main.jsx
|     |- index.css
|     \- components/
|        |- FacialExpression.jsx
|        \- MoodSongs.jsx
|- docs/
|  \- README.md
|- LICENSE
\- README.md
```

---

<a id="getting-started"></a>
## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas project/cluster
- ImageKit account
- Browser with camera access

### 1. Clone

```bash
git clone https://github.com/NovaWhisperer/MoodSync.git
cd MoodSync
```

### 2. Install dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 3. Configure environment files

```bash
# backend
cp backend/.env.example backend/.env

# frontend
cp frontend/.env.example frontend/.env
```

If you are on Windows PowerShell, use:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

### 4. Run locally

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

<a id="configuration"></a>
## Configuration

### Backend .env

```env
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/moodsync
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
CORS_ORIGIN=http://localhost:5173
```

### Frontend .env

```env
VITE_API_BASE_URL=http://localhost:3000
```

Note: VITE_API_BASE_URL is required. The frontend does not use a hardcoded localhost fallback.

---

<a id="api-documentation"></a>
## API Documentation

Base URL:

```text
http://localhost:3000
```

### Health Check

```http
GET /
```

Response:

```json
{
  "message": "MoodSync API is running",
  "health": "ok"
}
```

### Get Songs

```http
GET /songs
GET /songs?mood=happy
```

Query params:

- mood (optional): filter songs by mood

Success response:

```json
{
  "message": "Songs retrieved successfully",
  "songs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Happy Song",
      "artist": "Artist Name",
      "audio": "https://ik.imagekit.io/...",
      "mood": "happy"
    }
  ]
}
```

### Create Song

```http
POST /songs
Content-Type: multipart/form-data
```

Request body:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| audio | file | Yes | Audio file |
| title | string | Yes | Song title |
| artist | string | Yes | Artist name |
| mood | string | Yes | Mood category |

Example:

```bash
curl -X POST http://localhost:3000/songs \
  -F "audio=@song.mp3" \
  -F "title=My Song" \
  -F "artist=My Artist" \
  -F "mood=happy"
```

Success response:

```json
{
  "message": "Song created successfully",
  "song": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My Song",
    "artist": "My Artist",
    "audio": "https://ik.imagekit.io/...",
    "mood": "happy"
  }
}
```

Validation error example:

```json
{
  "message": "title, artist, and mood are required",
  "error": "VALIDATION_ERROR"
}
```

---

<a id="deployment"></a>
## Deployment

### Frontend (Vercel)

- Root directory: frontend
- Build command: npm run build
- Output directory: dist
- Env: VITE_API_BASE_URL=https://your-backend-url.com

### Backend (Render)

- Root directory: backend
- Build command: npm install
- Start command: npm start
- Env: PORT, MONGO_URI, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT, CORS_ORIGIN

More details: [docs/README.md](./docs/README.md)

---

<a id="troubleshooting"></a>
## Troubleshooting

### Songs not loading

- Verify VITE_API_BASE_URL in frontend env
- Verify backend is running and reachable
- Check browser Network tab for API errors

### CORS errors

- Verify CORS_ORIGIN exactly matches frontend URL
- If multiple origins are needed, use a comma-separated list in CORS_ORIGIN

### Upload failures

- Ensure multipart/form-data is used
- Ensure audio file is present
- Ensure title, artist, and mood are present and non-empty
- Verify ImageKit credentials and URL endpoint

### Camera issues

- Allow camera permission in browser
- Ensure HTTPS in production
- Confirm model files exist in frontend/public/models

---

<a id="open-source-notices"></a>
## Open Source Notices

MoodSync uses third-party open-source libraries, including:

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) for in-browser facial expression detection

Please refer to each dependency license in package metadata and node_modules for full license terms.

---

<a id="contributing"></a>
## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a branch: git checkout -b feature/your-change
3. Commit: git commit -m "Describe your change"
4. Push: git push origin feature/your-change
5. Open a pull request

---

<a id="license"></a>
## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
