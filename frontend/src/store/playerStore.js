import { create } from 'zustand'

const initialPlayerState = {
    queue: [],
    activeIndex: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
}

export const usePlayerStore = create((set, get) => ({
    ...initialPlayerState,
    setQueue: (queue) => {
        set((state) => {
            const nextQueue = Array.isArray(queue) ? queue : []
            const hasActive = state.activeIndex !== null && state.activeIndex < nextQueue.length

            if (!hasActive) {
                return {
                    queue: nextQueue,
                    activeIndex: null,
                    isPlaying: false,
                    currentTime: 0,
                    duration: 0,
                }
            }

            return { queue: nextQueue }
        })
    },
    setActiveIndex: (activeIndex) => set({ activeIndex }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setPlayback: (currentTime, duration) => set({ currentTime, duration }),
    resetPlayer: () => set(initialPlayerState),
    nextIndex: () => {
        const state = get()
        if (!state.queue.length) {
            return null
        }

        if (state.activeIndex === null) {
            return state.queue.length > 1 ? 1 : 0
        }

        return (state.activeIndex + 1) % state.queue.length
    },
    previousIndex: () => {
        const state = get()
        if (!state.queue.length) {
            return null
        }

        if (state.activeIndex === null) {
            return state.queue.length - 1
        }

        return (state.activeIndex - 1 + state.queue.length) % state.queue.length
    },
}))
