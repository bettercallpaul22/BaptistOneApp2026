import { Link } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { paths } from '@/routes/paths';

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center content-center gap-4 bg-[#F8FAFC] p-4">
      <AppText variant="displaySmall" align="center">
        Page not found
      </AppText>
      <AppText variant="bodyLarge" align="center" color="textSecondary">
        The page you are looking for does not exist.
      </AppText>
      <Link to={paths.home}>
        <AppButton>Return Home</AppButton>
      </Link>
    </main>
  );
}
