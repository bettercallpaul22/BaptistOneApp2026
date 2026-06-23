import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppModal } from '@/components/feedback';
import { AppInput } from '@/components/form';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearPurchaseResult } from '@/store/slices/conventionSlice';
import { purchasePublicationThunk } from '@/store/thunks/conventionThunk';
import { fetchWalletsThunk } from '@/store/thunks/walletThunk';
import { pushNotification } from '@/store/slices/notificationSlice';
import { paths } from '@/routes/paths';
import { callbackUrls } from '@/constants/callbackUrls';
import type { ConventionPublication } from '@/types/convention';

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

type PaymentMethod = 'wallet' | 'paystack';

export default function ConventionPublicationPaymentPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const publication = (location.state as { publication?: ConventionPublication } | null)?.publication;

  const { purchaseLoading, purchaseError, purchaseResult } = useAppSelector((state) => state.convention);
  const wallets = useAppSelector((state) => state.wallet.items);
  const walletBalance = wallets[0]?.balance ?? 0;
  const walletCurrency = wallets[0]?.currency ?? 'NGN';
  const conventionId = useAppSelector((state) => state.convention.conventionId);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);

  useEffect(() => {
    dispatch(fetchWalletsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (purchaseResult?.data?.checkoutUrl) {
      window.location.assign(purchaseResult.data.checkoutUrl);
    } else if (purchaseResult && !purchaseResult.data?.checkoutUrl) {
      dispatch(pushNotification({ type: 'success', title: 'Purchase successful', message: 'Publication access granted.' }));
      dispatch(clearPurchaseResult());
      navigate(paths.convention);
    }
  }, [purchaseResult, dispatch, navigate]);

  const handlePurchase = useCallback(
    async (method: PaymentMethod, authKey?: string) => {
      if (!publication || !conventionId) return;
      dispatch(purchasePublicationThunk({
        conventionId,
        publicationId: publication.id,
        payload: {
          pricingModel: publication.pricingModel,
          amount: publication.price,
          currency: publication.currency,
          paymentMethod: method,
          ...(authKey ? { authKey } : {}),
          ...(method === 'paystack' ? { callbackUrl: callbackUrls.convention() } : {}),
        },
      }));
    },
    [publication, conventionId, dispatch],
  );

  const handleSubmit = () => {
    if (publication?.pricingModel === 'FREE') {
      void handlePurchase('wallet');
    } else if (paymentMethod === 'wallet') {
      setIsPinModalOpen(true);
    } else {
      void handlePurchase('paystack');
    }
  };

  const handleSubmitPin = async () => {
    if (pinValue.length !== 4 || !publication || !conventionId) return;
    setSubmittingPin(true);
    setPinError('');
    const result = await dispatch(purchasePublicationThunk({
      conventionId,
      publicationId: publication.id,
      payload: {
        pricingModel: publication.pricingModel,
        amount: publication.price,
        currency: publication.currency,
        paymentMethod: 'wallet',
        authKey: pinValue,
      },
    }));
    setSubmittingPin(false);
    if (purchasePublicationThunk.fulfilled.match(result)) {
      setPinValue('');
      setIsPinModalOpen(false);
    } else {
      setPinError(getErrorMessage(result.payload, 'Purchase failed.'));
    }
  };

  if (!publication) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppText variant="h5" align="center">Publication not found</AppText>
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
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h4">{publication.title}</AppText>
            <AppText variant="bodySmall" color="textMuted">by {publication.author}</AppText>
          </div>
        </header>

        {publication.summary && (
          <AppText variant="bodyMedium" color="textSecondary">{publication.summary}</AppText>
        )}

        {publication.coverFile?.url && (
          <img className="w-full rounded-xl object-cover max-h-48" src={publication.coverFile.url} alt={publication.title} />
        )}

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center justify-between">
            <AppText variant="subtitle">Price</AppText>
            <AppText variant="h5" color="#123B8D">
              {publication.pricingModel === 'FREE' ? 'Free' : formatMoney(publication.price, publication.currency)}
            </AppText>
          </div>
          <div className="flex items-center justify-between mt-2">
            <AppText variant="bodySmall" color="textSecondary">Type</AppText>
            <AppText variant="bodySmall" weight="bold">{publication.pricingModel}</AppText>
          </div>
          {publication.subscriptionDays && (
            <div className="flex items-center justify-between mt-2">
              <AppText variant="bodySmall" color="textSecondary">Subscription</AppText>
              <AppText variant="bodySmall" weight="bold">{publication.subscriptionDays} days</AppText>
            </div>
          )}
        </div>

        {publication.pricingModel !== 'FREE' && (
          <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <AppText variant="h6" className="font-bold text-[#0B1F4A]">Payment Method</AppText>
            <div className="flex rounded-xl bg-[#F1F5F9] p-1">
              <button
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                  paymentMethod === 'wallet' ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]' : 'text-[#5A6880] hover:text-[#0B1F4A]',
                )}
                type="button"
                onClick={() => setPaymentMethod('wallet')}
              >
                <Wallet className="size-4" /> Wallet
              </button>
              <button
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                  paymentMethod === 'paystack' ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]' : 'text-[#5A6880] hover:text-[#0B1F4A]',
                )}
                type="button"
                onClick={() => setPaymentMethod('paystack')}
              >
                <CreditCard className="size-4" /> Card
              </button>
            </div>
            {paymentMethod === 'wallet' && (
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between">
                  <AppText variant="bodySmall" color="textSecondary">Wallet balance</AppText>
                  <AppText variant="bodySmall" weight="bold">{formatMoney(walletBalance / 100, walletCurrency)}</AppText>
                </div>
              </div>
            )}
          </div>
        )}

        {purchaseError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <AppText variant="bodySmall" color="#991B1B">{purchaseError}</AppText>
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-[6.5rem] z-30 border-t border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(11,31,74,0.1)]">
        <div className="mx-auto grid w-full max-w-[38rem]">
          <AppButton fullWidth size="md" loading={purchaseLoading} onClick={handleSubmit}>
            {publication.pricingModel === 'FREE' ? 'Get Free' : 'Confirm Purchase'}
          </AppButton>
        </div>
      </div>

      <AppModal
        open={isPinModalOpen}
        title="Enter Wallet PIN"
        onClose={() => { setIsPinModalOpen(false); setPinValue(''); setPinError(''); }}
        footer={
          <>
            <AppButton variant="secondary" onClick={() => { setIsPinModalOpen(false); setPinValue(''); setPinError(''); }}>Cancel</AppButton>
            <AppButton loading={submittingPin} disabled={pinValue.length !== 4} onClick={() => void handleSubmitPin()}>Confirm</AppButton>
          </>
        }
      >
        <div className="grid gap-4">
          <AppText variant="bodyMedium" color="textSecondary">Enter your 4-digit wallet PIN to confirm purchase.</AppText>
          {pinError && <AppText variant="bodySmall" color="#B91C1C">{pinError}</AppText>}
          <AppInput
            label="Wallet PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pinValue}
            onChange={(e) => { setPinValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setPinError(''); }}
          />
        </div>
      </AppModal>
    </AppShell>
  );
}
