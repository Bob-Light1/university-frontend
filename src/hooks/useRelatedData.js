import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';

/**
 * useRelatedData
 *
 * Fetches multiple related data endpoints in parallel and returns them as a keyed map.
 *
 * Supports two endpoint formats — they can be mixed freely:
 *
 * FORMAT A — static string, campusId injected as a query parameter:
 *   subjects: '/subject'
 *   → GET /subject?campusId=xxx
 *   Useful for generic routes that do not have a campus equivalent.
 *
 * FORMAT B — a function that receives the campusId and returns the full path:
 *   departments: (id) => `/campus/${id}/departments`
 *   → GET /campus/xxx/departments
 *   Useful for campus-scoped routes (isolation + proper authorization).
 *
 * @param {Object} relatedDataEndpoints
 *   Keys = names of the returned data.
 *   Values = string (Format A) or function(campusId) => string (Format B).
 * @param {string} campusId
 *
 * @returns {Object} relatedData  e.g. { departments: [...], classes: [...] }
 */
const useRelatedData = (relatedDataEndpoints = {}, campusId) => {
  const [relatedData, setRelatedData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!campusId || Object.keys(relatedDataEndpoints).length === 0) {
      setRelatedData({});
      setLoading(false);
      return;
    }
    const controller = new AbortController();

    const fetchAll = async () => {
      setLoading(true);
      try {
        const entries = Object.entries(relatedDataEndpoints);

        const results = await Promise.allSettled(
          entries.map(([, endpoint]) => {
            const config = { signal: controller.signal };
            return typeof endpoint === 'function' 
              ? api.get(endpoint(campusId), config) // Format B: function → campusId in the path
              : api.get(endpoint, { ...config, params: { campusId } }); // Format A: string → campusId as a query parameter
          })
        );


         
        const newData = {};
        entries.forEach(([key], index) => {
          const result = results[index];
          if (result.status === 'fulfilled' && result.value.data?.success) {
             
            const payload = result.value.data.data;
            //Normalization : Object -> table ; table -> table.
             newData[key] = Array.isArray(payload) 
              ? payload 
              : ( payload ? [payload] : [] );
          } else {
            newData[key] = [];
            if (
              result.status === 'rejected' &&
              result.reason?.name !== 'CanceledError' &&
              result.reason?.name !== 'AbortError'
            ) {
              console.warn(
                `useRelatedData: failed for "${key}":`,
                result.reason?.message
              );
            }
          }
        });

        setRelatedData(newData);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('useRelatedData error:', err);
        }
      } finally{
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAll();
    return () => controller.abort();

    // relatedDataEndpoints intentionally excluded from deps:
    // it is a config object defined at the module level (stable reference).
    // Including it would cause infinite loops if defined inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusId]); // re-fetch if campus changes

  return { data: relatedData, loading };
};

export default useRelatedData;