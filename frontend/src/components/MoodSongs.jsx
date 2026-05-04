import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ListMusic, Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Shuffle, X } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { usePlayerStore } from '../store/playerStore'
import useSongs from '../hooks/useSongs'
import { cn } from '../lib/utils'

const COMPACT_BREAKPOINT = 760

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
    const s = Math.floor(seconds)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const Equaliser = () => (
    <span className='equaliser' aria-hidden='true'>
        <span className='eq-bar' />
        <span className='eq-bar' />
        <span className='eq-bar' />
    </span>
)

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
    const [isCompactScreen, setIsCompactScreen] = useState(
        () => window.innerWidth < COMPACT_BREAKPOINT
    )
    const audioRefs = useRef({})

    const { songs, isLoading, error, retry } = useSongs(mood)

    const {
        queue, activeIndex, isPlaying, currentTime, duration, shuffle, repeat,
        setQueue, setActiveIndex, setIsPlaying, setCurrentTime, setDuration,
        resetPlayer, nextIndex, previousIndex, toggleShuffle, cycleRepeat,
    } = usePlayerStore(
        useShallow((s) => ({
            queue: s.queue,
            activeIndex: s.activeIndex,
            isPlaying: s.isPlaying,
            currentTime: s.currentTime,
            duration: s.duration,
            shuffle: s.shuffle,
            repeat: s.repeat,
            setQueue: s.setQueue,
            setActiveIndex: s.setActiveIndex,
            setIsPlaying: s.setIsPlaying,
            setCurrentTime: s.setCurrentTime,
            setDuration: s.setDuration,
            resetPlayer: s.resetPlayer,
            nextIndex: s.nextIndex,
            previousIndex: s.previousIndex,
            toggleShuffle: s.toggleShuffle,
            cycleRepeat: s.cycleRepeat,
        }))
    )

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
                    state.setCurrentTime(audio.currentTime)
                }
            })

            audio.addEventListener('loadedmetadata', () => {
                const state = usePlayerStore.getState()
                if (state.activeIndex === index) {
                    state.setCurrentTime(audio.currentTime)
                    state.setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
                }
            })

            audio.addEventListener('ended', () => {
                const state = usePlayerStore.getState()
                if (state.activeIndex !== index) return

                const next = state.nextIndex()
                if (next !== null) {
                    const nextAudio = audioRefs.current[next]
                    if (nextAudio) {
                        state.setActiveIndex(next)
                        state.setCurrentTime(0)
                        state.setDuration(Number.isFinite(nextAudio.duration) ? nextAudio.duration : 0)
                        nextAudio.currentTime = 0
                        nextAudio.play()
                            .then(() => state.setIsPlaying(true))
                            .catch(() => state.setIsPlaying(false))
                    }
                } else {
                    state.setIsPlaying(false)
                    state.setCurrentTime(0)
                }
            })

            audioRefs.current[index] = audio
        }

        return audioRefs.current[index]
    }, [])

    const playByIndex = useCallback(async (index) => {
        const state = usePlayerStore.getState()
        const song = state.queue[index]
        if (!song?.audio) return

        if (state.activeIndex !== null && state.activeIndex !== index) {
            audioRefs.current[state.activeIndex]?.pause()
        }

        const audio = ensureAudio(song, index)
        setActiveIndex(index)
        setCurrentTime(audio.currentTime)
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)

        try {
            await audio.play()
            setIsPlaying(true)
        } catch (err) {
            console.error('Audio play failed:', err)
        }
    }, [ensureAudio, setActiveIndex, setCurrentTime, setDuration, setIsPlaying])

    const pauseByIndex = useCallback((index) => {
        audioRefs.current[index]?.pause()
        setIsPlaying(false)
    }, [setIsPlaying])

    useEffect(() => {
        const update = () => setIsCompactScreen(window.innerWidth < COMPACT_BREAKPOINT)
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    // Sync fetched songs into the player queue
    // stopAllAudios, ensureAudio, resetPlayer, setQueue are stable references — omitted from deps intentionally
    useEffect(() => {
        let isMounted = true

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
                if (isMounted) setIsTracksReady(true)
            }

            preloadAll()
        }

        return () => {
            isMounted = false
            setIsTracksReady(false)
        }
    }, [songs]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (typeof onSongsStateChange !== 'function') return
        const ready = Boolean(mood) && isTracksReady && !isLoading && !error
        onSongsStateChange(ready)
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
        setCurrentTime(nextTime)
    }

    const progressPercent = useMemo(() => {
        if (!duration || duration <= 0) return 0
        return Math.min((currentTime / duration) * 100, 100)
    }, [currentTime, duration])

    const repeatLabel = repeat === 'one' ? 'One' : repeat === 'all' ? 'All' : 'Off'
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

            {mood && isTracksReady && queue.length > 0 && (
                <section className='now-playing player-fade-in'>
                    <div className='now-playing-main'>
                        <div className='track-art' aria-hidden='true' />
                        <div className='track-meta'>
                            <p>{activeSong?.title}</p>
                            <span>{activeSong?.artist}</span>
                        </div>
                    </div>

                    <div className='transport'>
                        <div className='transport-btn-wrap'>
                            <button
                                type='button'
                                onClick={toggleShuffle}
                                className={cn('transport-btn', shuffle && 'transport-btn-active')}
                                aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
                                aria-pressed={shuffle}
                            >
                                <Shuffle size={14} />
                            </button>
                            <span className='transport-label'>Shuffle</span>
                        </div>

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

                        <div className='transport-btn-wrap'>
                            <button
                                type='button'
                                onClick={cycleRepeat}
                                className={cn('transport-btn', repeat !== 'off' && 'transport-btn-active')}
                                aria-label={`Repeat: ${repeat}`}
                                aria-pressed={repeat !== 'off'}
                            >
                                <RepeatIcon size={14} />
                            </button>
                            <span className='transport-label'>{repeatLabel}</span>
                        </div>
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
                        <div className='seek-track' />
                        <div className='seek-progress' style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className='time-row'>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </section>
            )}

            {queue.length > 0 && (!isCompactScreen || isQueueOpen) && (
                <ul className='queue player-fade-in' aria-label='Song queue'>
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
                                    {isActive && isPlaying
                                        ? <Equaliser />
                                        : <Play size={14} />
                                    }
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