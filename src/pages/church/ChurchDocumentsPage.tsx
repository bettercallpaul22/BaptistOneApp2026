import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { ChurchDocumentsPanel } from './ChurchDocumentsPanel';

const ChurchDocumentsPage = () => {
  const navigate = useNavigate();
  const bootstrap = useChurchScreenBootstrapApi();

  return (
    <AppShell>
      <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
        <div className="flex items-center gap-3">
          <AppButton aria-label="Back to church" size="sm" variant="outline" onClick={() => navigate(paths.church)}>
            <ArrowLeft className="size-4" aria-hidden />
          </AppButton>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h5">Church documents</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Documents shared by your church.
            </AppText>
          </div>
        </div>

        <ChurchDocumentsPanel bootstrap={bootstrap} />
      </main>
    </AppShell>
  );
};

export default ChurchDocumentsPage;
