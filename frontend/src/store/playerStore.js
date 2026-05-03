import { create } from 'zustand';
import {
    getNextIndex,
    getPreviousIndex,
    getShuffledNextIndex,
} from '../lib/playerHelpers';

const initialPlayerState = {
    queue: [],
    activeIndex: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    shuffle: false,
    repeat: 'off', // 'off' | 'one' | 'all'
};

export const usePlayerStore = create((set, get) => ({
    ...initialPlayerState,

    setQueue: (queue) => {
        set((state) => {
            const nextQueue = Array.isArray(queue) ? queue : [];
            const hasActive =
                state.activeIndex !== null && state.activeIndex < nextQueue.length;

            if (!hasActive) {
                return {
                    queue: nextQueue,
                    activeIndex: null,
                    isPlaying: false,
                    currentTime: 0,
                    duration: 0,
                };
            }

            return { queue: nextQueue };
        });
    },

    setActiveIndex: (activeIndex) => set({ activeIndex }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setPlayback: (currentTime, duration) => set({ currentTime, duration }),

    resetPlayer: () => set(initialPlayerState),

    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

    cycleRepeat: () =>
        set((state) => {
            const order = ['off', 'one', 'all'];
            const next = order[(order.indexOf(state.repeat) + 1) % order.length];
            return { repeat: next };
        }),

    // Returns the next index to play, respecting shuffle and repeat settings
    nextIndex: () => {
        const { queue, activeIndex, shuffle, repeat } = get();
        if (shuffle) return getShuffledNextIndex(queue, activeIndex);
        return getNextIndex(queue, activeIndex, repeat);
    },

    // Returns the previous index to play
    previousIndex: () => {
        const { queue, activeIndex } = get();
        return getPreviousIndex(queue, activeIndex);
    },
}));