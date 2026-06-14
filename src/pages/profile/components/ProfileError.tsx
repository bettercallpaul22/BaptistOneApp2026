import { AlertCircle, RefreshCw } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';

export const ProfileError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <section className="grid gap-4 rounded-xl border border-red-100 bg-red-50 p-5 text-red-800">
    <div className="flex items-start gap-3">
      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="grid gap-1">
        <AppText variant="h6" color="#991B1B">
          Unable to load profile
        </AppText>
        <AppText variant="bodyMedium" color="#B91C1C">
          {message}
        </AppText>
      </div>
    </div>
    <div>
      <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} onClick={onRetry}>
        Retry
      </AppButton>
    </div>
  </section>
);
