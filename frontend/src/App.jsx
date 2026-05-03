import { useState } from 'react';
import { Moon, SunMedium } from 'lucide-react';
import FaceDetector from './components/FacialExpression';
import MoodSongs from './components/MoodSongs';
import ErrorBoundary from './components/ErrorBoundary';
import useLocalMood from './hooks/useLocalMood';


const App = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('moodsync-theme') || 'light';
  });

  const [mood, setMood] = useLocalMood();
  const [isCameraActive, setIsCameraActive] = useState(!mood); // skip camera if mood restored

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    const root = document.documentElement;
    root.dataset.theme = next;
    root.style.colorScheme = next;
    window.localStorage.setItem('moodsync-theme', next);
  };

  const handleMoodDetected = (nextMood) => {
    setMood(nextMood);
  };

  /**
   * onSongsStateChange now receives two args:
   *   ready  — songs loaded successfully, camera can sleep
   *   failed — fetch failed, camera should stay on so user can rescan
   */
  const handleSongsStateChange = (ready, failed) => {
    if (ready) {
      setIsCameraActive(false);
    }
    if (failed) {
      // Don't lock the camera off on error — let user rescan
      setIsCameraActive(true);
    }
  };

  const handleRescan = () => {
    setMood('');
    setIsCameraActive(true);
  };

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
              onMoodDetected={handleMoodDetected}
              isCameraActive={isCameraActive}
              onRescan={handleRescan}
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