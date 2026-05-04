import { useState, useEffect, useCallback } from 'react';
import { Moon, SunMedium } from 'lucide-react';
import FaceDetector from './components/FacialExpression';
import MoodSongs from './components/MoodSongs';
import ErrorBoundary from './components/ErrorBoundary';
import useLocalMood from './hooks/useLocalMood';

const App = () => {
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem('moodsync-theme') || 'light'
  );

  const [mood, setMood] = useLocalMood();
  const [isCameraActive, setIsCameraActive] = useState(!mood);
  const [songsReady, setSongsReady] = useState(false);

  // Apply saved theme to document on mount and on every change
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    window.localStorage.setItem('moodsync-theme', next);
  };

  const handleSongsStateChange = useCallback((ready) => {
    if (ready) {
      setIsCameraActive(false);
      setSongsReady(true);
    }
  }, []);

  const handleRescan = useCallback(() => {
    setMood('');
    setIsCameraActive(true);
    setSongsReady(false);
  }, [setMood]);

  return (
    <main className='screen'>
      <div className='ambient-layer' aria-hidden='true'>
        <span className='ambient-halo ambient-halo-a' />
        <span className='ambient-halo ambient-halo-b' />
      </div>

      <div className='layout'>
        <header className='topbar'>
          <div className='topbar-brand'>
            <div>
              <p className='topbar-kicker'>MoodSync</p>
              <h1 className='topbar-title'>Scan and play</h1>
            </div>

            <div className='mood-status' aria-live='polite' aria-atomic='true'>
              <span className='status-dot' />
              {mood ? mood : 'Waiting'}
            </div>
          </div>

          <button
            type='button'
            className='theme-toggle'
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon size={16} /> : <SunMedium size={16} />}
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        </header>

        <section className='workspace'>
          <ErrorBoundary>
            <FaceDetector
              onMoodDetected={setMood}
              isCameraActive={isCameraActive}
              onRescan={handleRescan}
              songsReady={songsReady}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <MoodSongs mood={mood} onSongsStateChange={handleSongsStateChange} />
          </ErrorBoundary>
        </section>
      </div>
    </main>
  );
};

export default App;