import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ListMusic, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { usePlayerStore } from '../store/playerStore'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
const cn = (...inputs) => twMerge(clsx(inputs))

const shuffleSongs = (songs) => {
    const nextSongs = [...songs]

    for (let index = nextSongs.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        ;[nextSongs[index], nextSongs[randomIndex]] = [nextSongs[randomIndex], nextSongs[index]]
    }

    return nextSongs
}

const MoodSongs = ({ mood, onSongsStateChange }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [isTracksReady, setIsTracksReady] = useState(false)
    const [error, setError] = useState('')
    const [isQueueOpen, setIsQueueOpen] = useState(false)
    const [isCompactScreen, setIsCompactScreen] = useState(() => {
        if (typeof window === 'undefined') {
            return false
        }

        return window.innerWidth < 760
    })
    const audioRefs = useRef({})

    const queue = usePlayerStore((state) => state.queue)
    const activeIndex = usePlayerStore((state) => state.activeIndex)
    const isPlaying = usePlayerStore((state) => state.isPlaying)
    const currentTime = usePlayerStore((state) => state.currentTime)
    const duration = usePlayerStore((state) => state.duration)
    const setQueue = usePlayerStore((state) => state.setQueue)
    const setActiveIndex = usePlayerStore((state) => state.setActiveIndex)
    const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
    const setPlayback = usePlayerStore((state) => state.setPlayback)
    const resetPlayer = usePlayerStore((state) => state.resetPlayer)
    const nextIndex = usePlayerStore((state) => state.nextIndex)
    const previousIndex = usePlayerStore((state) => state.previousIndex)

    const activeSong = activeIndex !== null ? queue[activeIndex] : queue[0] ?? null

    const stopAllAudios = () => {
        Object.values(audioRefs.current).forEach((audio) => {
            audio.pause()
            audio.currentTime = 0
        })
    }

    const ensureAudio = (song, index) => {
        if (!audioRefs.current[index]) {
            const audio = new Audio(song.audio)
            audio.preload = 'metadata'

            audio.addEventListener('timeupdate', () => {
                const state = usePlayerStore.getState()
                if (state.activeIndex === index) {
                    state.setPlayback(
                        audio.currentTime,
                        Number.isFinite(audio.duration) ? audio.duration : 0
                    )
                }
            })

            audio.addEventListener('loadedmetadata', () => {
                const state = usePlayerStore.getState()
                if (state.activeIndex === index) {
                    state.setPlayback(
                        audio.currentTime,
                        Number.isFinite(audio.duration) ? audio.duration : 0
                    )
                }
            })

            audio.addEventListener('ended', () => {
                const state = usePlayerStore.getState()
                if (state.activeIndex === index) {
                    state.setIsPlaying(false)
                    state.setPlayback(0, Number.isFinite(audio.duration) ? audio.duration : 0)
                }
            })

            audioRefs.current[index] = audio
        }

        return audioRefs.current[index]
    }

    const playByIndex = async (index) => {
        const song = queue[index]

        if (!song?.audio) {
            return
        }

        const previous = usePlayerStore.getState().activeIndex
        if (previous !== null && previous !== index) {
            const previousAudio = audioRefs.current[previous]
            if (previousAudio) {
                previousAudio.pause()
            }
        }

        const audio = ensureAudio(song, index)
        setActiveIndex(index)
        setPlayback(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0)

        try {
            await audio.play()
            setIsPlaying(true)
        } catch (playError) {
            console.error('Audio play failed:', playError)
            setError('Unable to play this song right now.')
        }
    }

    const pauseByIndex = (index) => {
        const audio = audioRefs.current[index]
        if (!audio) {
            return
        }

        audio.pause()
        setIsPlaying(false)
    }

    useEffect(() => {
        const updateScreenState = () => {
            setIsCompactScreen(window.innerWidth < 760)
        }

        updateScreenState()
        window.addEventListener('resize', updateScreenState)

        return () => {
            window.removeEventListener('resize', updateScreenState)
        }
    }, [])

    useEffect(() => {
        if (typeof onSongsStateChange !== 'function') {
            return
        }

        onSongsStateChange(Boolean(mood) && isTracksReady && !isLoading && !error)
    }, [mood, isTracksReady, isLoading, error, onSongsStateChange])

    useEffect(() => {
        const controller = new AbortController()
        let isMounted = true

        const preloadAudio = (song, index, signal) => {
            if (!song.audio) {
                return Promise.resolve()
            }

            return new Promise((resolve) => {
                const audio = ensureAudio(song, index)

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

        const fetchSongs = async () => {
            if (!mood) {
                stopAllAudios()
                audioRefs.current = {}
                resetPlayer()
                setIsLoading(false)
                setIsTracksReady(false)
                setError('')
                setIsQueueOpen(false)
                return
            }

            if (!API_BASE_URL) {
                stopAllAudios()
                audioRefs.current = {}
                resetPlayer()
                setIsLoading(false)
                setIsTracksReady(false)
                setError('VITE_API_BASE_URL is not configured')
                setIsQueueOpen(false)
                return
            }

            try {
                stopAllAudios()
                audioRefs.current = {}
                resetPlayer()
                setIsLoading(true)
                setIsTracksReady(false)
                setError('')
                setIsQueueOpen(false)

                const query = mood ? `?mood=${encodeURIComponent(mood)}` : ''
                const response = await fetch(`${API_BASE_URL}/songs${query}`, {
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error(`Failed to load songs (${response.status})`)
                }

                const data = await response.json()
                const fetchedSongs = Array.isArray(data.songs) ? data.songs : []
                const randomizedSongs = shuffleSongs(fetchedSongs)

                if (!isMounted || controller.signal.aborted) {
                    return
                }

                setQueue(randomizedSongs)

                if (!randomizedSongs.length) {
                    setIsTracksReady(true)
                    return
                }

                const trackPromises = randomizedSongs.map((song, index) =>
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
                setQueue([])
                setIsTracksReady(false)
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        fetchSongs()

        return () => {
            isMounted = false
            controller.abort()
            stopAllAudios()
            audioRefs.current = {}
        }
    }, [mood, resetPlayer, setQueue])

    const handlePlayPause = async () => {
        if (!queue.length) {
            return
        }

        const targetIndex = activeIndex !== null ? activeIndex : 0

        if (isPlaying && activeIndex !== null) {
            pauseByIndex(targetIndex)
            return
        }

        await playByIndex(targetIndex)
    }

    const handleTrackToggle = async (index) => {
        if (activeIndex === index && isPlaying) {
            pauseByIndex(index)
            return
        }

        await playByIndex(index)
    }

    const handleNext = async () => {
        const target = nextIndex()
        if (target === null) {
            return
        }

        await playByIndex(target)
    }

    const handlePrevious = async () => {
        const target = previousIndex()
        if (target === null) {
            return
        }

        await playByIndex(target)
    }

    const handleSeek = (event) => {
        if (activeIndex === null) {
            return
        }

        const audio = audioRefs.current[activeIndex]
        if (!audio) {
            return
        }

        const nextTime = Number(event.target.value)
        audio.currentTime = nextTime
        setPlayback(nextTime, Number.isFinite(audio.duration) ? audio.duration : 0)
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

    const progressPercent = useMemo(() => {
        if (!duration || duration <= 0) {
            return 0
        }

        return Math.min((currentTime / duration) * 100, 100)
    }, [currentTime, duration])

    return (
        <section className='player-panel'>
            <div className='player-header'>
                <h2>Player</h2>
                <button
                    type='button'
                    onClick={() => setIsQueueOpen((value) => !value)}
                    className='queue-toggle'
                    aria-label='Toggle queue'
                >
                    {isQueueOpen ? <X size={18} /> : <ListMusic size={18} />}
                </button>
            </div>

            {!mood ? (
                <div className='state-inline'>Scan your mood to load songs.</div>
            ) : isLoading ? (
                <div className='state-inline'>Loading songs...</div>
            ) : error ? (
                <div className='state-inline error'>{error}</div>
            ) : !isTracksReady ? (
                <div className='state-inline'>Preparing tracks...</div>
            ) : queue.length === 0 ? (
                <div className='state-inline'>No songs found for this mood.</div>
            ) : null}

            {mood && isTracksReady && queue.length > 0 ? (
                <section className='now-playing'>
                    <div className='now-playing-main'>
                        <div className='track-art' aria-hidden='true' />
                        <div className='track-meta'>
                            <p>{activeSong?.title}</p>
                            <span>{activeSong?.artist}</span>
                        </div>
                    </div>

                    <div className='transport'>
                        <button type='button' onClick={handlePrevious} className='transport-btn' aria-label='Previous'>
                            <SkipBack size={16} />
                        </button>
                        <button
                            type='button'
                            onClick={handlePlayPause}
                            disabled={!activeSong?.audio}
                            className='transport-btn main'
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                        </button>
                        <button type='button' onClick={handleNext} className='transport-btn' aria-label='Next'>
                            <SkipForward size={16} />
                        </button>
                    </div>

                    <div className='seek-wrap'>
                        <input
                            type='range'
                            min='0'
                            max={duration > 0 ? duration : 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className='seek'
                        />
                        <div
                            className='seek-progress'
                            style={{
                                width: `${progressPercent}%`,
                            }}
                        />
                    </div>

                    <div className='time-row'>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </section>
            ) : null}

            <AnimatePresence>
                {(queue.length > 0 && (!isCompactScreen || isQueueOpen)) ? (
                    <section key='queue' className='queue'>
                        {queue.map((song, index) => {
                            const isActive = activeIndex === index
                            const hasAudio = Boolean(song.audio)

                            return (
                                <article key={song._id ?? `${song.title}-${index}`} className={cn('queue-item', isActive && 'active')}>
                                    <button
                                        type='button'
                                        className='queue-play'
                                        aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
                                        onClick={() => handleTrackToggle(index)}
                                        disabled={!hasAudio}
                                    >
                                        {isActive && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    </button>

                                    <div className='queue-meta'>
                                        <p>{song.title}</p>
                                        <span>{song.artist}</span>
                                    </div>
                                </article>
                            )
                        })}
                    </section>
                ) : null}
            </AnimatePresence>

            {isCompactScreen && queue.length > 0 && !isQueueOpen ? (
                <button
                    type='button'
                    className='queue-more'
                    onClick={() => setIsQueueOpen(true)}
                >
                    Show songs
                </button>
            ) : null}
        </section>
    )
}

export default MoodSongs
