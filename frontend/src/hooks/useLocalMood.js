import { useState, useCallback } from 'react';

const STORAGE_KEY = 'moodsync-last-mood';

const useLocalMood = () => {
    const [mood, setMoodState] = useState(() => {
        try {
            return window.localStorage.getItem(STORAGE_KEY) || '';
        } catch {
            return '';
        }
    });

    const setMood = useCallback((nextMood) => {
        setMoodState(nextMood);
        try {
            if (nextMood) {
                window.localStorage.setItem(STORAGE_KEY, nextMood);
            } else {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // localStorage unavailable — state still works in memory
        }
    }, []);

    return [mood, setMood];
};

export default useLocalMood;