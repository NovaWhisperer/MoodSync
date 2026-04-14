import { useState } from 'react';
import FaceDetector from './components/FacialExpression';
import MoodSongs from './components/MoodSongs';

const App = () => {
  const [mood, setMood] = useState('');

  return (
    <main className='min-h-[100svh] overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.08),transparent_30%),linear-gradient(180deg,#0c0a09_0%,#1c1917_52%,#0c0a09_100%)] text-stone-50'>
      <div className='mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col px-3 py-3 sm:px-4 sm:py-4 lg:px-6'>
        <header className='flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 shadow-2xl shadow-black/25 backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0'>
            <p className='text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-amber-200/90 sm:text-[0.68rem] sm:tracking-[0.35em]'>Mood driven music</p>
            <h1 className='mt-1 text-2xl font-black tracking-tight text-white sm:truncate sm:text-3xl'>Scan, fetch, play.</h1>
          </div>

          <div className='flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-stone-300 sm:ml-auto'>
            <span className='h-2 w-2 rounded-full bg-amber-300' />
            {mood ? `Current mood: ${mood}` : 'Ready for a scan'}
          </div>
        </header>

        <section className='mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[0.92fr_1.08fr]'>
          <FaceDetector onMoodDetected={setMood} />
          <MoodSongs mood={mood} />
        </section>
      </div>
    </main>
  ) 
}

export default App
