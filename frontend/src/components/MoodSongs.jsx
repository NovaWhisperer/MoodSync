import { useEffect, useRef, useState } from 'react'
import { FaPause, FaPlay } from 'react-icons/fa'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const MoodSongs = ({ mood }) => {
    const [activeSong, setActiveSong] = useState(null)
    const [songs, setSongs] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isTracksReady, setIsTracksReady] = useState(false)
    const [error, setError] = useState('')
    const [playback, setPlayback] = useState({ index: null, currentTime: 0, duration: 0 })
    const audioRefs = useRef({})

    useEffect(() => {
        const controller = new AbortController()
        let isMounted = true

        const fetchSongs = async () => {
            if (!mood) {
                setSongs([])
                setIsLoading(false)
                setIsTracksReady(false)
                setError('')
                return
            }

            if (!API_BASE_URL) {
                setSongs([])
                setIsLoading(false)
                setIsTracksReady(false)
                setError('VITE_API_BASE_URL is not configured')
                return
            }

            try {
                setIsLoading(true)
                setIsTracksReady(false)
                setError('')

                const query = mood ? `?mood=${encodeURIComponent(mood)}` : ''
                const response = await fetch(`${API_BASE_URL}/songs${query}`, {
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error(`Failed to load songs (${response.status})`)
                }

                const data = await response.json()
                const fetchedSongs = Array.isArray(data.songs) ? data.songs : []

                if (!isMounted || controller.signal.aborted) {
                    return
                }

                setSongs(fetchedSongs)

                if (!fetchedSongs.length) {
                    setIsTracksReady(true)
                    return
                }

                const trackPromises = fetchedSongs.map((song, index) =>
                    preloadAudio(song, index, controller.signal)
                )

                await Promise.allSettled(trackPromises)

                if (isMounted && !controller.signal.aborted) {
                    setIsTracksReady(true)
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    return
                }

                setError(err.message || 'Failed to load songs')
                setSongs([])
                setIsTracksReady(false)
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        const preloadAudio = (song, index, signal) => {
            if (!song.audio) {
                return Promise.resolve()
            }

            return new Promise((resolve) => {
                const audio = audioRefs.current[index] || new Audio(song.audio)

                audio.preload = 'metadata'
                audioRefs.current[index] = audio

                const cleanup = () => {
                    audio.removeEventListener('loadedmetadata', handleReady)
                    audio.removeEventListener('error', handleReady)
                    signal?.removeEventListener('abort', handleReady)
                }

                const handleReady = () => {
                    cleanup()
                    resolve()
                }

                if (Number.isFinite(audio.duration) && audio.duration > 0) {
                    resolve()
                    return
                }

                audio.addEventListener('loadedmetadata', handleReady, { once: true })
                audio.addEventListener('error', handleReady, { once: true })
                signal?.addEventListener('abort', handleReady, { once: true })

                audio.load()
            })
        }

        fetchSongs()

        return () => {
            isMounted = false
            controller.abort()

            Object.values(audioRefs.current).forEach((audio) => {
                audio.pause()
            })

            audioRefs.current = {}
            setActiveSong(null)
        }
    }, [mood])

    const getAudio = (song, index) => {
        if (!audioRefs.current[index]) {
            const audio = new Audio(song.audio)

            audio.addEventListener('timeupdate', () => {
                setPlayback((current) =>
                    current.index === index
                        ? {
                              index,
                              currentTime: audio.currentTime,
                              duration: Number.isFinite(audio.duration) ? audio.duration : 0,
                          }
                        : current
                )
            })

            audio.addEventListener('loadedmetadata', () => {
                setPlayback((current) =>
                    current.index === index
                        ? {
                              index,
                              currentTime: audio.currentTime,
                              duration: Number.isFinite(audio.duration) ? audio.duration : 0,
                          }
                        : current
                )
            })

            audio.addEventListener('ended', () => {
                setActiveSong(null)
                setPlayback({ index: null, currentTime: 0, duration: 0 })
            })

            audioRefs.current[index] = audio
        }

        return audioRefs.current[index]
    }

    const handlePlay = async (song, index) => {
        if (!song.audio) {
            return
        }

        if (activeSong !== null && activeSong !== index) {
            const previousAudio = audioRefs.current[activeSong]

            if (previousAudio) {
                previousAudio.pause()
            }
        }

        const audio = getAudio(song, index)
        setActiveSong(index)
        setPlayback({
            index,
            currentTime: audio.currentTime,
            duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        })

        try {
            await audio.play()
        } catch (playError) {
            console.error('Audio play failed:', playError)
            setError('Unable to play this song right now.')
        }
    }

    const handlePause = (index) => {
        const audio = audioRefs.current[index]

        if (audio) {
            audio.pause()
        }

        if (activeSong === index) {
            setActiveSong(null)
            setPlayback({ index: null, currentTime: 0, duration: 0 })
        }
    }

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds <= 0) {
            return '0:00'
        }

        const wholeSeconds = Math.floor(seconds)
        const minutes = Math.floor(wholeSeconds / 60)
        const remainingSeconds = String(wholeSeconds % 60).padStart(2, '0')

        return `${minutes}:${remainingSeconds}`
    }

    return (
        <section className='flex min-h-0 flex-col rounded-3xl border border-white/10 bg-stone-950/85 p-4 shadow-2xl shadow-black/25 backdrop-blur sm:rounded-[1.75rem] sm:p-5'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
                <div className='min-w-0'>
                    <p className='text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-amber-200/90'>Recommendations</p>
                    <h2 className='mt-1 text-xl font-black tracking-tight text-white sm:text-2xl'>Songs for your mood</h2>
                    <p className='mt-2 max-w-md text-sm leading-5 text-stone-300'>
                        {mood ? 'The backend is now filtering by the scanned mood.' : 'Scan first to unlock recommendations.'}
                    </p>
                </div>

                {mood ? (
                    <span className='w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200'>
                        {mood}
                    </span>
                ) : null}
            </div>

            {!mood ? (
                <div className='mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-stone-300'>
                    No songs yet. Run a scan and the list will appear here.
                </div>
            ) : isLoading ? (
                <div className='mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-stone-300'>
                    Loading songs...
                </div>
            ) : error ? (
                <div className='mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-6 text-sm text-red-200'>
                    {error}
                </div>
            ) : !isTracksReady ? (
                <div className='mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-stone-300'>
                    Preparing player and loading track metadata...
                </div>
            ) : songs.length === 0 ? (
                <div className='mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-stone-300'>
                    No songs found for this mood yet.
                </div>
            ) : null}

            {mood && isTracksReady && songs.length > 0 ? (
                <div className='mt-4 rounded-3xl border border-white/10 bg-linear-to-br from-amber-300/10 via-white/5 to-rose-300/10 p-4 shadow-inner shadow-black/20'>
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='min-w-0'>
                            <p className='text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-stone-400'>Now playing</p>
                            <h3 className='mt-1 truncate text-lg font-black text-white sm:text-xl'>
                                {activeSong !== null ? songs[activeSong]?.title : songs[0]?.title}
                            </h3>
                            <p className='mt-1 truncate text-sm text-stone-300'>
                                {activeSong !== null ? songs[activeSong]?.artist : songs[0]?.artist}
                            </p>
                        </div>

                        <div className='grid grid-cols-2 gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-stone-300'>
                            <div className='rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center'>
                                <span className='block text-stone-400'>Tracks</span>
                                <span className='mt-1 block text-sm font-bold text-white'>{songs.length}</span>
                            </div>
                            <div className='rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center'>
                                <span className='block text-stone-400'>Status</span>
                                <span className='mt-1 block text-sm font-bold text-emerald-200'>Ready</span>
                            </div>
                        </div>
                    </div>

                    <div className='mt-4 h-2 overflow-hidden rounded-full bg-white/10'>
                        <div
                            className='h-full rounded-full bg-linear-to-r from-amber-300 via-rose-300 to-orange-300 transition-[width] duration-150'
                            style={{
                                width:
                                    playback.index !== null && playback.duration
                                        ? `${Math.min((playback.currentTime / playback.duration) * 100, 100)}%`
                                        : '0%',
                            }}
                        />
                    </div>

                    <div className='mt-2 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.2em] text-stone-400'>
                        <span>{playback.index !== null ? formatTime(playback.currentTime) : '0:00'}</span>
                        <span>{playback.index !== null ? formatTime(playback.duration) : formatTime(0)}</span>
                    </div>
                </div>
            ) : null}

            <div className='mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 sm:pr-2'>
                {songs.map((song, index) => {
                    const isActive = activeSong === index
                    const hasAudio = Boolean(song.audio)

                    return (
                        <div
                            key={song._id ?? `${song.title}-${index}`}
                            className={`group flex flex-col gap-4 rounded-2xl border px-4 py-4 transition sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3 ${
                                isActive
                                    ? 'border-amber-300/40 bg-amber-300/10 shadow-lg shadow-black/25'
                                    : 'border-white/10 bg-white/5 hover:border-amber-300/30 hover:bg-white/10'
                            }`}
                        >
                            <div className='flex min-w-0 items-center gap-4'>
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold shadow-sm ${isActive ? 'bg-amber-300 text-slate-950' : 'bg-amber-400/15 text-amber-200'}`}>
                                    {String(index + 1).padStart(2, '0')}
                                </div>

                                <div className='min-w-0'>
                                    <h3 className='truncate text-base font-bold leading-tight text-white sm:text-lg'>{song.title}</h3>
                                    <p className='truncate text-xs text-stone-300 sm:text-sm'>{song.artist}</p>
                                    {isActive ? (
                                        <div className='mt-2 w-full max-w-xs'>
                                            <div className='h-1.5 w-full overflow-hidden rounded-full bg-white/10'>
                                                <div
                                                    className='h-full rounded-full bg-linear-to-r from-amber-300 via-rose-300 to-orange-300 transition-[width] duration-150'
                                                    style={{
                                                        width: `${playback.index === index && playback.duration ? Math.min((playback.currentTime / playback.duration) * 100, 100) : 0}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className='mt-1 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.2em] text-stone-400'>
                                                <span>{playback.index === index ? formatTime(playback.currentTime) : '0:00'}</span>
                                                <span>{playback.index === index ? formatTime(playback.duration) : formatTime(0)}</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className='flex shrink-0 items-center gap-2 self-end sm:self-auto'>
                                <button
                                    type='button'
                                    aria-label='Pause'
                                    onClick={() => handlePause(index)}
                                    disabled={!hasAudio}
                                    className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-stone-200 transition hover:-translate-y-0.5 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    <FaPause className='text-sm' />
                                </button>

                                <button
                                    type='button'
                                    aria-label='Play'
                                    onClick={() => handlePlay(song, index)}
                                    disabled={!hasAudio}
                                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                        isActive
                                            ? 'border-amber-300 bg-amber-300 text-slate-950 shadow-lg shadow-amber-300/20'
                                            : 'border-white/20 bg-black/30 text-stone-200 hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-200'
                                    }`}
                                >
                                    <FaPlay className='text-sm' />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default MoodSongs
