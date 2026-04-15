import { useState } from 'react';
import FaceDetector from './components/FacialExpression';
import MoodSongs from './components/MoodSongs';

const App = () => {
  const [mood, setMood] = useState('');

  return (
    <main className='app-shell'>
      <div className='ambient-layer' aria-hidden='true'>
        <span className='ambient-orb ambient-orb-a' />
        <span className='ambient-orb ambient-orb-b' />
        <span className='ambient-grid' />
      </div>

      <div className='app-container'>
        <header className='hero-panel'>
          <p className='hero-kicker'>Mood synced soundtrack</p>
          <h1 className='hero-title'>Face scan to instant playlist</h1>

          <div className='status-pill'>
            <span className='status-dot' />
            {mood ? `Current mood: ${mood}` : 'Ready for your first scan'}
          </div>
        </header>

        <section className='app-grid'>
          <FaceDetector onMoodDetected={setMood} />
          <MoodSongs mood={mood} />
        </section>
      </div>
    </main>
  );
};

export default App;
