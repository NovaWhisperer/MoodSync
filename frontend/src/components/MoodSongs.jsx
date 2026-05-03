import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ListMusic, Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Shuffle, X } from 'lucide-react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { usePlayerStore } from '../store/playerStore'
import useSongs from '../hooks/useSongs'

const cn = (...inputs) => twMerge(clsx(inputs))

// Module-level component — static identity, no re-creation on every MoodSongs render
const SkeletonQueue = () => (
    <div className='queue' aria-hidden='true'>
        {[...Array(4)].map((_, i) => (
            <div key={i} className='queue-item skeleton-item'>
                <div className='skeleton skeleton-circle' />
                <div className='skeleton-meta'>
                    <div className='skeleton skeleton-line' />
                    <div className='skeleton skeleton-line short' />
                </div>
            </div>
        ))}
    </div>
)

const MoodSongs = ({ mood, onSongsStateChange }) => {
    const [isTracksReady, setIsTracksReady] = useState(false)
    const [isQueueOpen, setIsQueueOpen] = useState(false)
    const [isCompactScreen, setIsCompactScreen] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.innerWidth < 760
    })
    const audioRefs = useRef({})

    const { songs, isLoading, error, retry } = useSongs(mood)

    const queue = usePlayerStore((state) => state.queue)
    const activeIndex = usePlayerStore((state) => state.activeIndex)
    const isPlaying = usePlayerStore((state) => state.isPlaying)
    const currentTime = usePlayerStore((state) => state.currentTime)
    const duration = usePlayerStore((state) => state.duration)
    const shuffle = usePlayerStore((state) => state.shuffle)
    const repeat = usePlayerStore((state) => state.repeat)
    const setQueue = usePlayerStore((state) => state.setQueue)
    const setActiveIndex = usePlayerStore((state) => state.setActiveIndex)
    const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
    const setPlayback = usePlayerStore((state) => state.setPlayback)
    const resetPlayer = usePlayerStore((state) => state.resetPlayer)
    const nextIndex = usePlayerStore((state) => state.nextIndex)
    const previousIndex = usePlayerStore((state) => state.previousIndex)
    const toggleShuffle = usePlayerStore((state) => state.toggleShuffle)
    const cycleRepeat = usePlayerStore((state) => state.cycleRepeat)

    const activeSong = activeIndex !== null ? queue[activeIndex] : queue[0] ?? null

    const stopAllAudios = useCallback(() => {
        Object.values(audioRefs.current).forEach((audio) => {
            audio.pause()
            audio.currentTime = 0
        })
    }, [])

    const ensureAudio = useCallback((song, index) => {
        if (!audioRefs.current[index]) {
            const audio = new Audio(song.audio)
            audio.preload = 'metadata'

            audio.addEventListener('timeupdate', () => {
                const state = usePlayerStore.getState()
                if (state.activeIndex === index) {
                    state.setPlayback(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0)
                }
            })

            audio.addEventListener('loadedmetadata', () => {
                const state = usePlayerStore.getState()
                if (state.activeIndex === index) {
                    state.setPlayback(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0)
                }
            })

            audio.addEventListener('ended', () => {
                const state = usePlayerStore.getState()
                if (state.activeIndex !== index) return

                const next = state.nextIndex()
                if (next !== null) {
                    // auto-advance to next track
                    const nextSong = state.queue[next]
                    if (nextSong?.audio) {
                        state.setActiveIndex(next)
                        state.setIsPlaying(false)
                        state.setPlayback(0, 0)
                        // trigger play via a fresh Audio object call
                        const nextAudio = audioRefs.current[next]
                        if (nextAudio) {
                            nextAudio.currentTime = 0
                            nextAudio.play().then(() => state.setIsPlaying(true)).catch(console.error)
                        }
                    }
                } else {
                    state.setIsPlaying(false)
                    state.setPlayback(0, Number.isFinite(audio.duration) ? audio.duration : 0)
                }
            })

            audioRefs.current[index] = audio
        }

        return audioRefs.current[index]
    }, [])

    const playByIndex = async (index) => {
        const song = queue[index]
        if (!song?.audio) return

        const previous = usePlayerStore.getState().activeIndex
        if (previous !== null && previous !== index) {
            audioRefs.current[previous]?.pause()
        }

        const audio = ensureAudio(song, index)
        setActiveIndex(index)
        setPlayback(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0)

        try {
            await audio.play()
            setIsPlaying(true)
        } catch (playError) {
            console.error('Audio play failed:', playError)
        }
    }

    const pauseByIndex = (index) => {
        audioRefs.current[index]?.pause()
        setIsPlaying(false)
    }

    useEffect(() => {
        const update = () => setIsCompactScreen(window.innerWidth < 760)
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    // Sync fetched songs into the player queue
    useEffect(() => {
        let isMounted = true

        // Imperative side-effects only — no setState here
        stopAllAudios()
        audioRefs.current = {}
        resetPlayer()

        if (songs.length) {
            setQueue(songs)

            const preloadAll = async () => {
                await Promise.allSettled(
                    songs.map(
                        (song, index) =>
                            new Promise((resolve) => {
                                const audio = ensureAudio(song, index)
                                if (Number.isFinite(audio.duration) && audio.duration > 0) {
                                    resolve()
                                    return
                                }
                                audio.addEventListener('loadedmetadata', resolve, { once: true })
                                audio.addEventListener('error', resolve, { once: true })
                                audio.load()
                            })
                    )
                )
                // Only update state if songs haven't changed since this effect ran
                if (isMounted) {
                    setIsTracksReady(true)
                }
            }

            preloadAll()
        }

        return () => {
            isMounted = false
            // Reset UI state in cleanup — avoids setState-in-effect-body lint rule
            // and ensures state is clean before the next songs batch arrives
            setIsTracksReady(false)
            setIsQueueOpen(false)
        }
    }, [songs, stopAllAudios, ensureAudio, resetPlayer, setQueue])

    // Tell App.jsx whether the player is ready
    useEffect(() => {
        if (typeof onSongsStateChange !== 'function') return
        const ready = Boolean(mood) && isTracksReady && !isLoading && !error
        const failed = Boolean(mood) && Boolean(error)
        onSongsStateChange(ready, failed)
    }, [mood, isTracksReady, isLoading, error, onSongsStateChange])

    const handlePlayPause = async () => {
        if (!queue.length) return
        const target = activeIndex !== null ? activeIndex : 0
        if (isPlaying && activeIndex !== null) {
            pauseByIndex(target)
            return
        }
        await playByIndex(target)
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
        if (target !== null) await playByIndex(target)
    }

    const handlePrevious = async () => {
        const target = previousIndex()
        if (target !== null) await playByIndex(target)
    }

    const handleSeek = (e) => {
        if (activeIndex === null) return
        const audio = audioRefs.current[activeIndex]
        if (!audio) return
        const nextTime = Number(e.target.value)
        audio.currentTime = nextTime
        setPlayback(nextTime, Number.isFinite(audio.duration) ? audio.duration : 0)
    }

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
        const s = Math.floor(seconds)
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    }

    const progressPercent = useMemo(() => {
        if (!duration || duration <= 0) return 0
        return Math.min((currentTime / duration) * 100, 100)
    }, [currentTime, duration])

    const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat

    return (
        <section className='player-panel'>
            <div className='player-header'>
                <h2>Player</h2>
                <button
                    type='button'
                    onClick={() => setIsQueueOpen((v) => !v)}
                    className='queue-toggle'
                    aria-label='Toggle queue'
                >
                    {isQueueOpen ? <X size={18} /> : <ListMusic size={18} />}
                </button>
            </div>

            {/* ── State messages ─────────────────────────────────────────── */}
            {!mood && (
                <p className='state-inline'>Scan your mood to load songs.</p>
            )}

            {mood && error && (
                <div className='player-error-state'>
                    <p className='state-inline error'>{error}</p>
                    <button type='button' className='rescan-button' onClick={retry}>
                        Retry
                    </button>
                </div>
            )}

            {mood && !error && isLoading && <SkeletonQueue />}

            {mood && !error && !isLoading && isTracksReady && queue.length === 0 && (
                <div className='empty-state'>
                    <p className='empty-state-title'>No songs found</p>
                    <p className='empty-state-body'>
                        There are no songs tagged as <strong>{mood}</strong> yet.
                    </p>
                </div>
            )}

            {/* ── Now playing ───────────────────────────────────────────── */}
            {mood && isTracksReady && queue.length > 0 && (
                <section className='now-playing'>
                    <div className='now-playing-main'>
                        <div className='track-art' aria-hidden='true' />
                        <div className='track-meta'>
                            <p>{activeSong?.title}</p>
                            <span>{activeSong?.artist}</span>
                        </div>
                    </div>

                    <div className='transport'>
                        <button
                            type='button'
                            onClick={toggleShuffle}
                            className={cn('transport-btn', shuffle && 'transport-btn-active')}
                            aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
                            aria-pressed={shuffle}
                        >
                            <Shuffle size={14} />
                        </button>

                        <button
                            type='button'
                            onClick={handlePrevious}
                            className='transport-btn'
                            aria-label='Previous track'
                        >
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

                        <button
                            type='button'
                            onClick={handleNext}
                            className='transport-btn'
                            aria-label='Next track'
                        >
                            <SkipForward size={16} />
                        </button>

                        <button
                            type='button'
                            onClick={cycleRepeat}
                            className={cn('transport-btn', repeat !== 'off' && 'transport-btn-active')}
                            aria-label={`Repeat: ${repeat}`}
                            aria-pressed={repeat !== 'off'}
                        >
                            <RepeatIcon size={14} />
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
                            aria-label='Seek'
                        />
                        <div className='seek-progress' style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className='time-row'>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </section>
            )}

            {/* ── Queue ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {queue.length > 0 && (!isCompactScreen || isQueueOpen) && (
                    <ul key='queue' className='queue' aria-label='Song queue'>
                        {queue.map((song, index) => {
                            const isActive = activeIndex === index
                            const hasAudio = Boolean(song.audio)

                            return (
                                <li
                                    key={song._id ?? `${song.title}-${index}`}
                                    className={cn('queue-item', isActive && 'active')}
                                >
                                    <button
                                        type='button'
                                        className='queue-play'
                                        aria-label={
                                            isActive && isPlaying
                                                ? `Pause ${song.title}`
                                                : `Play ${song.title}`
                                        }
                                        onClick={() => handleTrackToggle(index)}
                                        disabled={!hasAudio}
                                    >
                                        {isActive && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    </button>

                                    <div className='queue-meta'>
                                        <p>{song.title}</p>
                                        <span>{song.artist}</span>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </AnimatePresence>

            {isCompactScreen && queue.length > 0 && !isQueueOpen && (
                <button
                    type='button'
                    className='queue-more'
                    onClick={() => setIsQueueOpen(true)}
                    aria-label='Show all songs in queue'
                >
                    Show songs
                </button>
            )}
        </section>
    )
}

export default MoodSongs