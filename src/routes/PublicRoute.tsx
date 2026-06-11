import { Navigate, Outlet } from 'react-router-dom';
import { AppLoader } from '@/components/feedback';
import { paths } from './paths';
import { useAppSelector } from '@/store/hooks';

export const PublicRoute = () => {
  const { isAuthChecked, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthChecked) {
    return <AppLoader variant="page" label="Checking session" />;
  }

  return isAuthenticated ? <Navigate replace to={paths.home} /> : <Outlet />;
};
