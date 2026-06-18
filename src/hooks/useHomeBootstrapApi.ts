import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDevotionalBannerThunk } from '@/store/thunks/homeThunk';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';

const getBootstrapErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return 'Unable to load home data.';
};

export const useHomeBootstrapApi = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        dispatch(fetchMemberAccountThunk()).unwrap(),
        dispatch(fetchDevotionalBannerThunk()).unwrap(),
      ]);
    } catch (requestError) {
      setError(getBootstrapErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refetch();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refetch]);

  return {
    loading,
    error,
    refetch,
  };
};
