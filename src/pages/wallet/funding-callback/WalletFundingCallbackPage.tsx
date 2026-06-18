import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader, AppModal } from '@/components/feedback';
import { paths } from '@/routes/paths';
import { transactionService } from '@/services/transactions/transactionService';
import { toApiError } from '@/services/api/responseHandler';
import type { TransactionVerification } from '@/types/transaction';

type VerifyStatus = 'idle' | 'loading' | 'success' | 'error';

const minorUnitMultiplier = 100;

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const formatMinorMoney = (value: number, currency: string) => formatMoney(value / minorUnitMultiplier, currency);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || 'Not provided';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
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

export default function WalletFundingCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = useMemo(
    () => (searchParams.get('reference') || searchParams.get('trxref') || '').trim(),
    [searchParams],
  );
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionVerification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const goToWallet = useCallback(() => {
    navigate(paths.wallet, { replace: true });
  }, [navigate]);

  const verifyFunding = useCallback(async () => {
    if (!reference) {
      setStatus('error');
      setError('Missing transaction reference.');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await transactionService.verifyFunding(reference);
      setTransaction(response.data);
      setStatus('success');
      setIsModalOpen(true);
    } catch (requestError) {
      setStatus('error');
      setError(toApiError(requestError).message || 'Unable to verify wallet funding.');
    }
  }, [reference]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      verifyFunding();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [verifyFunding]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 py-8 text-[#0B1F4A]">
      {status === 'loading' && <AppLoader label="Verifying funding" />}

      {status === 'error' && (
        <section className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="size-7" aria-hidden />
          </span>
          <div className="grid gap-2">
            <AppText variant="h4" align="center" color="#991B1B">
              Funding verification failed
            </AppText>
            <AppText variant="bodyMedium" align="center" color="#B91C1C">
              {error}
            </AppText>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <AppButton variant="outline" onClick={goToWallet}>
              Back to wallet
            </AppButton>
            <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} onClick={verifyFunding}>
              Retry
            </AppButton>
          </div>
        </section>
      )}

      {status === 'success' && transaction && (
        <section className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-7" aria-hidden />
          </span>
          <div className="grid gap-2">
            <AppText variant="h4" align="center">
              Funding verified
            </AppText>
            <AppText variant="bodyMedium" align="center" color="textSecondary">
              Your wallet funding transaction has been verified.
            </AppText>
          </div>
          <AppButton fullWidth onClick={goToWallet}>
            Back to wallet
          </AppButton>
        </section>
      )}

      <AppModal
        open={isModalOpen && Boolean(transaction)}
        title="Funding verified"
        onClose={goToWallet}
        footer={
          <AppButton className="col-span-2" fullWidth onClick={goToWallet}>
            Back to wallet
          </AppButton>
        }
      >
        {transaction && (
          <div className="grid gap-4">
            <div className="rounded-xl bg-[#EAF1FF] p-4">
              <AppText variant="caption" color="textMuted" weight="bold">
                Amount
              </AppText>
              <AppText variant="h3">{formatMinorMoney(transaction.amountTotal, transaction.currency)}</AppText>
              <AppText variant="bodySmall" color="textSecondary">
                {transaction.description}
              </AppText>
            </div>

            <div className="grid rounded-xl border border-[#E5E7EB] px-4">
              <DetailRow label="Status" value={transaction.status} />
              <DetailRow label="Payment method" value={transaction.paymentMethod} />
              <DetailRow label="Reference" value={transaction.reference} />
              <DetailRow label="Serial number" value={transaction.serialNumber} />
              <DetailRow label="Date" value={formatDate(transaction.updatedAt || transaction.createdAt)} />
              <DetailRow label="Fees" value={formatMinorMoney(transaction.feesAmountTotal, transaction.currency)} />
            </div>

            {transaction.fees.length > 0 && (
              <div className="grid gap-2">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Fee details
                </AppText>
                {transaction.fees.map((fee) => (
                  <div className="rounded-lg border border-[#E5E7EB] p-3" key={`${fee.name}-${fee.type}`}>
                    <AppText variant="bodySmall" weight="bold">
                      {fee.name}: {formatMinorMoney(fee.amountTotal, transaction.currency)}
                    </AppText>
                    {fee.description && (
                      <AppText variant="caption" color="textSecondary">
                        {fee.description}
                      </AppText>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AppModal>
    </main>
  );
}
