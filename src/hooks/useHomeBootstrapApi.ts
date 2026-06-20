import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { switchAccessThunk } from '@/store/thunks/authThunk';
import { fetchDevotionalBannerThunk } from '@/store/thunks/homeThunk';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import { paths } from '@/routes/paths';
import type { UserAccess } from '@/types/auth';

const ACCESS_DENIED_MESSAGE = 'Access denied: you do not have enough permission to access this resource.';

const getBootstrapErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return 'Unable to load home data.';
};

function findAccessToSwitch(userAccess: UserAccess[]): UserAccess | undefined {
  const active = userAccess.filter((a) => a.status === 'active');
  return active.find((a) => a.resourceType === 'church-member')
    ?? active.find((a) => a.resourceType === 'profile');
}

export const useHomeBootstrapApi = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const authData = useAppSelector((state) => state.auth.authData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const switchingAccess = useRef(false);
  const authDataRef = useRef(authData);

  useEffect(() => {
    authDataRef.current = authData;
  }, [authData]);

  const hasChurchMemberAccess = authData?.currentAccess?.resourceType === 'church-member';

  const refetch = useCallback(async () => {
    if (!isAuthenticated || switchingAccess.current) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const bootstrapPromises: Promise<unknown>[] = [
      dispatch(fetchMemberAccountThunk()).unwrap(),
    ];

    if (hasChurchMemberAccess) {
      bootstrapPromises.push(dispatch(fetchDevotionalBannerThunk()).unwrap());
    }

    try {
      await Promise.all(bootstrapPromises);
    } catch (requestError) {
      const errorMessage = getBootstrapErrorMessage(requestError);

      if (errorMessage === ACCESS_DENIED_MESSAGE && authDataRef.current) {
        const targetAccess = findAccessToSwitch(authDataRef.current.userAccess);

        if (!targetAccess) {
          dispatch(logout());
          navigate(paths.login, { replace: true });
          return;
        }

        try {
          switchingAccess.current = true;
          await dispatch(switchAccessThunk({ accessId: targetAccess.id })).unwrap();

          const retryPromises: Promise<unknown>[] = [
            dispatch(fetchMemberAccountThunk()).unwrap(),
          ];

          if (hasChurchMemberAccess) {
            retryPromises.push(dispatch(fetchDevotionalBannerThunk()).unwrap());
          }

          await Promise.all(retryPromises);
          return;
        } catch {
          dispatch(logout());
          navigate(paths.login, { replace: true });
          return;
        } finally {
          switchingAccess.current = false;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch, isAuthenticated, navigate, hasChurchMemberAccess]);

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
