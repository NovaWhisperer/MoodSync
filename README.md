# MoodSync

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express)](https://expressjs.com/)

**AI-powered mood detection meets music discovery**

*A full-stack web application that uses computer vision to detect facial expressions and recommends personalized songs based on your emotional state.*

[Live Demo](#) • [Documentation](./docs) • [Issues](https://github.com/NovaWhisperer/MoodSync/issues)

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

**MoodSync** combines real-time facial expression recognition with intelligent music recommendation to create a unique, emotion-aware music discovery experience. Using advanced computer vision algorithms, the application analyzes your facial expressions through your webcam and curates a personalized music queue based on your detected emotional state.

### Key Use Cases

- **Mood-based playlist generation** - Get song recommendations that match your current emotional state
- **Emotional wellness tracking** - Monitor mood patterns over time (future feature)
- **Interactive music discovery** - Explore songs categorized by emotional resonance
- **Personalized listening experience** - Dynamic queue management with theme customization

---

## ✨ Features

### 🧠 Intelligent Mood Detection
- **Real-time facial analysis** using industry-standard face-api.js with TinyFaceDetector
- **Seven emotional states** recognized: Happy, Sad, Angry, Fearful, Disgusted, Surprised, Neutral
- **Optimized performance** with continuous camera stream processing and zero frame drops
- **Privacy-first approach** - All detection happens locally in the browser; no image data sent to servers

### 🎵 Smart Music Recommendations
- **Emotion-based filtering** - Automatically curates song recommendations matching detected mood
- **Dynamic queue management** - Drag-and-drop reordering with smooth animations
- **Persistent playback state** - Session-aware music queue management
- **Multi-format support** - Upload and play various audio formats

### 🌓 Adaptive UI Experience
- **Light/Dark theme toggle** - Fully customizable color schemes with localStorage persistence
- **CSS variable system** - Easy theme modifications without code changes
- **Responsive design** - Optimized for mobile (760px), tablet, and desktop (1080px+) breakpoints
- **Smooth transitions** - All theme and UI changes include polished animations

### 📦 Production-Ready Infrastructure
- **Scalable architecture** - Microservices-ready backend separation
- **Cloud deployment** - Pre-configured for Vercel (frontend) and Render (backend)
- **Error handling** - Comprehensive error management and user feedback
- **State management** - Zustand for efficient, predictable state handling

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 19 |
| **Vite** | Build tool & dev server | 8 |
| **Tailwind CSS** | Utility-first styling | Latest |
| **face-api.js** | Facial recognition | Latest |
| **Zustand** | State management | Latest |
| **Framer Motion** | Animation library | Latest |
| **Lucide React** | Icon library | Latest |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | 18+ |
| **Express** | Web framework | Latest |
| **Mongoose** | MongoDB ODM | Latest |
| **Multer** | File upload | Latest |
| **ImageKit** | Media hosting | SDK |
| **CORS** | Cross-origin requests | Latest |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **MongoDB Atlas** | Primary database |
| **ImageKit** | CDN & asset management |
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** for version control
- Modern browser with webcam support (Chrome, Firefox, Safari, Edge)

### External Services Required

1. **MongoDB Atlas** - Free tier available
   - Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Get connection string

2. **ImageKit** - For media hosting
   - Sign up at [imagekit.io](https://imagekit.io)
   - Retrieve API credentials

### Quick Start (5 minutes)

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

# 4. Configure environment variables (see Configuration section)
# Backend: cp backend/.env.example backend/.env
# Frontend: cp frontend/.env.example frontend/.env

# 5. Start development servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Your app will be running at:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000

---

## 📁 Project Structure

```
MoodSync/
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js                # Express app configuration
│       ├── db/
│       │   └── db.js             # MongoDB connection
│       ├── models/
│       │   └── song.model.js     # Song schema
│       ├── routes/
│       │   └── song.routes.js    # Song API endpoints
│       └── service/
│           └── storage.service.js # ImageKit integration
├── frontend/
│   ├── index.html                # HTML entry point
│   ├── vite.config.js            # Vite configuration
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Root component
│       ├── index.css             # Global styles with CSS variables
│       ├── components/
│       │   ├── FacialExpression.jsx
│       │   └── MoodSongs.jsx
│       └── public/
│           └── models/           # Face-api.js models
├── LICENSE
└── README.md
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# ImageKit Credentials
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint/

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
```

**⚠️ Important:** The frontend has no hardcoded fallback for `VITE_API_BASE_URL`. Always set this variable in every environment.

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Health Check
```http
GET /
```
Verify backend is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

#### Get All Songs
```http
GET /songs
```
Retrieve all songs, optionally filtered by mood.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `mood` | string | Filter by mood name (optional) |

**Example:**
```http
GET /songs?mood=happy
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Happy Song",
    "artist": "Artist Name",
    "mood": "happy",
    "audioUrl": "https://ik.imagekit.io/...",
    "createdAt": "2024-04-15T10:30:00Z"
  }
]
```

---

#### Create Song (Upload)
```http
POST /songs
Content-Type: multipart/form-data
```
Upload a new song with metadata.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | file | ✓ | Audio file (mp3, wav, m4a) |
| `title` | string | ✓ | Song title |
| `artist` | string | ✓ | Artist name |
| `mood` | string | ✗ | Mood category |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/songs \
  -F "audio=@song.mp3" \
  -F "title=My Song" \
  -F "artist=My Artist" \
  -F "mood=happy"
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "My Song",
  "artist": "My Artist",
  "mood": "happy",
  "audioUrl": "https://ik.imagekit.io/...",
  "createdAt": "2024-04-15T10:35:00Z"
}
```

---

## 🔨 Development

### Available npm Scripts

#### Backend
```bash
npm run dev     # Start with nodemon (watch mode)
npm start       # Start production server
```

#### Frontend
```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build locally
npm run lint    # Run ESLint checks
```

### Development Workflow

1. **Backend changes:** Auto-reload via nodemon
2. **Frontend changes:** HMR (Hot Module Replacement) via Vite
3. **Model updates:** Modify `frontend/src/App.jsx` or component files
4. **Styling:** Edit `frontend/src/index.css` with CSS variables

### Browser DevTools

- Open Developer Console (F12 or Cmd+Option+I)
- Check Network tab for API calls
- Inspect React components with React DevTools extension
- Verify MongoDB data in MongoDB Atlas dashboard

---

## 🌐 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   ```
4. Deploy automatically on push

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure environment variables in Render dashboard
4. Set build command: `npm install`
5. Set start command: `npm start`

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS on both frontend and backend
- [ ] Update `CORS_ORIGIN` to production frontend URL
- [ ] Configure MongoDB IP allowlist
- [ ] Set up monitoring/logging
- [ ] Enable rate limiting on API
- [ ] Test all mobile viewports

---

## 🐛 Troubleshooting

### Backend Issues

#### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### MongoDB Connection Failed
- Verify `MONGO_URI` in `.env`
- Check MongoDB Atlas IP allowlist includes your current IP
- Ensure credentials are correct

#### CORS Errors
- Confirm `CORS_ORIGIN` matches frontend URL
- Check backend is running on correct port

### Frontend Issues

#### Webcam Permission Denied
- Allow camera access in browser settings
- Try a different browser
- Check if HTTPS is required (localhost OK for dev)

#### Mood Detection Not Working
- Ensure adequate lighting
- Check face-api models are loaded (Network tab)
- Try moving camera closer to face

#### Theme Not Persisting
- Clear browser cache and localStorage
- Check DevTools → Application → Local Storage
- Verify `moodsync-theme` key is present

### Build Issues

#### Vite Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Module Not Found Errors
- Verify import paths match file case (case-sensitive on Linux/Mac)
- Check file exists in correct location
- Rebuild TypeScript types if needed

---

## 🤝 Contributing

I welcome contributions! Here's how to help:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Contribution Guidelines
- Follow existing code style
- Write clear commit messages
- Update documentation for new features
- Test on both desktop and mobile
- No console errors before submitting PR

### Areas for Contribution
- 🎨 UI/UX improvements
- 🐛 Bug fixes
- ⚡ Performance optimization
- 📚 Documentation
- 🧪 Test coverage
- 🌍 Internationalization

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Author

**MoodSync** created with ❤️ by [NovaWhisperer](https://github.com/NovaWhisperer)

---

## 📞 Support

- 📖 Check [FAQ](#faq) section
- 🐛 Report bugs via [GitHub Issues](https://github.com/NovaWhisperer/MoodSync/issues)
- 💬 Discuss ideas in [GitHub Discussions](https://github.com/NovaWhisperer/MoodSync/discussions)

---

<div align="center">

**Made with React + Node.js + MongoDB**

⭐ If you found this helpful, please consider giving it a star!

</div>

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
