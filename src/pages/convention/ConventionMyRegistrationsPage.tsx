import { useCallback, useEffect } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProgramRegistrationsThunk } from '@/store/thunks/conventionThunk';
import type { ConventionProgramRegistration } from '@/types/convention';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

const statusBadge = (status: string) => {
  if (status === 'PAID') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <CheckCircle2 className="size-3" /> Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
      <Clock className="size-3" /> Pending
    </span>
  );
};

const RegistrationRow = ({ registration }: { registration: ConventionProgramRegistration }) => (
  <article className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(11,31,74,0.06)]">
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
      <CalendarDays className="size-5" />
    </span>
    <div className="min-w-0 flex-1 grid gap-1">
      <AppText variant="subtitle" className="line-clamp-1">{registration.attendanceMode}</AppText>
      <AppText variant="caption" color="textMuted">Ref: {registration.reference}</AppText>
      <AppText variant="caption" color="textMuted">{formatDate(registration.createdAt)}</AppText>
    </div>
    {statusBadge(registration.status)}
  </article>
);

export default function ConventionMyRegistrationsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const conventionId = useAppSelector((state) => state.convention.conventionId);
  const { items, loading, error } = useAppSelector((state) => state.convention.registrations);

  useEffect(() => {
    if (conventionId) {
      dispatch(fetchProgramRegistrationsThunk(conventionId));
    }
  }, [conventionId, dispatch]);

  const retry = useCallback(() => {
    if (conventionId) dispatch(fetchProgramRegistrationsThunk(conventionId));
  }, [conventionId, dispatch]);

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[38rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:py-9">
        <header className="flex items-start gap-3">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#123B8D] transition hover:bg-slate-50"
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h4">My Registrations</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {items.length === 0 ? 'No registrations yet' : `${items.length} registration${items.length !== 1 ? 's' : ''}`}
            </AppText>
          </div>
        </header>

        {loading && items.length === 0 && (
          <div className="grid min-h-[40vh] place-items-center">
            <AppLoader label="Loading registrations" />
          </div>
        )}

        {error && items.length === 0 && (
          <div className="grid min-h-[40vh] place-items-center">
            <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
              <AppText variant="h5" color="#991B1B" align="center">{error}</AppText>
              <AppButton leftIcon={<RefreshCw className="size-4" />} loading={loading} onClick={retry}>Retry</AppButton>
            </div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="grid min-h-[40vh] place-items-center">
            <AppText variant="h5" align="center">No registrations yet</AppText>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-3">
            {items.map((reg) => (
              <RegistrationRow key={reg.id} registration={reg} />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
