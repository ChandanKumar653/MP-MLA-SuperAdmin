import { useState, useEffect, useCallback, useRef } from "react";

const useApi = (apiFunc, { immediate = true, params = {}, data = {} } = {}) => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);

  // Store stable refs for params/data to prevent re-renders
  const stableParams = useRef(params);
  const stableData = useRef(data);

  const execute = useCallback(
    async (overrideData) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFunc(overrideData || stableData.current, stableParams.current);
        setResponse(res.data);
        return res.data;
      } catch (err) {
        setError(err.response?.data || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  useEffect(() => {
    if (immediate) {
      execute(); // only run once on mount or apiFunc change
    }
  }, [immediate, execute]);

  return { response, error, loading, execute };
};

export default useApi;
