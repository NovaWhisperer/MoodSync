# MoodSync

<p>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 18+" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <a href="https://vercel.com/docs"><img src="https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel" alt="Frontend: Vercel" /></a>
  <a href="https://render.com/docs"><img src="https://img.shields.io/badge/Backend-Render-5A3FC0?style=flat-square" alt="Backend: Render" /></a>
</p>

MoodSync is a full-stack web app that detects facial expressions in real-time and recommends curated songs based on the detected mood. Features a responsive design with light/dark theme support and persistent user preferences.

## Highlights

- **Real-time mood detection** using face-api.js with TinyFaceDetector and FaceExpressionNet
- **Mood-based song recommendations** with dynamic filtering and queuing
- **Light/dark theme toggle** with localStorage persistence and smooth transitions
- **Song upload API** with file hosting via ImageKit
- **Responsive design** optimized for mobile and desktop with adaptive queue collapse
- **React + Vite** frontend with Zustand state management
- **Express + MongoDB** backend with comprehensive error handling
- **Deployment-ready** setup for Vercel (frontend) and Render (backend)

## Tech Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS, face-api.js, Zustand, Framer Motion, Lucide React
- **Backend:** Node.js 18+, Express.js, Mongoose, Multer, ImageKit SDK
- **Database:** MongoDB Atlas (or compatible MongoDB)
- **Media Hosting:** ImageKit
- **Deployment:** Vercel (frontend), Render (backend)

## Folder Structure

```text
backend/
  server.js
  src/
    app.js
    db/
    models/
    routes/
    service/
frontend/
  src/
  public/
```

## Prerequisites

- Node.js 18 or newer
- npm or yarn
- MongoDB Atlas account or local MongoDB instance
- ImageKit account with API credentials
- Modern browser with webcam support (for facial expression detection)

## Environment Configuration

Create these files before running the app:

- `backend/.env` (use `backend/.env.example`)
- `frontend/.env` (use `frontend/.env.example`)

### Backend variables

- `PORT`: API port (example: `3000`)
- `MONGO_URI`: MongoDB connection string
- `IMAGEKIT_PUBLIC_KEY`: ImageKit public key
- `IMAGEKIT_PRIVATE_KEY`: ImageKit private key
- `IMAGEKIT_URL_ENDPOINT`: ImageKit URL endpoint
- `CORS_ORIGIN`: Allowed frontend origin(s), comma-separated

### Frontend variables

- `VITE_API_BASE_URL`: Backend base URL (required)

Note: There is no hardcoded localhost fallback in fetch calls. Set `VITE_API_BASE_URL` in every environment.

## Local Development

### 1. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

Create `.env` files in both directories using the provided examples:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Update the `.env` files with your actual credentials.

### 3. Start the development servers

In separate terminals:

```bash
# Terminal 1: Backend (runs on http://localhost:3000)
cd backend
npm run dev

# Terminal 2: Frontend (runs on http://localhost:5173 or 5174)
cd frontend
npm run dev
```

## Features

### Mood Detection
- Real-time facial expression analysis using face-api.js
- Detects emotions: happy, sad, angry, fearful, disgusted, surprised, neutral
- Continuous camera stream processing with no frame drops

### Theme System
- **Light/Dark theme toggle** persisted to localStorage
- CSS custom properties system for easy theme customization
- Smooth transitions between theme states
- Respects user system preferences on first visit

### Responsive Design
- Mobile-first approach with breakpoints at 760px and 1080px
- Queue panel collapses on mobile to prevent layout bloat
- Adaptive component sizing based on viewport
- Touch-friendly controls and spacing

### Music Queue Management
- Drag-and-drop queue reordering with Framer Motion animations
- Persistent queue state during session
- Skip, pause, and playback controls
- Audio file upload with format validation

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## API Reference

### `GET /`

Health endpoint.

### `GET /songs`

Returns all songs.

Optional query params:

- `mood`: filter songs by mood

Example:

```http
GET /songs?mood=happy
```

### `POST /songs`

Creates a song entry with uploaded audio.

Request type:

- `multipart/form-data`

Fields:

- `audio` (file, required)
- `title` (string, required)
- `artist` (string, required)
- `mood` (string, optional)

## npm Scripts

### Backend

- `npm run dev`: start backend in watch mode
- `npm start`: start backend in production mode

### Frontend

- `npm run dev`: start Vite dev server
- `npm run build`: build production assets
- `npm run preview`: preview production build
- `npm run lint`: run ESLint

## Deployment (Render + Vercel)

### 1. Push repository to GitHub

```bash
git init
git add .
git commit -m "Initial deploy-ready commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Deploy backend on Render

1. Create a new Web Service from the GitHub repository.
2. Set Root Directory to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add backend environment variables from `backend/.env.example`.
6. Set `CORS_ORIGIN` to your deployed frontend URL.

### 3. Deploy frontend on Vercel

1. Import the same GitHub repository.
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`.
4. Add env variable `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`.
5. Deploy.

## Troubleshooting

- If songs are not loading in production, verify `VITE_API_BASE_URL` in Vercel.
- If backend requests fail with CORS errors, verify `CORS_ORIGIN` in Render.
- If upload fails, verify ImageKit keys and endpoint.

## License

Licensed under MIT. See `LICENSE` for details.
