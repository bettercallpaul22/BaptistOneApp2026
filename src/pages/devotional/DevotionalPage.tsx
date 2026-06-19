import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, BookMarked, CalendarDays, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchChurchContentThunk } from '@/store/thunks/churchContentThunk';
import type { ChurchContentItem } from '@/types/churchContent';

const PAGE_SIZE = 20;

const formatDate = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getExcerpt = (item: ChurchContentItem, maxLines = 3) => {
  const text = item.message || item.scriptureText || '';
  const words = text.split(/\s+/);
  const maxWords = maxLines * 12;
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
};

const DevotionalCard = ({
  item,
  variant = 'default',
  onSelect,
}: {
  item: ChurchContentItem;
  variant?: 'featured' | 'default';
  onSelect?: (item: ChurchContentItem) => void;
}) => {
  const imageUrl = item.mediaFiles?.find((m) => m.url)?.url ?? null;
  const excerpt = getExcerpt(item, variant === 'featured' ? 5 : 3);
  const date = formatDate(item.postedAt || item.createdAt);

  if (variant === 'featured') {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        className="group relative flex min-h-[18rem] w-full flex-col justify-between overflow-hidden rounded-2xl bg-[#06202B] text-left text-white shadow-[0_14px_28px_rgba(11,31,74,0.15)] transition-transform duration-200 active:scale-[0.98] sm:min-h-[24rem]"
      >
        {imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex min-h-[18rem] flex-col justify-between gap-4 p-5 sm:min-h-[24rem] sm:p-7">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-white/20 px-3 py-1.5 text-xs font-extrabold backdrop-blur-sm">
              Today&apos;s Devotional
            </span>
            <BookMarked className="size-5" aria-hidden />
          </div>
          {item.title && (
            <AppText variant="h5" color="textInverse" weight="bold">
              {item.title}
            </AppText>
          )}
          <AppText variant="bodyLarge" color="textInverse" lineClamp={3}>
            &quot;{excerpt}&quot;
          </AppText>
          <div className="flex items-center gap-3">
            {item.scriptureReference && (
              <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                {item.scriptureReference}
              </span>
            )}
            {date && (
              <span className="flex items-center gap-1 text-xs text-white/70">
                <CalendarDays className="size-3.5" aria-hidden />
                {date}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className="group flex min-h-[18rem] w-full flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white text-left shadow-[0_8px_24px_rgba(11,31,74,0.08)] transition-all duration-200 hover:shadow-[0_12px_32px_rgba(11,31,74,0.12)] active:scale-[0.98]"
    >
      <div className={`relative h-36 shrink-0 overflow-hidden sm:h-40 ${imageUrl ? '' : 'bg-[#06202B]'}`}>
        {imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        <div className="grid gap-2">
          {item.title && (
            <AppText variant="h6" weight="semibold" lineClamp={1}>
              {item.title}
            </AppText>
          )}
          <AppText variant="bodySmall" color="textSecondary" lineClamp={2}>
            {excerpt}
          </AppText>
        </div>
        <div className="flex items-center gap-3 pt-1">
          {item.scriptureReference && (
            <span className="rounded-md bg-[#EAF1FF] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#123B8D]">
              {item.scriptureReference}
            </span>
          )}
          {date && (
            <span className="flex items-center gap-1 text-[0.6875rem] text-slate-400">
              <CalendarDays className="size-3" aria-hidden />
              {date}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default function DevotionalPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, meta, loading, loadingMore, error, loadMoreError } = useAppSelector(
    (state) => state.churchContent,
  );
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    dispatch(fetchChurchContentThunk({ type: 'DEVOTIONAL', page: 1, limit: PAGE_SIZE }));
  }, [dispatch]);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    setScrollProgress(Math.min(scrollTop / 120, 1));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !meta || meta.page >= meta.totalPages) return;
    dispatch(
      fetchChurchContentThunk({
        type: 'DEVOTIONAL',
        page: meta.page + 1,
        limit: PAGE_SIZE,
      }),
    );
  }, [dispatch, loadingMore, meta]);

  const handleSelect = useCallback(
    (item: ChurchContentItem) => navigate(paths.devotionalDetail(item.id)),
    [navigate],
  );

  const hasMore = meta ? meta.page < meta.totalPages : false;

  const featured = useMemo(() => items[0] ?? null, [items]);
  const rest = useMemo(() => items.slice(1), [items]);

  const renderContent = () => {
    if (loading && items.length === 0) {
      return (
        <div className="grid min-h-[55vh] place-items-center pb-24">
          <AppLoader label="Loading devotionals" />
        </div>
      );
    }

    if (error && items.length === 0) {
      return (
        <div className="grid min-h-[55vh] place-items-center px-2 pb-24">
          <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
              <AlertCircle className="size-6" aria-hidden />
            </span>
            <div className="grid gap-1">
              <AppText variant="h6" align="center">
                Unable to load devotionals
              </AppText>
              <AppText variant="bodySmall" color="textSecondary" align="center">
                {error}
              </AppText>
            </div>
            <AppButton
              leftIcon={<RefreshCw className="size-4" aria-hidden />}
              loading={loading}
              onClick={() =>
                dispatch(fetchChurchContentThunk({ type: 'DEVOTIONAL', page: 1, limit: PAGE_SIZE }))
              }
            >
              Retry
            </AppButton>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-5">
        {featured && (
          <DevotionalCard
            item={featured}
            variant="featured"
            onSelect={handleSelect}
          />
        )}

        {rest.length > 0 && (
          <div className="grid gap-4">
            <AppText variant="h5">Previous Devotionals</AppText>
            <div className="grid gap-4 lg:grid-cols-2">
              {rest.map((item) => (
                <DevotionalCard key={item.id} item={item} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        )}

        {hasMore && (
          <div className="grid place-items-center pt-4 pb-12">
            <AppButton
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" aria-hidden />}
              loading={loadingMore}
              onClick={handleLoadMore}
            >
              {loadMoreError || 'Load more'}
            </AppButton>
          </div>
        )}

        {loadMoreError && !loadingMore && (
          <div className="grid place-items-center pb-8">
            <AppText variant="bodySmall" color="textSecondary">
              {loadMoreError}
            </AppText>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="grid place-items-center pb-12 pt-4">
            <AppText variant="bodySmall" color="textMuted">
              You&apos;ve reached the end
            </AppText>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="mx-auto grid max-w-[78rem] gap-5 px-4 pb-28 pt-3 sm:px-6 md:px-9">
        <header
          className="flex items-center gap-3"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: `rgba(255, 255, 255, ${scrollProgress * 0.95})`,
            backdropFilter: scrollProgress > 0.1 ? 'blur(12px)' : 'none',
            margin: '0 -1rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
          }}
        >
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
              Daily devotionals and spiritual growth
            </AppText>
          </div>
        </header>

        {renderContent()}
      </div>
    </AppShell>
  );
}
