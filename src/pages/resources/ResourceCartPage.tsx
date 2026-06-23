import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  RefreshCw,
  ShoppingCart,
  Wallet,
  X,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader, AppModal } from '@/components/feedback';
import { AppInput } from '@/components/form';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCartError, clearCheckoutResult } from '@/store/slices/resourceSlice';
import {
  checkoutThunk,
  fetchCartThunk,
  removeFromCartThunk,
} from '@/store/thunks/resourceThunk';
import { fetchWalletsThunk } from '@/store/thunks/walletThunk';
import { pushNotification } from '@/store/slices/notificationSlice';
import { paths } from '@/routes/paths';
import { callbackUrls } from '@/constants/callbackUrls';
import { fulfilmentTypeToFormat, type CartItem, type ResourceFormat } from '@/types/resource';

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

const formatLabel: Record<ResourceFormat, string> = {
  hardcopy: 'Hard Copy',
  softcopy: 'Soft Copy',
  both: 'Hard & Soft Copy',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid gap-1 border-b border-[#E5E7EB] py-3 last:border-b-0">
    <AppText variant="caption" color="textMuted" weight="bold">
      {label}
    </AppText>
    <AppText variant="bodyMedium" className="break-words">
      {value || 'Not provided'}
    </AppText>
  </div>
);

const CartItemRow = ({
  item,
  removing,
  onRemove,
}: {
  item: CartItem;
  removing: boolean;
  onRemove: (cartId: string) => void;
}) => {
  const format = fulfilmentTypeToFormat[item.fulfilmentType];

  return (
    <article className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(11,31,74,0.06)]">
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">
        <BookOpen className="size-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 grid gap-1.5">
        <AppText variant="h6" className="line-clamp-1 font-bold text-[#0B1F4A]">{item.title}</AppText>
        <AppText variant="caption" color="textMuted">by {item.author}</AppText>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-semibold text-[#123B8D]">
            {formatLabel[format] ?? item.fulfilmentType}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5A6880]">
            Qty: {item.quantity}
          </span>
          <div className="flex items-center gap-3">
            <AppText variant="bodyMedium" weight="bold" color="#123B8D">
              {formatMoney(item.price * item.quantity, item.currency)}
            </AppText>
            <button
              className="grid size-8 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              type="button"
              disabled={removing}
              onClick={() => onRemove(item.cartId)}
            >
              {removing ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              ) : (
                <X className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

type PaymentMethod = 'wallet' | 'paystack';

export default function ResourceCartPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart, cartMeta, cartLoading, cartLoadingMore, cartError, cartRemoving, checkoutLoading, checkoutError, checkoutResult } =
    useAppSelector((state) => state.resource);
  const { items: wallets, loading: walletsLoading, lastFetchedAt: walletsLastFetchedAt } = useAppSelector(
    (state) => state.wallet,
  );

  const walletBalance = wallets[0]?.balance ?? 0;
  const walletCurrency = wallets[0]?.currency ?? 'NGN';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);
  const pendingCheckoutRef = useRef<((method: PaymentMethod, authKey?: string) => void) | null>(null);
  const doCheckoutRef = useRef<(method: PaymentMethod, authKey?: string) => void>(() => {});

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentPage = cartMeta?.page ?? 0;
  const totalPages = cartMeta?.totalPages ?? 0;
  const hasMore = currentPage < totalPages;

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );
  const freeItemCount = useMemo(() => cart.filter((item) => item.price === 0).length, [cart]);
  const paidItemCount = useMemo(() => cart.filter((item) => item.price > 0).length, [cart]);
  const hasFreeItems = freeItemCount > 0;
  const hasPaidItems = paidItemCount > 0;
  const walletInsufficientBalance = hasPaidItems && cartTotal > walletBalance / 100;

  useEffect(() => {
    if (checkoutResult) {
      dispatch(clearCheckoutResult());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCartPage = useCallback(
    (page: number) => {
      dispatch(fetchCartThunk({ page, limit: 25 }));
    },
    [dispatch],
  );

  useEffect(() => {
    if (!walletsLastFetchedAt && !walletsLoading) {
      dispatch(fetchWalletsThunk());
    }
  }, [dispatch, walletsLastFetchedAt, walletsLoading]);

  useEffect(() => {
    if (walletsLastFetchedAt) {
      fetchCartPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletsLastFetchedAt]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !cartLoading && !cartLoadingMore) {
          fetchCartPage(currentPage + 1);
        }
      },
      { threshold: 0.1 },
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, cartLoading, cartLoadingMore, currentPage, fetchCartPage]);

  const handleRemoveFromCart = useCallback(
    async (cartId: string) => {
      const result = await dispatch(removeFromCartThunk(cartId));
      if (removeFromCartThunk.fulfilled.match(result)) {
        dispatch(
          pushNotification({
            type: 'info',
            title: 'Removed from cart',
            message: 'Item removed from your cart.',
          }),
        );
      } else {
        dispatch(
          pushNotification({
            type: 'error',
            title: 'Unable to remove',
            message: result.payload?.message ?? 'Something went wrong. Please try again.',
          }),
        );
      }
    },
    [dispatch],
  );

  const doCheckoutInner = useCallback(
    async (method: PaymentMethod, authKey?: string): Promise<'success' | 'error'> => {
      const cartItems = cart.map((item) => ({
        resourceItemId: item.itemId,
        fulfilmentType: item.fulfilmentType,
        quantity: item.quantity,
      }));

      const result = await dispatch(
        checkoutThunk({
          paymentMethod: method,
          ...(authKey ? { authKey } : {}),
          ...(method === 'paystack' ? { callbackUrl: callbackUrls.resources() } : {}),
          cartItems,
        }),
      );

      if (checkoutThunk.fulfilled.match(result)) {
        if (method === 'wallet') {
          dispatch(fetchWalletsThunk());
          dispatch(
            pushNotification({
              type: 'success',
              title: 'Purchase successful',
              message: 'Your resources have been purchased.',
            }),
          );
          navigate(paths.resources);
        }
        return 'success';
      }

      const errorMessage = getErrorMessage(result.payload, 'Unable to process checkout.');

      if (method === 'wallet') {
        setPinError(errorMessage);
        return 'error';
      }

      if (errorMessage.toLowerCase().includes('authkey')) {
        pendingCheckoutRef.current = (m, k) => {
          doCheckoutRef.current(m, k);
        };
        setIsPinModalOpen(true);
        return 'error';
      }

      dispatch(
        pushNotification({
          type: 'error',
          title: 'Checkout failed',
          message: errorMessage,
        }),
      );
      return 'error';
    },
    [cart, dispatch, navigate],
  );

  useEffect(() => {
    doCheckoutRef.current = doCheckoutInner;
  });

  const canCheckout =
    cart.length > 0 &&
    !checkoutLoading &&
    (cartTotal === 0 || paymentMethod === 'paystack' || !walletInsufficientBalance);

  const handleCheckout = useCallback(() => {
    if (paymentMethod === 'wallet') {
      if (walletInsufficientBalance) return;
      setIsPinModalOpen(true);
    } else {
      doCheckoutInner('paystack');
    }
  }, [paymentMethod, walletInsufficientBalance, doCheckoutInner]);

  const handlePinChange = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, '').slice(0, 4);
    setPinValue(numeric);
    setPinError('');
  };

  const handleSubmitPin = async () => {
    if (pinValue.length !== 4) return;
    setSubmittingPin(true);
    setPinError('');
    const result = await doCheckoutInner('wallet', pinValue);
    setSubmittingPin(false);
    if (result === 'success') {
      setPinValue('');
      setIsPinModalOpen(false);
    }
  };

  const closePinModal = () => {
    setIsPinModalOpen(false);
    setPinValue('');
    setPinError('');
    pendingCheckoutRef.current = null;
  };

  const retry = useCallback(() => {
    dispatch(clearCartError());
    fetchCartPage(1);
  }, [dispatch, fetchCartPage]);

  if (walletsLoading && !walletsLastFetchedAt) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppLoader label="Loading wallet" />
        </main>
      </AppShell>
    );
  }

  if (cartLoading && cart.length === 0) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppLoader label="Loading cart" />
        </main>
      </AppShell>
    );
  }

  if (cartError && cart.length === 0) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[38rem] px-4 py-6 pb-28 sm:px-6 md:py-9">
          <div className="grid min-h-[55vh] place-items-center">
            <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
                <AlertCircle className="size-6" aria-hidden />
              </span>
              <div className="grid gap-1">
                <AppText variant="h5" color="#991B1B" align="center">Unable to load cart</AppText>
                <AppText variant="bodySmall" color="#B91C1C" align="center">{cartError}</AppText>
              </div>
              <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={cartLoading} onClick={retry}>
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
      <main className="mx-auto grid w-full max-w-[38rem] gap-5 px-4 py-6 pb-44 sm:px-6 md:py-9">
        <header className="flex items-start gap-3">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#123B8D] transition hover:bg-slate-50"
            type="button"
            onClick={() => navigate(paths.resources)}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h4">My Cart</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {cart.length === 0
                ? 'Your cart is empty'
                : `${cart.length} item${cart.length !== 1 ? 's' : ''} in your cart`}
            </AppText>
          </div>
        </header>

        {cart.length === 0 && !cartLoading ? (
          <div className="grid min-h-[50vh] place-items-center">
            <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
                <ShoppingCart className="size-7" />
              </span>
              <div className="grid gap-2">
                <AppText variant="h5" align="center">Cart is empty</AppText>
                <AppText variant="bodyMedium" color="textSecondary" align="center">
                  Browse our resources collection and add items to your cart.
                </AppText>
              </div>
              <AppButton onClick={() => navigate(paths.resources)}>Browse Resources</AppButton>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-3">
              {cart.map((item) => (
                <CartItemRow
                  key={item.cartId}
                  item={item}
                  removing={cartRemoving === item.cartId}
                  onRemove={handleRemoveFromCart}
                />
              ))}
            </div>

            {cartLoadingMore && (
              <div className="grid py-4 place-items-center">
                <AppLoader label="Loading more" />
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />

            {!hasMore && cart.length > 0 && (
              <>
                <div className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(11,31,74,0.06)]">
                  <AppText variant="h6" className="font-bold text-[#0B1F4A]">Order Summary</AppText>
                  <div className="grid gap-2">
                    {hasFreeItems && (
                      <div className="flex items-center justify-between">
                        <AppText variant="bodyMedium" color="textSecondary">Free items</AppText>
                        <AppText variant="bodyMedium" weight="bold" color="#059669">
                          {freeItemCount} item{freeItemCount !== 1 ? 's' : ''}
                        </AppText>
                      </div>
                    )}
                    {hasPaidItems && (
                      <div className="flex items-center justify-between">
                        <AppText variant="bodyMedium" color="textSecondary">Paid items ({paidItemCount})</AppText>
                        <AppText variant="bodyMedium" weight="bold">
                          {formatMoney(cartTotal, cart[0]?.currency ?? 'NGN')}
                        </AppText>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-[#E5E7EB] pt-3">
                    <div className="flex items-center justify-between">
                      <AppText variant="h6" weight="bold">Total</AppText>
                      <AppText variant="h4" color="#123B8D">
                        {cartTotal === 0 ? 'Free' : formatMoney(cartTotal, cart[0]?.currency ?? 'NGN')}
                      </AppText>
                    </div>
                  </div>
                </div>

                {hasPaidItems && (
                  <div className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(11,31,74,0.06)]">
                    <AppText variant="h6" className="font-bold text-[#0B1F4A]">Payment Method</AppText>
                    <div className="flex rounded-xl bg-[#F1F5F9] p-1">
                      <button
                        className={clsx(
                          'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all duration-200',
                          paymentMethod === 'wallet'
                            ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]'
                            : 'text-[#5A6880] hover:text-[#0B1F4A]',
                        )}
                        type="button"
                        onClick={() => setPaymentMethod('wallet')}
                      >
                        <Wallet className="size-4" aria-hidden />
                        Wallet
                      </button>
                      <button
                        className={clsx(
                          'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all duration-200',
                          paymentMethod === 'paystack'
                            ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]'
                            : 'text-[#5A6880] hover:text-[#0B1F4A]',
                        )}
                        type="button"
                        onClick={() => setPaymentMethod('paystack')}
                      >
                        <CreditCard className="size-4" aria-hidden />
                        Card
                      </button>
                    </div>
                    {paymentMethod === 'wallet' && (
                      <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                        <div className="flex items-center justify-between">
                          <AppText variant="bodySmall" color="textSecondary">Wallet balance</AppText>
                          <AppText variant="bodySmall" weight="bold">
                            {formatMoney(walletBalance / 100, walletCurrency)}
                          </AppText>
                        </div>
                        {walletInsufficientBalance && (
                          <AppText variant="caption" color="#B91C1C" className="mt-1">
                            Insufficient balance. Please use card payment or fund your wallet.
                          </AppText>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {checkoutError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                    <AppText variant="bodySmall" color="#991B1B">{checkoutError}</AppText>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {cart.length > 0 && !hasMore && (
        <div className="fixed inset-x-0 bottom-[6.5rem] z-30 border-t border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(11,31,74,0.1)]">
          <div className="mx-auto grid w-full max-w-[38rem] gap-3">
            <AppButton
              fullWidth
              size="md"
              loading={checkoutLoading}
              disabled={!canCheckout}
              onClick={handleCheckout}
            >
              {cartTotal === 0 ? 'Get Free Resources' : 'Confirm Purchase'}
            </AppButton>
          </div>
        </div>
      )}

      <AppModal
        open={isPinModalOpen}
        title="Enter Wallet PIN"
        onClose={closePinModal}
        footer={
          <>
            <AppButton variant="secondary" onClick={closePinModal}>Cancel</AppButton>
            <AppButton
              variant="primary"
              loading={submittingPin}
              disabled={pinValue.length !== 4}
              onClick={() => void handleSubmitPin()}
            >
              Confirm
            </AppButton>
          </>
        }
      >
        <div className="grid gap-4">
          <AppText variant="bodyMedium" color="textSecondary">
            Enter your 4-digit wallet PIN to confirm this purchase.
          </AppText>
          {pinError && <AppText variant="bodySmall" color="#B91C1C">{pinError}</AppText>}
          <AppInput
            label="Wallet PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pinValue}
            onChange={(e) => handlePinChange(e.target.value)}
          />
        </div>
      </AppModal>

      <AppModal
        open={Boolean(checkoutResult) && paymentMethod === 'paystack'}
        title="Review Order"
        onClose={() => dispatch(clearCheckoutResult())}
        footer={
          <>
            <AppButton variant="secondary" onClick={() => dispatch(clearCheckoutResult())}>
              Cancel
            </AppButton>
            <AppButton
              rightIcon={<ExternalLink className="size-4" aria-hidden />}
              onClick={() => {
                if (checkoutResult?.checkoutUrl) {
                  window.location.assign(checkoutResult.checkoutUrl);
                }
              }}
            >
              Proceed
            </AppButton>
          </>
        }
      >
        {checkoutResult && (
          <div className="grid gap-4">
            <div className="flex items-start gap-3 rounded-xl bg-[#EAF1FF] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#123B8D] text-white">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <div className="grid gap-1">
                <AppText variant="h5" color="#0B1F4A">Payment initiated</AppText>
                <AppText variant="bodySmall" color="textSecondary">
                  Review the details before continuing to payment.
                </AppText>
              </div>
            </div>
            <div className="grid rounded-xl border border-[#E5E7EB] px-4">
              <DetailRow label="Status" value={checkoutResult.status} />
              <DetailRow label="Reference" value={checkoutResult.reference} />
              <DetailRow label="Amount" value={formatMoney(checkoutResult.totalAmount, checkoutResult.currency)} />
              <DetailRow label="Currency" value={checkoutResult.currency} />
            </div>
          </div>
        )}
      </AppModal>
    </AppShell>
  );
}
