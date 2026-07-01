import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Tag } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppModal, AppStateFeedback } from '@/components/feedback';
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

const EventDetailRow = ({ children, icon, label }: { children: ReactNode; icon: ReactNode; label: string }) => (
  <div className="flex min-w-0 items-start gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">{icon}</span>
    <div className="grid min-w-0 gap-1">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#8A96AA]">{label}</span>
      <div className="min-w-0 text-sm font-semibold leading-6 text-[#0B1F4A]">{children}</div>
    </div>
  </div>
);

const EventDetailsModal = ({ event, onClose }: { event: ChurchEventItem | null; onClose: () => void }) => {
  const location = event ? getEventLocation(event) : '';

  return (
    <AppModal open={Boolean(event)} title="Event details" panelClassName="max-w-[32rem]" onClose={onClose}>
      {event && (
        <div className="grid gap-4">
          <div className="grid gap-1">
            <AppText variant="h5">{getEventTitle(event)}</AppText>
            <AppText variant="caption" color="#D4A017" weight="bold">
              {formatEventType(event.type)}
            </AppText>
          </div>

          <div className="grid gap-3">
            <EventDetailRow label="Date" icon={<Clock3 className="size-5" aria-hidden />}>
              {formatEventDate(event)}
            </EventDetailRow>
            <EventDetailRow label="Location" icon={<MapPin className="size-5" aria-hidden />}>
              {location || 'Location not provided'}
            </EventDetailRow>
            <EventDetailRow label="Type" icon={<Tag className="size-5" aria-hidden />}>
              {formatEventType(event.type)}
            </EventDetailRow>
          </div>

          <div className="grid gap-2">
            <AppText variant="bodyMedium" weight="bold">
              Description
            </AppText>
            <p className="m-0 whitespace-pre-line text-sm leading-6 text-[#5A6880]">
              {event.description?.trim() || 'No description provided.'}
            </p>
          </div>
        </div>
      )}
    </AppModal>
  );
};

const ChurchEventCard = ({ event, onView }: { event: ChurchEventItem; onView: (event: ChurchEventItem) => void }) => {
  const location = getEventLocation(event);

  return (
    <button
      type="button"
      className="w-full cursor-pointer rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
      onClick={() => onView(event)}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">
          <CalendarDays className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <AppText variant="bodyMedium" weight="bold" className="line-clamp-1">
            {getEventTitle(event)}
          </AppText>
          <AppText variant="caption" color="#D4A017" weight="bold">
            {formatEventType(event.type)}
          </AppText>
          <AppText variant="caption" color="textMuted" className="mt-1">
            {formatEventDate(event)}
          </AppText>
          {location && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#5A6880]">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export const ChurchEventsPanel = ({ bootstrap }: { bootstrap: ChurchBootstrapState }) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEventItem | null>(null);
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
    <section className="grid gap-3">
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
      {!isLoading &&
        !error &&
        sortedEvents.map((event) => <ChurchEventCard event={event} key={event.id} onView={setSelectedEvent} />)}
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
      <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </section>
  );
};
