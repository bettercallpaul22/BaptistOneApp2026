import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthData, UserAccess } from '@/types/auth';
import { paths } from '@/routes/paths';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { switchAccessThunk } from '@/store/thunks/authThunk';

const VALID_ACCESS_TYPES = ['church-member', 'profile'] as const;

function findFallbackAccess(userAccess: UserAccess[]): UserAccess | undefined {
  const active = userAccess.filter((a) => a.status === 'active');
  return active.find((a) => a.resourceType === 'church-member')
    ?? active.find((a) => a.resourceType === 'profile');
}

type AccessStatus = 'ready' | 'checking' | 'no-access';

function getInitialStatus(authData: AuthData | null): AccessStatus {
  if (!authData) return 'ready';
  const currentType = authData.currentAccess.resourceType;
  if ((VALID_ACCESS_TYPES as readonly string[]).includes(currentType)) return 'ready';
  const fallback = findFallbackAccess(authData.userAccess);
  return fallback ? 'checking' : 'no-access';
}

export function usePostLoginAccess(authData: AuthData | null) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AccessStatus>(() => getInitialStatus(authData));
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'checking' || !authData) return;

    if (processedRef.current === authData.access.token) return;
    processedRef.current = authData.access.token;

    const targetAccess = findFallbackAccess(authData.userAccess);
    if (!targetAccess) return;

    let cancelled = false;

    dispatch(switchAccessThunk({ accessId: targetAccess.id }))
      .unwrap()
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('no-access');
      });

    return () => {
      cancelled = true;
    };
  }, [status, authData, dispatch]);

  const handleLogoutAndRedirect = useCallback(() => {
    dispatch(logout());
    navigate(paths.login, { replace: true });
  }, [dispatch, navigate]);

  return {
    ready: status === 'ready',
    showNoAccessModal: status === 'no-access',
    handleLogoutAndRedirect,
  };
}
