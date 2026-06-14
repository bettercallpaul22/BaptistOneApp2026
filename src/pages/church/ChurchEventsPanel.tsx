import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppStateFeedback } from '@/components/feedback';
import { churchService } from '@/services/church/churchService';
import type { ChurchEventItem, ChurchEventMeta } from '@/types/church';
import type { ChurchBootstrapState } from './ChurchLeadershipPanel';
import {
  formatEventDate,
  formatEventType,
  getEventLocation,
  getEventTitle,
  sortByOrderAndDate,
} from './churchResourceUtils';

const ChurchEventCard = ({ event }: { event: ChurchEventItem }) => {
  const location = getEventLocation(event);

  return (
    <article className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
          <CalendarDays className="size-5" aria-hidden />
        </span>
        <div className="grid min-w-0 gap-1">
          <AppText variant="bodyMedium" weight="bold">
            {getEventTitle(event)}
          </AppText>
          <AppText variant="caption" color="#D4A017" weight="bold">
            {formatEventType(event.type)}
          </AppText>
        </div>
      </div>
      <AppText variant="bodySmall" color="textSecondary">
        {formatEventDate(event)}
      </AppText>
      {event.description && (
        <AppText variant="bodySmall" color="textSecondary">
          {event.description}
        </AppText>
      )}
      {location && (
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-[#5A6880]">
          <MapPin className="size-4 shrink-0 text-[#123B8D]" aria-hidden />
          <span className="min-w-0 truncate">{location}</span>
        </span>
      )}
    </article>
  );
};

export const ChurchEventsPanel = ({ bootstrap }: { bootstrap: ChurchBootstrapState }) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [extraEvents, setExtraEvents] = useState<{ churchId: string; items: ChurchEventItem[]; meta: ChurchEventMeta } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<{ churchId: string; message: string } | null>(null);
  const { church, error, events, eventsLoading, eventsMeta, loading, retry } = bootstrap;
  const isLoading = eventsLoading || (loading && !eventsMeta);
  const currentExtraEvents = extraEvents?.churchId === church?.id ? extraEvents : null;
  const eventItems = [
    ...events,
    ...(currentExtraEvents?.items ?? []).filter((nextEvent) => !events.some((event) => event.id === nextEvent.id)),
  ];
  const eventItemsMeta = currentExtraEvents?.meta ?? eventsMeta;
  const sortedEvents = sortByOrderAndDate(eventItems);
  const hasMore = Boolean(eventItemsMeta && eventItemsMeta.page < eventItemsMeta.totalPages);
  const nextPage = (eventItemsMeta?.page ?? 1) + 1;
  const currentLoadMoreError = loadMoreError && loadMoreError.churchId === church?.id ? loadMoreError.message : null;

  const loadMoreEvents = useCallback(async () => {
    if (!church?.id || !hasMore || loadingMore) return;

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await churchService.getEvents(church.id, { page: nextPage, limit: eventItemsMeta?.limit ?? 25 });

      setExtraEvents((current) => ({
        churchId: church.id,
        items:
          current?.churchId === church.id
            ? [
                ...current.items,
                ...response.items.filter((nextEvent) => !current.items.some((event) => event.id === nextEvent.id)),
              ]
            : response.items,
        meta: response.meta,
      }));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load more events.';

      setLoadMoreError({ churchId: church.id, message });
    } finally {
      setLoadingMore(false);
    }
  }, [church, eventItemsMeta, hasMore, loadingMore, nextPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMore || loadingMore || currentLoadMoreError || isLoading || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        void loadMoreEvents();
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [currentLoadMoreError, error, hasMore, isLoading, loadMoreEvents, loadingMore]);

  return (
    <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.06)]">
      {isLoading && <AppStateFeedback state="loading" label="Loading church events" className="min-h-44" />}
      {error && !isLoading && (
        <AppStateFeedback
          state="error"
          title="Unable to load events"
          description={error}
          retrying={loading}
          className="min-h-44"
          onRetry={retry}
        />
      )}
      {!isLoading && !error && !sortedEvents.length && (
        <AppStateFeedback
          state="empty"
          title="No events yet"
          description="Church events will appear here."
          className="min-h-44"
        />
      )}
      {!isLoading && !error && sortedEvents.map((event) => <ChurchEventCard event={event} key={event.id} />)}
      {hasMore && !currentLoadMoreError && (
        <div ref={loadMoreRef} className="grid min-h-16 place-items-center">
          {loadingMore ? (
            <AppStateFeedback state="loading" label="Loading more events" className="min-h-16" />
          ) : (
            <span className="text-xs font-semibold text-[#8A96AA]">Scroll for more</span>
          )}
        </div>
      )}
      {currentLoadMoreError && (
        <div className="grid gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
          <AppText variant="bodySmall" color="#B91C1C">
            {currentLoadMoreError}
          </AppText>
          <AppButton loading={loadingMore} size="sm" variant="outline" onClick={() => void loadMoreEvents()}>
            Retry
          </AppButton>
        </div>
      )}
    </section>
  );
};
