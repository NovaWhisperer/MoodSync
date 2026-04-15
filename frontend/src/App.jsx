import { useEffect, useState } from 'react';
import { Moon, SunMedium } from 'lucide-react';
import FaceDetector from './components/FacialExpression';
import MoodSongs from './components/MoodSongs';

const App = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.localStorage.getItem('moodsync-theme') || 'light';
  });
  const [mood, setMood] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    window.localStorage.setItem('moodsync-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const handleMoodDetected = (nextMood) => {
    setMood(nextMood);
  };

  const handleSongsStateChange = (isReady) => {
    if (isReady) {
      setIsCameraActive(false);
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

            <div className='mood-status'>
              <span className='status-dot' />
              {mood ? mood : 'Waiting'}
            </div>
          </div>

          <button type='button' className='theme-toggle' onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
            {theme === 'light' ? <Moon size={16} /> : <SunMedium size={16} />}
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        </header>

        <section className='workspace'>
          <FaceDetector
            onMoodDetected={handleMoodDetected}
            isCameraActive={isCameraActive}
            onRescan={handleRescan}
          />
          <MoodSongs mood={mood} onSongsStateChange={handleSongsStateChange} />
        </section>
      </div>
    </main>
  );
};

export default App;
