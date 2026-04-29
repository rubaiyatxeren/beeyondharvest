import { useEffect, useState } from 'react';
import { activeRequests, apiCache, apiFetch } from '../utils/api';

export function useAPI(path, deps = [], skip = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (skip || !path) {
      setLoading(false);
      return;
    }
    
    const cacheKey = path;
    
    if (apiCache.has(cacheKey)) {
      setData(apiCache.get(cacheKey));
      setLoading(false);
      return;
    }
    
    if (activeRequests.has(cacheKey)) {
      activeRequests.get(cacheKey)
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
      return;
    }
    
    setLoading(true);
    const request = apiFetch(path)
      .then((d) => {
        const result = d.data ?? d;
        apiCache.set(cacheKey, result);
        setData(result);
        setLoading(false);
        return result;
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
        throw e;
      })
      .finally(() => activeRequests.delete(cacheKey));
    
    activeRequests.set(cacheKey, request);
  }, [path, skip, ...deps]);
  
  return { data, loading, error, setData };
}