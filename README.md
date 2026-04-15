# MoodSync

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express)](https://expressjs.com/)

**AI-powered mood detection meets music discovery**

*A full-stack web app that detects facial expressions in real time and recommends songs based on your emotional state.*

[Live Demo](https://mood-sync-lovat.vercel.app) • [Documentation](./docs/README.md) • [Issues](https://github.com/NovaWhisperer/MoodSync/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

MoodSync combines webcam-based facial expression detection with mood-matched music recommendations.

The frontend runs emotion detection locally in the browser using face-api.js, and the backend serves song data plus upload support for new tracks.

### Key Use Cases

- **Mood-based discovery** - instantly get songs aligned to your detected emotion
- **Interactive playback flow** - browse and play songs with a clean queue-based experience
- **Easy content management** - upload songs with metadata using a simple API
- **Local-first emotion analysis** - no raw webcam image data is uploaded for detection

---

## ✨ Features

### 🧠 Intelligent Mood Detection
- Real-time facial expression analysis powered by face-api.js
- Browser-based model loading from local static assets
- Continuous webcam stream handling in the client

### 🎵 Smart Music Recommendations
- Filter songs by mood through API query params
- Upload new songs using multipart form data
- Streamable audio URLs managed via ImageKit

### 🌓 Smooth User Experience
- Responsive layout for desktop and mobile
- State management with Zustand for predictable UI behavior
- Animated interactions using Framer Motion

### 📦 Deployable Full-Stack Setup
- Frontend ready for Vercel deployment
- Backend ready for Render deployment
- Environment-based configuration for dev and production

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI library | 19 |
| Vite | Build tool and dev server | 8 |
| Tailwind CSS | Styling | 4 |
| face-api.js | Facial expression detection | 0.22 |
| Zustand | State management | 5 |
| Framer Motion | Animations | 12 |
| Lucide React | Icons | 1 |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 18+ |
| Express | API framework | 5 |
| Mongoose | MongoDB ODM | 9 |
| Multer | Multipart uploads | 2 |
| ImageKit SDK | File storage integration | 7 |
| CORS | Cross-origin control | 2 |

### Infrastructure
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Database |
| ImageKit | Media hosting/CDN |
| Vercel | Frontend hosting |
| Render | Backend hosting |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** package manager
- **MongoDB Atlas** cluster/URI
- **ImageKit** account credentials
- Modern browser with webcam support

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/NovaWhisperer/MoodSync.git
cd MoodSync

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

Create env files:

```bash
# from repository root
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Run development servers:

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

App URLs:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000

---

## 📁 Project Structure

```text
MoodSync/
├── backend/
│   ├── server.js                      # Server entry and startup flow
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js                     # Express middleware and route mount
│       ├── db/
│       │   └── db.js                  # MongoDB connection logic
│       ├── models/
│       │   └── song.model.js          # Song schema definition
│       ├── routes/
│       │   └── song.routes.js         # Song endpoints (GET/POST)
│       └── service/
│           └── storage.service.js     # ImageKit upload helper
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   ├── public/
│   │   └── models/                    # face-api model files
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── FacialExpression.jsx
│       │   └── MoodSongs.jsx
│       └── store/
│           └── playerStore.js
├── docs/
│   └── README.md
├── LICENSE
└── README.md
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/moodsync
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

⚠️ Important: `VITE_API_BASE_URL` is required (no hardcoded localhost fallback).

---

## 📡 API Documentation

### Base URL

```text
http://localhost:3000
```

### Endpoints

#### Health Check
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

---

#### Get Songs
```http
GET /songs
GET /songs?mood=happy
```

Response:

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

---

#### Create Song (Upload)
```http
POST /songs
Content-Type: multipart/form-data
```

Request body:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | file | Yes | Audio file |
| `title` | string | Yes | Song title |
| `artist` | string | Yes | Artist name |
| `mood` | string | Yes | Mood category |

cURL example:

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

Common validation error:

```json
{
  "message": "title, artist, and mood are required",
  "error": "VALIDATION_ERROR"
}
```

---

## 🔨 Development

### Available Scripts

Backend:

```bash
npm run dev     # Start server in watch mode
npm start       # Start production server
npm test        # Placeholder test script
```

Frontend:

```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Lint source files
```

### Local Workflow

1. Start backend first to ensure API availability.
2. Start frontend and verify `VITE_API_BASE_URL` points to backend.
3. Upload sample songs via API and test mood filtering.

---

## 🌐 Deployment

### Frontend (Vercel)

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Env: `VITE_API_BASE_URL=https://your-backend-url.com`

### Backend (Render)

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Env: `PORT`, `MONGO_URI`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`, `CORS_ORIGIN`

More deployment notes: [docs/README.md](./docs/README.md)

---

## 🐛 Troubleshooting

### Songs not loading
- Verify `VITE_API_BASE_URL` is set correctly.
- Confirm backend service is running.
- Inspect browser network errors.

### CORS errors
- Confirm `CORS_ORIGIN` exactly matches frontend URL.
- Use comma-separated values for multiple frontend origins.

### Upload errors
- Ensure request is `multipart/form-data`.
- Include `audio`, `title`, `artist`, and `mood` fields.
- Verify ImageKit credentials and URL endpoint.

### Face detection issues
- Allow webcam permissions.
- Confirm model files are present in `frontend/public/models`.
- Ensure enough lighting and clear face visibility.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-change`.
3. Commit: `git commit -m "Describe your change"`.
4. Push: `git push origin feature/your-change`.
5. Open a pull request.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
