import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, FileText, RefreshCw, Search } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchConventionDocumentsThunk } from '@/store/thunks/conventionThunk';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (contentType: string) => {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'text/plain': 'TXT',
  };
  return map[contentType] ?? contentType.split('/').pop()?.toUpperCase() ?? 'FILE';
};

const DocumentCard = ({ document }: { document: { id: string; title: string; name: string; description: string; file: { url: string; size: number; contentType: string } | null; publishedAt: string | null } }) => (
  <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(11,31,74,0.08)]">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
        <FileText className="size-5" />
      </span>
      <div className="min-w-0 flex-1 grid gap-1">
        <AppText variant="h6" className="font-bold text-[#0B1F4A] line-clamp-1">{document.title}</AppText>
        <div className="flex items-center gap-2">
          {document.file?.contentType && (
            <span className="inline-flex items-center rounded-full bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-semibold text-[#123B8D]">
              {getFileExtension(document.file.contentType)}
            </span>
          )}
          {document.file?.size != null && (
            <AppText variant="caption" color="textMuted">{formatFileSize(document.file.size)}</AppText>
          )}
        </div>
      </div>
    </div>
    {document.description && (
      <AppText variant="bodySmall" color="textSecondary" className="mt-2 line-clamp-2">
        {document.description}
      </AppText>
    )}
    {document.file?.url && (
      <div className="mt-3">
        <AppButton
          size="sm"
          rightIcon={<ExternalLink className="size-3.5" />}
          onClick={() => window.open(document.file!.url, '_blank', 'noopener,noreferrer')}
        >
          Open Document
        </AppButton>
      </div>
    )}
  </article>
);

export function DocumentsTab({ conventionId }: { conventionId: string }) {
  const dispatch = useAppDispatch();
  const { items, meta, loading, loadingMore, error } = useAppSelector((state) => state.convention.documents);

  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentPage = meta?.page ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const hasMore = currentPage < totalPages;

  const fetchPage = useCallback(
    (page: number, search?: string) => {
      dispatch(fetchConventionDocumentsThunk({ conventionId, page, limit: 25, search }));
    },
    [dispatch, conventionId],
  );

  useEffect(() => {
    fetchPage(1);
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
      searchTimerRef.current = setTimeout(() => fetchPage(1, value), 400);
    },
    [fetchPage],
  );

  const retry = useCallback(() => {
    fetchPage(1, searchInput);
  }, [fetchPage, searchInput]);

  if (loading && items.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <AppLoader label="Loading documents" />
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
            <AppText variant="h5" color="#991B1B" align="center">Unable to load documents</AppText>
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
          placeholder="Search documents..."
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {items.length === 0 && !loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <AppText variant="h5" align="center">No documents available</AppText>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}

      {loadingMore && <div className="grid py-4 place-items-center"><AppLoader label="Loading more" /></div>}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
