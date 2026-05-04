import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const shuffleSongs = (songs) => {
    const next = [...songs];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
};

const useSongs = (mood) => {
    const [songs, setSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    const retry = useCallback(() => {
        setRetryCount((c) => c + 1);
    }, []);

    useEffect(() => {
        if (!mood) {
            setSongs([]);
            setIsLoading(false);
            setError('');
            return;
        }

        if (!API_BASE_URL) {
            setError('VITE_API_BASE_URL is not configured');
            setSongs([]);
            return;
        }

        const controller = new AbortController();
        let isMounted = true;

        const fetchSongs = async () => {
            setIsLoading(true);
            setError('');
            setSongs([]);

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/v1/songs?mood=${encodeURIComponent(mood)}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error(`Failed to load songs (${response.status})`);
                }

                const data = await response.json();
                const fetched = Array.isArray(data.songs) ? data.songs : [];

                if (isMounted) {
                    setSongs(shuffleSongs(fetched));
                }
            } catch (err) {
                if (err.name === 'AbortError') return;

                if (isMounted) {
                    const isNetworkError =
                        err instanceof TypeError && err.message === 'Failed to fetch';

                    setError(
                        isNetworkError
                            ? 'Unable to reach the server. Check your connection and try again.'
                            : err.message || 'Failed to load songs'
                    );
                }
            } finally {
                // isMounted is false when cleanup ran (unmount/mood change), skip update
                if (isMounted) setIsLoading(false);
            }
        };

        fetchSongs();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [mood, retryCount]);

    return { songs, isLoading, error, retry };
};

export default useSongs;