import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppLoader } from '@/components/feedback';
import { paths } from './paths';
import { useAppSelector } from '@/store/hooks';

export const ProtectedRoute = () => {
  const location = useLocation();
  const { hasKnownUser, isAuthChecked, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthChecked) {
    return <AppLoader variant="page" label="Checking session" />;
  }

  if (isAuthenticated || hasKnownUser) {
    return <Outlet />;
  }

  return <Navigate replace to={paths.login} state={{ from: location }} />;
};
