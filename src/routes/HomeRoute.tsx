import { Navigate, Outlet } from 'react-router-dom';
import { AppLoader } from '@/components/feedback';
import { useAppSelector } from '@/store/hooks';
import { paths } from './paths';

export const HomeRoute = () => {
  const { hasKnownUser, isAuthChecked, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthChecked) {
    return <AppLoader variant="page" label="Checking session" />;
  }

  return isAuthenticated || hasKnownUser ? <Outlet /> : <Navigate replace to={paths.login} />;
};
