import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthData, UserAccess } from '@/types/auth';
import { paths } from '@/routes/paths';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

function findBestAccess(userAccess: UserAccess[]): UserAccess | undefined {
  const active = userAccess.filter((a) => a.status === 'active');
  return active.find((a) => a.resourceType === 'church-member')
    ?? active.find((a) => a.resourceType === 'profile');
}

export function usePostLoginAccess(authData: AuthData | null) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isRegisterRequired = (() => {
    if (!authData) return false;
    if (authData.currentAccess.resourceType === 'church-member') return false;
    const active = authData.userAccess.filter((a) => a.status === 'active');
    const hasChurch = active.some((a) => a.resourceType === 'church-member');
    const hasProfile = active.some((a) => a.resourceType === 'profile');
    return !hasChurch && !hasProfile;
  })();

  const showNoAccessModal = false;

  const handleLogoutAndRedirect = useCallback(() => {
    dispatch(logout());
    navigate(paths.login, { replace: true });
  }, [dispatch, navigate]);

  return {
    ready: !isRegisterRequired,
    showNoAccessModal,
    registerRequired: isRegisterRequired,
    findBestAccess,
    handleLogoutAndRedirect,
  };
}
