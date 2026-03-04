// =====================================================
// GLOBAL DATA CACHE — prevents duplicate Supabase queries
// =====================================================
// Each key stores: { data, timestamp, promise (for dedup in-flight) }
// TTL = time-to-live in ms before data is considered stale

const DEFAULT_TTL = 30_000; // 30 seconds

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    promise?: Promise<T>;
}

const store = new Map<string, CacheEntry<any>>();

export const dataCache = {
    /**
     * Get data from cache or fetch it.
     * Deduplicates in-flight requests: if the same key is already being fetched,
     * returns the same promise instead of creating a new one.
     */
    async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl = DEFAULT_TTL): Promise<T> {
        const existing = store.get(key);
        const now = Date.now();

        // Return cached data if fresh
        if (existing && (now - existing.timestamp) < ttl && existing.data !== undefined) {
            return existing.data;
        }

        // If there's already an in-flight request for this key, reuse it
        if (existing?.promise) {
            return existing.promise;
        }

        // Create new fetch promise
        const promise = fetcher().then(data => {
            store.set(key, { data, timestamp: Date.now() });
            return data;
        }).catch(err => {
            // On error, clear the promise so next call retries
            const entry = store.get(key);
            if (entry) {
                delete entry.promise;
            }
            throw err;
        });

        // Store the promise for deduplication
        store.set(key, { ...(existing || { data: undefined, timestamp: 0 }), promise });
        return promise;
    },

    /** Invalidate a specific cache key (force refetch next time) */
    invalidate(key: string) {
        store.delete(key);
    },

    /** Invalidate all cache entries matching a prefix */
    invalidatePrefix(prefix: string) {
        for (const k of store.keys()) {
            if (k.startsWith(prefix)) {
                store.delete(k);
            }
        }
    },

    /** Clear entire cache */
    clear() {
        store.clear();
    },

    /** Update cached data without invalidating (optimistic update) */
    set<T>(key: string, data: T) {
        store.set(key, { data, timestamp: Date.now() });
    },
};
