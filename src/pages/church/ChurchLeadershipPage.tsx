import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { getLeaderGroupTitle } from './churchLeadershipUtils';
import { ChurchLeadershipPanel } from './ChurchLeadershipPanel';

const getLeadershipPageTitle = (type: string) => getLeaderGroupTitle({ type });

const ChurchLeadershipPage = () => {
  const navigate = useNavigate();
  const { type = '' } = useParams();
  const normalizedType = type.trim().toUpperCase();
  const bootstrap = useChurchScreenBootstrapApi();
  const pageTitle = getLeadershipPageTitle(normalizedType);

  return (
    <AppShell>
      <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
        <div className="flex items-center gap-3">
          <AppButton aria-label="Back to church" size="sm" variant="outline" onClick={() => navigate(paths.church)}>
            <ArrowLeft className="size-4" aria-hidden />
          </AppButton>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h5">{pageTitle}</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Church leadership
            </AppText>
          </div>
        </div>

        <ChurchLeadershipPanel bootstrap={bootstrap} type={normalizedType} />
      </main>
    </AppShell>
  );
};

export default ChurchLeadershipPage;
