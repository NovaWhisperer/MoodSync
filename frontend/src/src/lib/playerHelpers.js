/**
 * Pure helper functions for player navigation.
 * No store dependency — pass queue and activeIndex directly.
 */

/**
 * Returns the next index in the queue, wrapping around.
 * Respects repeat mode: 'one' returns the same index, 'off'/'all' advance normally.
 */
export const getNextIndex = (queue, activeIndex, repeat = 'off') => {
    if (!queue.length) return null;

    if (repeat === 'one') {
        return activeIndex ?? 0;
    }

    if (activeIndex === null) {
        return 0;
    }

    const next = (activeIndex + 1) % queue.length;

    // If we've looped back to start and repeat is off, signal end of queue
    if (next === 0 && repeat === 'off') {
        return null;
    }

    return next;
};

/**
 * Returns the previous index in the queue, wrapping around.
 */
export const getPreviousIndex = (queue, activeIndex) => {
    if (!queue.length) return null;

    if (activeIndex === null) {
        return queue.length - 1;
    }

    return (activeIndex - 1 + queue.length) % queue.length;
};

/**
 * Returns a random index from the queue that is not the current one.
 * Falls back to 0 if queue has only one item.
 */
export const getShuffledNextIndex = (queue, activeIndex) => {
    if (!queue.length) return null;
    if (queue.length === 1) return 0;

    let random;
    do {
        random = Math.floor(Math.random() * queue.length);
    } while (random === activeIndex);

    return random;
};