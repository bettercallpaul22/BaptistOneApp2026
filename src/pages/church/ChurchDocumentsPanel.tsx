import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppStateFeedback } from '@/components/feedback';
import { churchService } from '@/services/church/churchService';
import type { ChurchDocumentItem, ChurchDocumentMeta } from '@/types/church';
import type { ChurchBootstrapState } from './ChurchLeadershipPanel';
import {
  formatFileSize,
  getDocumentName,
  getFileExtension,
  sortByOrderAndDate,
} from './churchResourceUtils';

const ChurchDocumentCard = ({ document }: { document: ChurchDocumentItem }) => {
  const fileSize = formatFileSize(document.file?.size);

  return (
    <article className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FFF8E4] text-[#D4A017]">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="grid min-w-0 gap-1">
          <AppText variant="bodyMedium" weight="bold">
            {getDocumentName(document)}
          </AppText>
          <AppText variant="caption" color="textMuted" weight="bold">
            {[getFileExtension(document), fileSize].filter(Boolean).join(' - ')}
          </AppText>
        </div>
      </div>
      {document.file?.url && (
        <AppButton onClick={() => window.open(document.file?.url ?? '', '_blank', 'noopener,noreferrer')}>
          Open document
        </AppButton>
      )}
    </article>
  );
};

export const ChurchDocumentsPanel = ({ bootstrap }: { bootstrap: ChurchBootstrapState }) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [extraDocuments, setExtraDocuments] = useState<{ churchId: string; items: ChurchDocumentItem[]; meta: ChurchDocumentMeta } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<{ churchId: string; message: string } | null>(null);
  const { church, documents, documentsLoading, documentsMeta, error, loading, retry } = bootstrap;
  const isLoading = documentsLoading || (loading && !documentsMeta);
  const currentExtraDocuments = extraDocuments?.churchId === church?.id ? extraDocuments : null;
  const documentItems = [
    ...documents,
    ...(currentExtraDocuments?.items ?? []).filter((nextDocument) => !documents.some((document) => document.id === nextDocument.id)),
  ];
  const documentItemsMeta = currentExtraDocuments?.meta ?? documentsMeta;
  const sortedDocuments = sortByOrderAndDate(documentItems);
  const hasMore = Boolean(documentItemsMeta && documentItemsMeta.page < documentItemsMeta.totalPages);
  const nextPage = (documentItemsMeta?.page ?? 1) + 1;
  const currentLoadMoreError = loadMoreError && loadMoreError.churchId === church?.id ? loadMoreError.message : null;

  const loadMoreDocuments = useCallback(async () => {
    if (!church?.id || !hasMore || loadingMore) return;

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await churchService.getDocuments(church.id, { page: nextPage, limit: documentItemsMeta?.limit ?? 25 });

      setExtraDocuments((current) => ({
        churchId: church.id,
        items:
          current?.churchId === church.id
            ? [
                ...current.items,
                ...response.items.filter((nextDocument) => !current.items.some((document) => document.id === nextDocument.id)),
              ]
            : response.items,
        meta: response.meta,
      }));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load more documents.';

      setLoadMoreError({ churchId: church.id, message });
    } finally {
      setLoadingMore(false);
    }
  }, [church, documentItemsMeta, hasMore, loadingMore, nextPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMore || loadingMore || currentLoadMoreError || isLoading || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        void loadMoreDocuments();
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [currentLoadMoreError, error, hasMore, isLoading, loadMoreDocuments, loadingMore]);

  return (
    <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.06)]">
      {isLoading && <AppStateFeedback state="loading" label="Loading church documents" className="min-h-44" />}
      {error && !isLoading && (
        <AppStateFeedback
          state="error"
          title="Unable to load documents"
          description={error}
          retrying={loading}
          className="min-h-44"
          onRetry={retry}
        />
      )}
      {!isLoading && !error && !sortedDocuments.length && (
        <AppStateFeedback
          state="empty"
          title="No documents yet"
          description="Church documents will appear here."
          className="min-h-44"
        />
      )}
      {!isLoading && !error && sortedDocuments.map((document) => <ChurchDocumentCard document={document} key={document.id} />)}
      {hasMore && !currentLoadMoreError && (
        <div ref={loadMoreRef} className="grid min-h-16 place-items-center">
          {loadingMore ? (
            <AppStateFeedback state="loading" label="Loading more documents" className="min-h-16" />
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
          <AppButton loading={loadingMore} size="sm" variant="outline" onClick={() => void loadMoreDocuments()}>
            Retry
          </AppButton>
        </div>
      )}
    </section>
  );
};
