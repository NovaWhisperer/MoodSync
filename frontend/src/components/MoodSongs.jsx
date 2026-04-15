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

    const handleToggleCurrent = async () => {
        const index = activeSong !== null ? activeSong : 0
        const song = songs[index]

        if (!song?.audio) {
            return
        }

        if (activeSong === index) {
            handlePause(index)
            return
        }

        await handlePlay(song, index)
    }

    const handleTrackAction = async (song, index) => {
        if (activeSong === index) {
            handlePause(index)
            return
        }

        await handlePlay(song, index)
    }

    const displayIndex = activeSong !== null ? activeSong : 0
    const displaySong = songs[displayIndex]
    const isDisplaySongActive = activeSong === displayIndex
    const canControlDisplaySong = Boolean(displaySong?.audio)

    return (
        <section className='panel panel-songs'>
            <div className='panel-header'>
                <div>
                    <p className='panel-kicker'>Recommendation deck</p>
                    <h2 className='panel-title'>Songs tuned to your mood</h2>
                    <p className='panel-copy'>
                        {mood ? 'Mood captured. Playlist is filtered from your backend in real time.' : 'Scan your face first to unlock personalized tracks.'}
                    </p>
                </div>

                {mood ? <span className='mood-chip'>{mood}</span> : null}
            </div>

            {!mood ? (
                <div className='state-banner'>No songs yet. Run a mood scan and your playlist will appear here.</div>
            ) : isLoading ? (
                <div className='state-banner'>Loading songs...</div>
            ) : error ? (
                <div className='state-banner is-error'>{error}</div>
            ) : !isTracksReady ? (
                <div className='state-banner'>Preparing the player and reading track metadata...</div>
            ) : songs.length === 0 ? (
                <div className='state-banner'>No songs found for this mood yet.</div>
            ) : null}

            {mood && isTracksReady && songs.length > 0 ? (
                <section className='player-card'>
                    <div className='player-top'>
                        <div className='player-glow' aria-hidden='true'>
                            <span />
                        </div>

                        <div className='player-head'>
                            <p className='player-label'>Now playing</p>
                            <h3 className='player-title'>{displaySong?.title}</h3>
                            <p className='player-artist'>{displaySong?.artist}</p>
                            <p className='player-tip'>{songs.length} tracks ready</p>
                        </div>
                    </div>

                    <div className='player-controls'>
                        <button
                            type='button'
                            onClick={handleToggleCurrent}
                            disabled={!canControlDisplaySong}
                            className='player-main-btn'
                        >
                            {isDisplaySongActive ? <FaPause /> : <FaPlay />}
                            <span>{isDisplaySongActive ? 'Pause' : 'Play'}</span>
                        </button>
                    </div>

                    <div className='progress-rail'>
                        <div
                            className='progress-value'
                            style={{
                                width:
                                    playback.index !== null && playback.duration
                                        ? `${Math.min((playback.currentTime / playback.duration) * 100, 100)}%`
                                        : '0%',
                            }}
                        />
                    </div>

                    <div className='progress-time'>
                        <span>{playback.index !== null ? formatTime(playback.currentTime) : '0:00'}</span>
                        <span>{playback.index !== null ? formatTime(playback.duration) : formatTime(0)}</span>
                    </div>
                </section>
            ) : null}

            <div className='songs-list'>
                {songs.map((song, index) => {
                    const isActive = activeSong === index
                    const hasAudio = Boolean(song.audio)

                    return (
                        <article key={song._id ?? `${song.title}-${index}`} className={`song-row ${isActive ? 'is-active' : ''}`}>
                            <div className='song-main'>
                                <div className='song-index'>{String(index + 1).padStart(2, '0')}</div>

                                <div className='song-meta'>
                                    <h3>{song.title}</h3>
                                    <p>{song.artist}</p>

                                    {isActive ? (
                                        <>
                                            <div className='progress-rail'>
                                                <div
                                                    className='progress-value'
                                                    style={{
                                                        width: `${playback.index === index && playback.duration ? Math.min((playback.currentTime / playback.duration) * 100, 100) : 0}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className='progress-time'>
                                                <span>{playback.index === index ? formatTime(playback.currentTime) : '0:00'}</span>
                                                <span>{playback.index === index ? formatTime(playback.duration) : formatTime(0)}</span>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            <div className='song-actions'>
                                <button
                                    type='button'
                                    aria-label={isActive ? 'Pause' : 'Play'}
                                    onClick={() => handleTrackAction(song, index)}
                                    disabled={!hasAudio}
                                    className={`icon-button is-primary ${isActive ? 'is-active' : ''}`}
                                >
                                    {isActive ? <FaPause /> : <FaPlay />}
                                </button>
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}

export default MoodSongs
