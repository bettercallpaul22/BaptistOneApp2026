import { useEffect } from 'react';
import { AlertCircle, ArrowLeft, BookMarked, CalendarDays, RefreshCw, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchChurchContentThunk } from '@/store/thunks/churchContentThunk';

const formatDate = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

export default function DevotionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.churchContent);

  useEffect(() => {
    if (items.length === 0) {
      dispatch(fetchChurchContentThunk({ type: 'DEVOTIONAL', page: 1, limit: 20 }));
    }
  }, [dispatch, items.length]);

  const item = items.find((i) => i.id === id) ?? null;
  const imageUrl = item?.mediaFiles?.find((m) => m.url)?.url ?? null;
  const date = formatDate(item?.postedAt ?? item?.createdAt ?? null);

  const renderContent = () => {
    if (loading && !item) {
      return (
        <div className="grid min-h-[55vh] place-items-center pb-24">
          <AppLoader label="Loading devotional" />
        </div>
      );
    }

    if (error && !item) {
      return (
        <div className="grid min-h-[55vh] place-items-center px-2 pb-24">
          <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
              <AlertCircle className="size-6" aria-hidden />
            </span>
            <div className="grid gap-1">
              <AppText variant="h6" align="center">
                Unable to load devotional
              </AppText>
              <AppText variant="bodySmall" color="textSecondary" align="center">
                {error}
              </AppText>
            </div>
            <AppButton
              leftIcon={<RefreshCw className="size-4" aria-hidden />}
              loading={loading}
              onClick={() =>
                dispatch(fetchChurchContentThunk({ type: 'DEVOTIONAL', page: 1, limit: 20 }))
              }
            >
              Retry
            </AppButton>
          </div>
        </div>
      );
    }

    if (!item) {
      return (
        <div className="grid min-h-[55vh] place-items-center px-2 pb-24">
          <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
              <BookMarked className="size-6" aria-hidden />
            </span>
            <div className="grid gap-1">
              <AppText variant="h6" align="center">
                Devotional not found
              </AppText>
              <AppText variant="bodySmall" color="textSecondary" align="center">
                This devotional may have been removed or the link is invalid.
              </AppText>
            </div>
            <AppButton onClick={() => navigate(-1)}>Go back</AppButton>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto grid max-w-2xl gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-[#06202B]">
          {imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex min-h-[18rem] flex-col justify-end gap-3 p-6 sm:min-h-[24rem] sm:p-8">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-white/20 px-3 py-1.5 text-xs font-extrabold backdrop-blur-sm">
                Devotional
              </span>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                aria-label="Share"
              >
                <Share2 className="size-4" aria-hidden />
              </button>
            </div>
            {item.title && (
              <AppText variant="h3" color="textInverse" weight="bold">
                {item.title}
              </AppText>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {item.scriptureReference && (
              <span className="flex items-center gap-1.5 rounded-lg bg-[#EAF1FF] px-3 py-2 text-sm font-semibold text-[#123B8D]">
                <BookMarked className="size-4" aria-hidden />
                {item.scriptureReference}
              </span>
            )}
            {date && (
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <CalendarDays className="size-4" aria-hidden />
                {date}
              </span>
            )}
          </div>

          {item.scriptureText && (
            <div className="rounded-xl bg-[#F8FAFC] p-5">
              <AppText variant="bodySmall" color="textSecondary" weight="semibold">
                Scripture
              </AppText>
              <AppText variant="bodyLarge" className="mt-2 italic leading-relaxed">
                &quot;{item.scriptureText}&quot;
              </AppText>
            </div>
          )}

          {item.message && (
            <div className="prose prose-slate max-w-none">
              <AppText variant="bodyLarge" className="whitespace-pre-line leading-[1.8]">
                {item.message}
              </AppText>
            </div>
          )}

          {item.message && (
            <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-5">
              <AppText variant="bodySmall" color="textSecondary" weight="semibold">
                Reflection
              </AppText>
              <AppText variant="bodyMedium" className="mt-2 leading-relaxed">
                Take a moment to meditate on today&apos;s scripture and let it guide your day.
              </AppText>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="mx-auto grid gap-5 px-4 pb-28 pt-3 sm:px-6 md:px-9">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D] transition-colors hover:bg-[#D9E4F6]"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h4">Devotional</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Read today&apos;s devotional
            </AppText>
          </div>
        </header>

        {renderContent()}
      </div>
    </AppShell>
  );
}
