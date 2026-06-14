import { AlertCircle, RefreshCw } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from './AppLoader';

export interface AppStateFeedbackProps {
  state: 'loading' | 'error' | 'empty';
  title?: string;
  description?: string;
  label?: string;
  retryLabel?: string;
  retrying?: boolean;
  className?: string;
  onRetry?: () => void;
}

export const AppStateFeedback = ({
  state,
  title,
  description,
  label,
  retryLabel = 'Retry',
  retrying = false,
  className = 'min-h-40',
  onRetry,
}: AppStateFeedbackProps) => {
  if (state === 'loading') {
    return (
      <div className={`grid place-items-center ${className}`}>
        <AppLoader label={label ?? title ?? 'Loading'} />
      </div>
    );
  }

  const isError = state === 'error';

  return (
    <div className={`grid place-items-center px-2 text-center ${className}`}>
      <div className="grid w-full max-w-sm justify-items-center gap-3">
        <span
          className={`grid size-12 place-items-center rounded-full ${
            isError ? 'bg-red-50 text-red-700' : 'bg-[#EAF1FF] text-[#123B8D]'
          }`}
        >
          <AlertCircle className="size-6" aria-hidden />
        </span>
        <div className="grid gap-1">
          {title && (
            <AppText variant="h6" color={isError ? '#991B1B' : 'textPrimary'} align="center">
              {title}
            </AppText>
          )}
          {description && (
            <AppText
              variant="bodySmall"
              color={isError ? '#B91C1C' : 'textSecondary'}
              align="center"
            >
              {description}
            </AppText>
          )}
        </div>
        {isError && onRetry && (
          <AppButton
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
            loading={retrying}
            size="sm"
            variant="outline"
            onClick={onRetry}
          >
            {retryLabel}
          </AppButton>
        )}
      </div>
    </div>
  );
};
