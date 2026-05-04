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

    // resetPlayer is always called before setQueue, so no need to preserve activeIndex here
    setQueue: (queue) => set({
        queue: Array.isArray(queue) ? queue : [],
    }),

    setActiveIndex: (activeIndex) => set({ activeIndex }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),

    // Split to avoid high-frequency currentTime updates triggering duration subscribers
    setCurrentTime: (currentTime) => set({ currentTime }),
    setDuration: (duration) => set({ duration }),

    resetPlayer: () => set(initialPlayerState),

    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

    cycleRepeat: () =>
        set((state) => {
            const order = ['off', 'one', 'all'];
            const next = order[(order.indexOf(state.repeat) + 1) % order.length];
            return { repeat: next };
        }),

    nextIndex: () => {
        const { queue, activeIndex, shuffle, repeat } = get();
        if (shuffle) return getShuffledNextIndex(queue, activeIndex);
        return getNextIndex(queue, activeIndex, repeat);
    },

    previousIndex: () => {
        const { queue, activeIndex } = get();
        return getPreviousIndex(queue, activeIndex);
    },
}));