import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppText } from '@/components/common';
import { AppShell } from '@/layouts/AppShell';
import { useAppSelector } from '@/store/hooks';
import type { ConventionProgram, ConventionProgramRegistration } from '@/types/convention';

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

const statusBadge = (status: string) => {
  if (status === 'PAID') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="size-3.5" /> Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock className="size-3.5" /> Pending
    </span>
  );
};

export default function ConventionProgramDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const program = (location.state as { program?: ConventionProgram } | null)?.program;
  const registrations = useAppSelector((state) => state.convention?.registrations?.items ?? []);

  const registration = program
    ? registrations.find((r) => r.programId === program.id)
    : undefined;

  if (!program) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppText variant="h5" align="center">Program not found</AppText>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[38rem] gap-5 px-4 py-6 sm:px-6 md:py-9">
        <header className="flex items-start gap-3">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#123B8D] transition hover:bg-slate-50"
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h4">{program.title}</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {program.basePrice > 0 ? formatMoney(program.basePrice, program.currency) : 'Free'}
            </AppText>
          </div>
        </header>

        {program.coverFile?.url && (
          <div className="overflow-hidden rounded-xl">
            <img className="h-48 w-full object-cover" src={program.coverFile.url} alt={program.title} />
          </div>
        )}

        {program.description && (
          <AppText variant="bodyMedium" color="textSecondary">{program.description}</AppText>
        )}

        <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
          <AppText variant="h6" className="font-bold text-[#0B1F4A]">Program Details</AppText>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-[#5A6880]">
              <CalendarDays className="size-4 shrink-0 text-[#123B8D]" />
              <span className="font-semibold text-[#0B1F4A]">{formatDate(program.startsAt)}</span>
              <span>—</span>
              <span className="font-semibold text-[#0B1F4A]">{formatDate(program.endsAt)}</span>
            </div>
            {program.venue && (
              <div className="flex items-center gap-2 text-[#5A6880]">
                <MapPin className="size-4 shrink-0 text-[#123B8D]" />
                <span className="font-semibold text-[#0B1F4A]">{program.venue}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[#5A6880]">
              <span className="text-[#123B8D] font-semibold">Attendance:</span>
              <span className="font-semibold text-[#0B1F4A]">{attendanceLabel[program.attendanceMode] ?? program.attendanceMode}</span>
            </div>
          </div>
        </div>

        {registration && (
          <div className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between">
              <AppText variant="h6" className="font-bold text-[#0B1F4A]">Your Registration</AppText>
              {statusBadge(registration.status)}
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#5A6880]">Attendance:</span>
                <span className="font-semibold text-[#0B1F4A]">{attendanceLabel[registration.attendanceMode] ?? registration.attendanceMode}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#5A6880]">Amount:</span>
                <span className="font-semibold text-[#0B1F4A]">{formatMoney(registration.totalAmount, registration.currency)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#5A6880]">Payment:</span>
                <span className="font-semibold text-[#0B1F4A] capitalize">{registration.paymentMethod}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#5A6880]">Reference:</span>
                <span className="font-semibold text-[#0B1F4A]">{registration.reference}</span>
              </div>
              {registration.paidAt && (
                <div className="flex items-center gap-2">
                  <span className="text-[#5A6880]">Paid:</span>
                  <span className="font-semibold text-[#0B1F4A]">{formatDate(registration.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
