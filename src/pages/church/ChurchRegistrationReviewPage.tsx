import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppStateFeedback } from '@/components/feedback';
import { paths } from '@/routes/paths';
import { toApiError } from '@/services/api/responseHandler';
import { churchService } from '@/services/church/churchService';
import { useAppDispatch } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';
import type { ChurchRegistrationReviewDetails } from '@/types/church';

type ReviewAction = 'approve' | 'reject';
type DetailsStatus = 'idle' | 'loading' | 'success' | 'error';

const queryTokenKeys = ['token', 'reviewToken', 'registrationReviewToken', 'id'];

const getReviewTokenFromUrl = ({
  pathname,
  searchParams,
  tokenParam,
}: {
  pathname: string;
  searchParams: URLSearchParams;
  tokenParam?: string;
}) => {
  const routeToken = tokenParam?.trim();

  if (routeToken) return routeToken;

  for (const key of queryTokenKeys) {
    const queryToken = searchParams.get(key)?.trim();
    if (queryToken) return queryToken;
  }

  const tokenPathPrefix = `${paths.churchRegistrationReview}/`;

  if (pathname.startsWith(tokenPathPrefix)) {
    return decodeURIComponent(pathname.slice(tokenPathPrefix.length).split('/')[0] ?? '').trim();
  }

  return '';
};

const normalizeStatus = (status?: string | null) => status?.trim().toUpperCase() || 'UNKNOWN';

const formatStatusLabel = (status?: string | null) => {
  const normalized = normalizeStatus(status);

  return normalized
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDateTime = (value?: string | null) => {
  const rawValue = value?.trim();

  if (!rawValue) return 'Not provided';

  const normalizedValue = rawValue
    .replace(' ', 'T')
    .replace(/\.(\d{3})\d+/, '.$1');
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) return rawValue;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getBadgeClassName = (status?: string | null) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'PENDING') return 'border-amber-100 bg-amber-50 text-amber-700';
  if (normalized === 'APPROVED' || normalized === 'ACTIVE') {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  }
  if (normalized === 'REJECTED' || normalized === 'DECLINED') {
    return 'border-red-100 bg-red-50 text-red-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
};

const getHeaderContent = (review: ChurchRegistrationReviewDetails | null) => {
  const status = normalizeStatus(review?.status);

  if (status === 'APPROVED') {
    return {
      eyebrow: 'Review submitted',
      title: 'Church approved',
      description: 'Your approval has been recorded successfully.',
      iconClassName: 'bg-emerald-50 text-emerald-700',
    };
  }

  if (status === 'REJECTED') {
    return {
      eyebrow: 'Review submitted',
      title: 'Church rejected',
      description: 'Your rejection has been recorded successfully.',
      iconClassName: 'bg-red-50 text-red-700',
    };
  }

  if (status !== 'PENDING' && status !== 'UNKNOWN') {
    return {
      eyebrow: 'Review closed',
      title: 'Registration review closed',
      description: `This review is currently ${formatStatusLabel(status)}.`,
      iconClassName: 'bg-slate-100 text-slate-700',
    };
  }

  return {
    eyebrow: 'Pastor review',
    title: review?.churchName || 'Church registration decision',
    description: 'A church registration request is awaiting your pastoral review.',
    iconClassName: 'bg-[#EAF1FF] text-[#123B8D]',
  };
};

const StatusBadge = ({ label, status }: { label: string; status?: string | null }) => (
  <span
    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${getBadgeClassName(
      status,
    )}`}
  >
    <Clock3 className="size-3.5" aria-hidden />
    {label}: {formatStatusLabel(status)}
  </span>
);

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) => (
  <div className="flex min-w-0 gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#EAF1FF] text-[#123B8D]">
      <Icon className="size-4" aria-hidden />
    </span>
    <div className="grid min-w-0 gap-1">
      <AppText variant="caption" color="textMuted" weight="bold">
        {label}
      </AppText>
      <AppText variant="bodySmall" className="break-words">
        {value || 'Not provided'}
      </AppText>
    </div>
  </div>
);

const ChurchRegistrationReviewPage = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { token: tokenParam } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const [review, setReview] = useState<ChurchRegistrationReviewDetails | null>(null);
  const [loadedToken, setLoadedToken] = useState('');
  const [detailsStatus, setDetailsStatus] = useState<DetailsStatus>('idle');
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<ReviewAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reviewToken = useMemo(
    () =>
      getReviewTokenFromUrl({
        pathname: location.pathname,
        searchParams,
        tokenParam,
      }),
    [location.pathname, searchParams, tokenParam],
  );

  const reviewStatus = normalizeStatus(review?.status);
  const isPending = reviewStatus === 'PENDING';
  const content = getHeaderContent(review);

  const fetchReviewDetails = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!reviewToken) return;

      if (!silent) {
        setDetailsStatus('loading');
        setDetailsError(null);
      }

      try {
        const response = await churchService.getRegistrationReview(reviewToken);
        setReview(response.data);
        setLoadedToken(reviewToken);
        setDetailsStatus('success');
      } catch (error) {
        const message = toApiError(error).message || 'Unable to load church registration review.';

        if (!silent) {
          setDetailsStatus('error');
          setDetailsError(message);
        }
      }
    },
    [reviewToken],
  );

  useEffect(() => {
    if (!reviewToken) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchReviewDetails();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchReviewDetails, reviewToken]);

  const handleReviewAction = useCallback(
    async (action: ReviewAction) => {
      if (!reviewToken || actionLoading || !isPending) return;

      setActionLoading(action);
      setActionError(null);

      try {
        const response =
          action === 'approve'
            ? await churchService.approveRegistrationReview(reviewToken)
            : await churchService.rejectRegistrationReview(reviewToken);

        const nextStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        const fallbackMessage =
          action === 'approve'
            ? 'The church registration has been approved.'
            : 'The church registration has been rejected.';

        setReview((current) => (current ? { ...current, status: nextStatus } : current));
        dispatch(
          pushNotification({
            type: 'success',
            title: action === 'approve' ? 'Church approved' : 'Church rejected',
            message: response.message || fallbackMessage,
          }),
        );
        void fetchReviewDetails({ silent: true });
      } catch (error) {
        const message =
          toApiError(error).message ||
          (action === 'approve'
            ? 'Unable to approve church registration.'
            : 'Unable to reject church registration.');

        setActionError(message);
        dispatch(
          pushNotification({
            type: 'error',
            title: action === 'approve' ? 'Approval failed' : 'Rejection failed',
            message,
          }),
        );
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading, dispatch, fetchReviewDetails, isPending, reviewToken],
  );

  const adminName =
    typeof review?.metadata?.adminName === 'string' && review.metadata.adminName.trim()
      ? review.metadata.adminName.trim()
      : 'Not provided';
  const hasCurrentReview = detailsStatus === 'success' && loadedToken === reviewToken && Boolean(review);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0B1F4A]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
        <div className="hidden min-h-[34rem] overflow-hidden rounded-lg bg-[#0B1F4A] text-white shadow-[0_22px_60px_rgba(11,31,74,0.18)] lg:grid">
          <div className="grid content-between gap-8 p-8">
            <div className="grid gap-4">
              <span className="grid size-14 place-items-center rounded-lg bg-white/12 text-[#F5C84B]">
                <Building2 className="size-7" aria-hidden />
              </span>
              <div className="grid gap-3">
                <AppText variant="h2" color="textInverse">
                  BaptistOne church registration
                </AppText>
                <AppText variant="bodyMedium" color="rgba(255,255,255,0.78)">
                  Pastoral reviews help keep church records trusted before a congregation becomes active.
                </AppText>
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-white/12 bg-white/8 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-[#F5C84B] text-[#0B1F4A]">
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <div className="grid gap-0.5">
                  <AppText variant="bodyMedium" color="textInverse" weight="bold">
                    Secure review link
                  </AppText>
                  <AppText variant="caption" color="rgba(255,255,255,0.68)">
                    Token-based approval request
                  </AppText>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid w-full gap-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_44px_rgba(11,31,74,0.12)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className={`grid size-14 shrink-0 place-items-center rounded-full ${content.iconClassName}`}>
              {reviewStatus === 'APPROVED' ? (
                <CheckCircle2 className="size-7" aria-hidden />
              ) : reviewStatus === 'REJECTED' ? (
                <XCircle className="size-7" aria-hidden />
              ) : (
                <ShieldCheck className="size-7" aria-hidden />
              )}
            </span>
            <div className="grid min-w-0 gap-1">
              <AppText variant="overline" color="textMuted" weight="bold">
                {content.eyebrow}
              </AppText>
              <AppText variant="h3">{content.title}</AppText>
              <AppText variant="bodyMedium" color="textSecondary">
                {content.description}
              </AppText>
            </div>
          </div>

          {!reviewToken ? (
            <AppStateFeedback
              className="min-h-56"
              state="error"
              title="Review token missing"
              description="This church registration review link does not include a valid token."
            />
          ) : detailsStatus === 'error' ? (
            <AppStateFeedback
              className="min-h-56"
              state="error"
              title="Unable to load review"
              description={detailsError || 'Unable to load church registration review.'}
              retryLabel="Retry"
              onRetry={() => void fetchReviewDetails()}
            />
          ) : detailsStatus === 'loading' || detailsStatus === 'idle' || !hasCurrentReview ? (
            <AppStateFeedback className="min-h-56" state="loading" label="Loading review details" />
          ) : review ? (
            <>
              <div className="grid gap-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid min-w-0 gap-1">
                    <AppText variant="caption" color="textMuted" weight="bold">
                      Church
                    </AppText>
                    <AppText variant="h5">{review.churchName || 'Church registration'}</AppText>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label="Review" status={review.status} />
                    <StatusBadge label="Church" status={review.churchStatus} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem icon={UserRound} label="Pastor" value={review.pastorName} />
                  <DetailItem icon={Mail} label="Pastor email" value={review.pastorEmail} />
                  <DetailItem icon={UserRound} label="Admin" value={adminName} />
                  <DetailItem
                    icon={CalendarDays}
                    label="Requested"
                    value={formatDateTime(review.requestedAt)}
                  />
                  <DetailItem
                    icon={Clock3}
                    label="Reminder due"
                    value={formatDateTime(review.reminderDueAt)}
                  />
                  {review.respondedAt && (
                    <DetailItem
                      icon={CheckCircle2}
                      label="Responded"
                      value={formatDateTime(review.respondedAt)}
                    />
                  )}
                </div>
              </div>

              {actionError && (
                <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{actionError}</span>
                </div>
              )}

              {isPending ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <AppButton
                    fullWidth
                    disabled={Boolean(actionLoading)}
                    leftIcon={<CheckCircle2 className="size-4" aria-hidden />}
                    loading={actionLoading === 'approve'}
                    size="lg"
                    onClick={() => void handleReviewAction('approve')}
                  >
                    Approve church
                  </AppButton>
                  <AppButton
                    fullWidth
                    disabled={Boolean(actionLoading)}
                    leftIcon={<XCircle className="size-4" aria-hidden />}
                    loading={actionLoading === 'reject'}
                    size="lg"
                    variant="danger"
                    onClick={() => void handleReviewAction('reject')}
                  >
                    Reject church
                  </AppButton>
                </div>
              ) : (
                <div className="rounded-lg border border-[#D6DEEB] bg-white p-4">
                  <AppText variant="bodyMedium" weight="bold">
                    Decision complete
                  </AppText>
                  <AppText variant="bodySmall" color="textSecondary">
                    This review is currently {formatStatusLabel(review.status)}. No further action is
                    available from this link.
                  </AppText>
                </div>
              )}
            </>
          ) : (
            <AppStateFeedback
              className="min-h-56"
              state="empty"
              title="No review details"
              description="No church registration review details were returned for this token."
            />
          )}
        </section>
      </section>
    </main>
  );
};

export default ChurchRegistrationReviewPage;
