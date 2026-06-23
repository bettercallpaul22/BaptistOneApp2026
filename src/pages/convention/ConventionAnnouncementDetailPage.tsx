import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppText } from '@/components/common';
import { AppShell } from '@/layouts/AppShell';
import type { ConventionAnnouncement } from '@/types/convention';

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

export default function ConventionAnnouncementDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const announcement = (location.state as { announcement?: ConventionAnnouncement } | null)?.announcement;

  if (!announcement) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppText variant="h5" align="center">Announcement not found</AppText>
        </main>
      </AppShell>
    );
  }

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
            <AppText variant="h4">{announcement.title}</AppText>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-semibold text-[#123B8D]">
                {announcement.type}
              </span>
              {announcement.isActive && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Active
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <AppText variant="bodyMedium" className="whitespace-pre-wrap">{announcement.body}</AppText>
        </div>

        <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
          <AppText variant="h6" className="font-bold text-[#0B1F4A]">Details</AppText>
          {announcement.startsAt && (
            <div className="flex items-center justify-between">
              <AppText variant="bodySmall" color="textSecondary">Starts</AppText>
              <AppText variant="bodySmall" weight="bold">{formatDate(announcement.startsAt)}</AppText>
            </div>
          )}
          {announcement.endsAt && (
            <div className="flex items-center justify-between">
              <AppText variant="bodySmall" color="textSecondary">Ends</AppText>
              <AppText variant="bodySmall" weight="bold">{formatDate(announcement.endsAt)}</AppText>
            </div>
          )}
          {announcement.amount != null && (
            <div className="flex items-center justify-between">
              <AppText variant="bodySmall" color="textSecondary">Amount</AppText>
              <AppText variant="bodySmall" weight="bold">{formatDate(String(announcement.amount))}</AppText>
            </div>
          )}
        </div>

        {announcement.audienceTargets?.length > 0 && (
          <div className="grid gap-2">
            <AppText variant="caption" color="textMuted" weight="bold">Audience</AppText>
            <div className="flex flex-wrap gap-2">
              {announcement.audienceTargets.map((target) => (
                <span key={target} className="inline-flex items-center rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#5A6880] border border-[#E5E7EB]">
                  {target}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
