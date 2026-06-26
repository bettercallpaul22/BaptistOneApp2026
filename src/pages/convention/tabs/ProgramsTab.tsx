import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, Clock, MapPin, RefreshCw, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchConventionProgramsThunk, fetchProgramRegistrationsThunk } from '@/store/thunks/conventionThunk';
import { paths } from '@/routes/paths';
import type { ConventionProgram } from '@/types/convention';

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

const attendanceLabel: Record<string, string> = {
  ONSITE: 'In-Person',
  VIRTUAL: 'Online',
  BOTH: 'In-Person & Online',
};

const ProgramCard = ({ program, isRegistered, onRegister, onViewProgram }: { program: ConventionProgram; isRegistered: boolean; onRegister: (p: ConventionProgram) => void; onViewProgram: (p: ConventionProgram) => void }) => (
  <article className="flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_4px_12px_rgba(11,31,74,0.08)]">
    <div className="relative h-32 bg-gradient-to-br from-[#123B8D] to-[#0B1F4A]">
      {program.coverFile?.url ? (
        <img className="h-full w-full object-cover" src={program.coverFile.url} alt={program.title} />
      ) : (
        <div className="grid h-full place-items-center opacity-20">
          <CalendarDays className="size-12 text-white" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-2 left-3 flex items-center gap-2">
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          {attendanceLabel[program.attendanceMode] ?? program.attendanceMode}
        </span>
        {program.basePrice > 0 ? (
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#0B1F4A]">
            {formatMoney(program.basePrice, program.currency)}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-400/90 px-2 py-0.5 text-[10px] font-bold text-white">
            Free
          </span>
        )}
        {isRegistered && (
          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
            Registered
          </span>
        )}
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-2 p-4">
      <AppText variant="h6" className="font-bold text-[#0B1F4A] line-clamp-1">{program.title}</AppText>
      <AppText variant="bodySmall" color="textSecondary" className="line-clamp-2">{program.description}</AppText>
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#5A6880]">
        {program.startsAt && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatDate(program.startsAt)}
          </span>
        )}
        {program.venue && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {program.venue}
          </span>
        )}
        {program.registrationFields?.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {program.registrationFields.length} fields
          </span>
        )}
      </div>
      <div className="mt-auto pt-2">
        <AppButton fullWidth size="sm" onClick={() => isRegistered ? onViewProgram(program) : onRegister(program)}>
          {isRegistered ? 'View Program' : 'Register'}
        </AppButton>
      </div>
    </div>
  </article>
);

export function ProgramsTab({ conventionId }: { conventionId: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items = [], meta = null, loading = false, loadingMore = false, error = null } = useAppSelector((state) => state.convention?.programs ?? {});
  const registrations = useAppSelector((state) => state.convention?.registrations?.items ?? []);

  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentPage = meta?.page ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const hasMore = currentPage < totalPages;

  const registeredProgramIds = useMemo(() => new Set(registrations.map((r) => r.programId)), [registrations]);

  const fetchPage = useCallback(
    (page: number, search?: string) => {
      dispatch(fetchConventionProgramsThunk({ conventionId, page, limit: 25, search }));
    },
    [dispatch, conventionId],
  );

  useEffect(() => {
    fetchPage(1);
    dispatch(fetchProgramRegistrationsThunk(conventionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conventionId]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPage(currentPage + 1, searchInput);
        }
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(sentinelRef.current);
    return () => { observerRef.current?.disconnect(); };
  }, [hasMore, loading, loadingMore, currentPage, searchInput, fetchPage]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        fetchPage(1, value);
      }, 400);
    },
    [fetchPage],
  );

  const handleRegister = useCallback(
    (program: ConventionProgram) => {
      navigate(paths.conventionRegistration, { state: { program } });
    },
    [navigate],
  );

  const handleViewProgram = useCallback(
    (program: ConventionProgram) => {
      navigate(paths.conventionProgramDetails, { state: { program } });
    },
    [navigate],
  );

  const retry = useCallback(() => {
    fetchPage(1, searchInput);
  }, [fetchPage, searchInput]);

  if (loading && items.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <AppLoader label="Loading programs" />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="size-6" />
          </span>
          <div className="grid gap-1">
            <AppText variant="h5" color="#991B1B" align="center">Unable to load programs</AppText>
            <AppText variant="bodySmall" color="#B91C1C" align="center">{error}</AppText>
          </div>
          <AppButton leftIcon={<RefreshCw className="size-4" />} loading={loading} onClick={retry}>Retry</AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#79859A]" />
        <input
          className="w-full rounded-xl border border-[#D6DEEB] bg-white py-3 pl-10 pr-4 text-sm font-semibold text-[#0B1F4A] outline-none transition placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
          placeholder="Search programs..."
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {registrations.length > 0 && (
        <AppButton variant="outline" fullWidth onClick={() => navigate(paths.conventionMyRegistrations, { state: { conventionId } })}>
          View My Registrations ({registrations.length})
        </AppButton>
      )}

      {items.length === 0 && !loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <div className="grid w-full max-w-sm justify-items-center gap-3 text-center">
            <AppText variant="h5" align="center">
              {registeredProgramIds.size > 0 ? 'All programs registered' : 'No programs found'}
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" align="center">
              {registeredProgramIds.size > 0 ? "You've registered for all available programs." : 'No programs available at this time.'}
            </AppText>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((program) => (
            <ProgramCard key={program.id} program={program} isRegistered={registeredProgramIds.has(program.id)} onRegister={handleRegister} onViewProgram={handleViewProgram} />
          ))}
        </div>
      )}

      {loadingMore && <div className="grid py-4 place-items-center"><AppLoader label="Loading more" /></div>}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
