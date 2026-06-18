import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader, AppModal } from '@/components/feedback';
import { paths } from '@/routes/paths';
import { toApiError } from '@/services/api/responseHandler';
import { transactionService } from '@/services/transactions/transactionService';
import type { TransactionVerification } from '@/types/transaction';

type VerifyStatus = 'idle' | 'loading' | 'success' | 'error';

const minorUnitMultiplier = 100;
const paystackFeeRate = 0.015;
const paystackFixedFee = 100;
const paystackFeeCap = 2000;

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const decodePaystackFee = (value: number) => {
  const minorUnitValue = value / minorUnitMultiplier;
  const serializedValue = String(Math.trunc(value));
  const serializedFixedFee = String(paystackFixedFee);

  if (
    minorUnitValue > 0 &&
    minorUnitValue < paystackFeeCap &&
    serializedValue.startsWith(serializedFixedFee) &&
    serializedValue.length > serializedFixedFee.length
  ) {
    const variableFee = Number(serializedValue.slice(serializedFixedFee.length));

    if (Number.isFinite(variableFee) && variableFee > 0) {
      return paystackFixedFee + variableFee;
    }
  }

  return minorUnitValue;
};

const getGivingPaymentAmounts = (transaction: TransactionVerification) => {
  if (transaction.paymentMethod.toLowerCase() !== 'paystack' || transaction.feesAmountTotal <= 0) {
    return {
      amount: transaction.amountTotal / minorUnitMultiplier,
      fees: transaction.feesAmountTotal / minorUnitMultiplier,
    };
  }

  const fees = decodePaystackFee(transaction.feesAmountTotal);
  const variableFee = fees - paystackFixedFee;

  if (variableFee <= 0 || fees >= paystackFeeCap) {
    return {
      amount: transaction.amountTotal / minorUnitMultiplier,
      fees,
    };
  }

  const givingAmount = variableFee / paystackFeeRate;

  return {
    amount: givingAmount + fees,
    fees,
  };
};

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

export default function GivingCallbackPage() {
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

  const goToGiving = useCallback(() => {
    navigate(paths.donation, { replace: true });
  }, [navigate]);

  const verifyGiving = useCallback(async () => {
    if (!reference) {
      setStatus('error');
      setError('Missing transaction reference.');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await transactionService.verify(reference);
      setTransaction(response.data);
      setStatus('success');
      setIsModalOpen(true);
    } catch (requestError) {
      setStatus('error');
      setError(toApiError(requestError).message || 'Unable to verify giving payment.');
    }
  }, [reference]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      verifyGiving();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [verifyGiving]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 py-8 text-[#0B1F4A]">
      {status === 'loading' && <AppLoader label="Verifying giving" />}

      {status === 'error' && (
        <section className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="size-7" aria-hidden />
          </span>
          <div className="grid gap-2">
            <AppText variant="h4" align="center" color="#991B1B">
              Giving verification failed
            </AppText>
            <AppText variant="bodyMedium" align="center" color="#B91C1C">
              {error}
            </AppText>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <AppButton variant="outline" onClick={goToGiving}>
              Back to giving
            </AppButton>
            <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} onClick={verifyGiving}>
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
              Giving verified
            </AppText>
            <AppText variant="bodyMedium" align="center" color="textSecondary">
              Your giving payment has been verified.
            </AppText>
          </div>
          <AppButton fullWidth onClick={goToGiving}>
            Back to giving
          </AppButton>
        </section>
      )}

      <AppModal
        open={isModalOpen && Boolean(transaction)}
        title="Giving verified"
        onClose={goToGiving}
        footer={
          <AppButton className="col-span-2" fullWidth onClick={goToGiving}>
            Back to giving
          </AppButton>
        }
      >
        {transaction && (
          (() => {
            const paymentAmounts = getGivingPaymentAmounts(transaction);

            return (
              <div className="grid gap-4">
                <div className="rounded-xl bg-[#EAF1FF] p-4">
                  <AppText variant="caption" color="textMuted" weight="bold">
                    Amount
                  </AppText>
                  <AppText variant="h3">{formatMoney(paymentAmounts.amount, transaction.currency)}</AppText>
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
                  <DetailRow label="Fees" value={formatMoney(paymentAmounts.fees, transaction.currency)} />
                </div>
              </div>
            );
          })()
        )}
      </AppModal>
    </main>
  );
}
