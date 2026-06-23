import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  RefreshCw,
  Search,
  ShoppingCart,
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearResourceError,
} from '@/store/slices/resourceSlice';
import { addToCartThunk, fetchCartThunk, fetchResourcesThunk, removeFromCartThunk } from '@/store/thunks/resourceThunk';
import { pushNotification } from '@/store/slices/notificationSlice';
import { fulfilmentTypeToFormat, getResourceFormats, getResourceCoverUrl, type Resource, type ResourceFormat } from '@/types/resource';

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const RESOURCE_GRADIENTS = [
  'from-[#123B8D] to-[#0B1F4A]',
  'from-[#059669] to-[#047857]',
  'from-[#7C3AED] to-[#5B21B6]',
  'from-[#D4A017] to-[#B8860B]',
  'from-[#0891B2] to-[#0E7490]',
  'from-[#DC2626] to-[#991B1B]',
];

const TYPE_LABELS: Record<string, string> = {
  BOOK: 'Book',
  DOCUMENT: 'Document',
};

const formatBadgeColor = (format: ResourceFormat) => {
  switch (format) {
    case 'hardcopy':
      return 'bg-[#EAF1FF] text-[#123B8D]';
    case 'softcopy':
      return 'bg-emerald-50 text-emerald-700';
    default:
      return 'bg-purple-50 text-purple-700';
  }
};

const formatLabel: Record<ResourceFormat, string> = {
  hardcopy: 'Hard Copy',
  softcopy: 'Soft Copy',
  both: 'Hard & Soft Copy',
};

const ResourceCard = ({
  resource,
  index,
  cartFormats,
  cartLoading,
  onAddToCart,
}: {
  resource: Resource;
  index: number;
  cartFormats: Set<ResourceFormat>;
  cartLoading: string | null;
  onAddToCart: (resource: Resource, format: ResourceFormat) => void;
}) => {
  const gradient = RESOURCE_GRADIENTS[index % RESOURCE_GRADIENTS.length];
  const coverUrl = getResourceCoverUrl(resource);
  const formats = getResourceFormats(resource);
  const typeLabel = TYPE_LABELS[resource.type] ?? resource.type;

  return (
    <div
      className="animate-slide-up opacity-0"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#D6DEEB] bg-white shadow-[0_4px_12px_rgba(11,31,74,0.08)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(11,31,74,0.14)] hover:-translate-y-0.5">
        <div className={clsx('relative flex h-40 items-end overflow-hidden bg-gradient-to-br', gradient)}>
          {coverUrl ? (
            <img
              className="absolute inset-0 h-full w-full object-cover object-center"
              src={coverUrl}
              alt={resource.title}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center opacity-15">
              <BookOpen className="size-20 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="relative z-10 flex w-full items-end justify-between p-4">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {typeLabel}
            </span>
            {resource.price === 0 ? (
              <span className="rounded-full bg-emerald-400/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                Free
              </span>
            ) : (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#0B1F4A] backdrop-blur-sm">
                {formatMoney(resource.price, resource.currency)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="grid gap-1.5">
            <AppText variant="h6" className="line-clamp-1 font-bold text-[#0B1F4A]">
              {resource.title}
            </AppText>
            <AppText variant="caption" color="textMuted">
              by {resource.author}
            </AppText>
          </div>

          <AppText variant="bodySmall" color="textSecondary" className="line-clamp-2">
            {resource.description}
          </AppText>

          <div className="flex flex-wrap gap-1.5">
            {formats.map((fmt) => (
              <span
                key={fmt}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  formatBadgeColor(fmt),
                )}
              >
                {formatLabel[fmt]}
              </span>
            ))}
          </div>

          <div className="mt-auto grid gap-2 pt-2">
            {formats.length > 1 ? (
              <div className="grid grid-cols-2 gap-2">
                {formats.map((fmt) => {
                  const formatInCart = cartFormats.has(fmt);
                  const isLoading = cartLoading === `${resource.id}-${fmt}`;
                  return (
                    <AppButton
                      key={fmt}
                      size="sm"
                      variant={formatInCart ? 'secondary' : 'primary'}
                      leftIcon={formatInCart ? <Check className="size-3.5" /> : undefined}
                      disabled={formatInCart || isLoading}
                      loading={isLoading}
                      onClick={() => onAddToCart(resource, fmt)}
                    >
                      {formatInCart ? 'In Cart' : fmt === 'hardcopy' ? 'Hard Copy' : 'Soft Copy'}
                    </AppButton>
                  );
                })}
              </div>
            ) : formats.length === 1 ? (
              <AppButton
                fullWidth
                size="sm"
                variant={cartFormats.has(formats[0]) ? 'secondary' : 'primary'}
                leftIcon={cartFormats.has(formats[0]) ? <Check className="size-3.5" /> : undefined}
                disabled={cartFormats.has(formats[0]) || cartLoading === `${resource.id}-${formats[0]}`}
                loading={cartLoading === `${resource.id}-${formats[0]}`}
                onClick={() => onAddToCart(resource, formats[0])}
              >
                {cartFormats.has(formats[0]) ? 'In Cart' : resource.price === 0 ? 'Get Free' : 'Add to Cart'}
              </AppButton>
            ) : (
              <AppButton fullWidth size="sm" variant="outline" disabled>
                Unavailable
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResourcesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, meta, loading, loadingMore, error, search, cart, cartAdding } = useAppSelector((state) => state.resource);

  const [searchInput, setSearchInput] = useState(search);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentPage = meta?.page ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const hasMore = currentPage < totalPages;

  const cartFormatsByResource = useMemo(() => {
    const map = new Map<string, Set<ResourceFormat>>();
    for (const item of cart) {
      let set = map.get(item.itemId);
      if (!set) {
        set = new Set();
        map.set(item.itemId, set);
      }
      set.add(fulfilmentTypeToFormat[item.fulfilmentType]);
    }
    return map;
  }, [cart]);

  const fetchPage = useCallback(
    (page: number, searchQuery?: string) => {
      dispatch(fetchResourcesThunk({ page, limit: 25, search: searchQuery }));
    },
    [dispatch],
  );

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPage(currentPage + 1, search);
        }
      },
      { threshold: 0.1 },
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loading, loadingMore, currentPage, search, fetchPage]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        dispatch(fetchResourcesThunk({ page: 1, limit: 25, search: value }));
      }, 400);
    },
    [dispatch],
  );

  const retry = useCallback(() => {
    dispatch(clearResourceError());
    fetchPage(1, search);
  }, [dispatch, fetchPage, search]);

  const handleAddToCart = useCallback(
    async (resource: Resource, format: ResourceFormat) => {
      const formatType = format === 'hardcopy' ? 'HARD' : 'SOFT';
      const existing = cart.find(
        (item) => item.itemId === resource.id && item.fulfilmentType === formatType,
      );
      if (existing) {
        const result = await dispatch(removeFromCartThunk(existing.cartId));
        if (removeFromCartThunk.fulfilled.match(result)) {
          dispatch(fetchCartThunk({ page: 1, limit: 25 }));
          dispatch(
            pushNotification({
              type: 'info',
              title: 'Removed from cart',
              message: `"${resource.title}" removed from your cart.`,
            }),
          );
        } else {
          dispatch(
            pushNotification({
              type: 'error',
              title: 'Unable to remove from cart',
              message: result.payload?.message ?? 'Something went wrong. Please try again.',
            }),
          );
        }
      } else {
        const result = await dispatch(addToCartThunk({ resource, format }));
        if (addToCartThunk.fulfilled.match(result)) {
          dispatch(fetchCartThunk({ page: 1, limit: 25 }));
          dispatch(
            pushNotification({
              type: 'success',
              title: 'Added to cart',
              message: `"${resource.title}" added to your cart.`,
            }),
          );
        } else {
          dispatch(
            pushNotification({
              type: 'error',
              title: 'Unable to add to cart',
              message: result.payload?.message ?? 'Something went wrong. Please try again.',
            }),
          );
        }
      }
    },
    [cart, dispatch],
  );

  if (loading && items.length === 0) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppLoader label="Loading resources" />
        </main>
      </AppShell>
    );
  }

  if (error && items.length === 0) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <div className="grid min-h-[55vh] place-items-center">
            <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
                <AlertCircle className="size-6" aria-hidden />
              </span>
              <div className="grid gap-1">
                <AppText variant="h5" color="#991B1B" align="center">
                  Unable to load resources
                </AppText>
                <AppText variant="bodySmall" color="#B91C1C" align="center">
                  {error}
                </AppText>
              </div>
              <AppButton
                leftIcon={<RefreshCw className="size-4" aria-hidden />}
                loading={loading}
                onClick={retry}
              >
                Retry
              </AppButton>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button
        className="fixed right-4 top-20 z-30 grid size-11 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#123B8D] shadow-[0_8px_18px_rgba(11,31,74,0.12)] transition hover:bg-slate-50 sm:right-6 md:right-9"
        type="button"
        onClick={() => navigate(paths.resourceCart)}
      >
        <ShoppingCart className="size-5" />
        {cart.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-[#123B8D] text-[10px] font-bold text-white">
            {cart.length}
          </span>
        )}
      </button>
      <main className="mx-auto grid w-full max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9 md:py-9">
        <header>
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">
              <BookOpen className="size-6" aria-hidden />
            </span>
            <div className="grid min-w-0 gap-1">
              <AppText variant="h4">Resources</AppText>
              <AppText variant="bodySmall" color="textSecondary">
                Browse and purchase books, devotionals, and study materials.
              </AppText>
            </div>
          </div>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#79859A]" />
          <input
            className="w-full rounded-xl border border-[#D6DEEB] bg-white py-3 pl-10 pr-4 text-sm font-semibold text-[#0B1F4A] outline-none transition placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
            placeholder="Search resources by title, author..."
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {items.length === 0 && !loading ? (
          <div className="grid min-h-[40vh] place-items-center">
            <div className="grid w-full max-w-sm justify-items-center gap-3 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
                <Search className="size-6" />
              </span>
              <AppText variant="h5" align="center">No resources found</AppText>
              <AppText variant="bodySmall" color="textSecondary" align="center">
                {search ? 'Try a different search term.' : 'No resources available yet.'}
              </AppText>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((resource, index) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  index={index}
                  cartFormats={cartFormatsByResource.get(resource.id) ?? new Set()}
                  cartLoading={cartAdding}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {loadingMore && (
              <div className="grid py-6 place-items-center">
                <AppLoader label="Loading more" />
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />

            {!hasMore && items.length > 0 && (
              <div className="grid py-4 place-items-center">
                <AppText variant="bodySmall" color="textMuted">
                  You've reached the end
                </AppText>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
