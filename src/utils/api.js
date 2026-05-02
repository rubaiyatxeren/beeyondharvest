import { API } from './constants';

export const apiCache = new Map();
export const activeRequests = new Map();

export async function apiFetch(path, opts = {}) {
    const {
        method = 'GET',
        body,
        headers = {},
        cache = false,
        cacheTTL = 30000, // 30s
        dedupe = true,
        timeout = 10000,
        retries = 1,
    } = opts;

    const key = `${method}:${path}:${body || ''}`;

    // ✅ Return cached response
    if (cache && apiCache.has(key)) {
        const { data, expiry } = apiCache.get(key);
        if (Date.now() < expiry) return data;
        apiCache.delete(key);
    }

    // ✅ Deduplicate identical requests
    if (dedupe && activeRequests.has(key)) {
        return activeRequests.get(key);
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const fetchPromise = (async () => {
        try {
            const res = await fetch(`${API}${path}`, {
                method,
                body,
                headers: {
                    "Content-Type": "application/json",
                    ...headers,
                },
                signal: controller.signal,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Request failed");
            }

            // ✅ Cache response
            if (cache) {
                apiCache.set(key, {
                    data,
                    expiry: Date.now() + cacheTTL,
                });
            }

            return data;

        } catch (err) {
            // 🔁 Retry logic
            if (retries > 0 && err.name !== 'AbortError') {
                return apiFetch(path, {
                    ...opts,
                    retries: retries - 1,
                });
            }
            throw err;
        } finally {
            clearTimeout(id);
            activeRequests.delete(key);
        }
    })();

    activeRequests.set(key, fetchPromise);

    return fetchPromise;
}