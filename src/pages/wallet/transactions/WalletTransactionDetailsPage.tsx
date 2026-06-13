import { useMemo } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { pushNotification } from '@/store/slices/notificationSlice';
import { useAppDispatch } from '@/store/hooks';
import type { Wallet, WalletTransaction } from '@/types/wallet';

const minorUnitMultiplier = 100;

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
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

  if (Number.isNaN(date.getTime())) return value || 'Not provided';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatLabel = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const escapePdfText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const createReceiptPdf = (lines: string[]) => {
  const content = [
    'BT',
    '/F1 20 Tf',
    '50 790 Td',
    `(${escapePdfText('BaptistOne Wallet Receipt')}) Tj`,
    '/F1 11 Tf',
    ...lines.flatMap((line) => ['0 -24 Td', `(${escapePdfText(line)}) Tj`]),
    'ET',
  ].join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
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

export default function WalletTransactionDetailsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { walletNumber = '' } = useParams();
  const { state } = useLocation();
  const routeState = state as { transaction?: WalletTransaction; wallet?: Wallet } | null;
  const transaction = routeState?.transaction ?? null;
  const wallet = routeState?.wallet ?? null;
  const decodedWalletNumber = useMemo(() => decodeURIComponent(walletNumber), [walletNumber]);
  const currency = wallet?.currency ?? 'NGN';

  const receiptLines = useMemo(() => {
    if (!transaction) return [];

    return [
      `Description: ${transaction.description}`,
      `Amount: ${formatMinorMoney(transaction.amount, currency)}`,
      `Type: ${formatLabel(transaction.type)}`,
      `Channel: ${formatLabel(transaction.channel)}`,
      `Status: ${formatLabel(transaction.status)}`,
      `Date: ${formatDate(transaction.createdAt)}`,
      `Balance Before: ${formatMinorMoney(transaction.balanceBefore, currency)}`,
      `Balance After: ${formatMinorMoney(transaction.balanceAfter, currency)}`,
      `Reference: ${transaction.reference || 'Not provided'}`,
      `Wallet Number: ${decodedWalletNumber || 'Not provided'}`,
    ];
  }, [currency, decodedWalletNumber, transaction]);

  const goBack = () => {
    navigate(paths.walletTransactions(decodedWalletNumber || wallet?.walletNumber || ''), { state: { wallet } });
  };

  const shareReceipt = async () => {
    if (!transaction) return;

    const text = ['BaptistOne wallet transaction', ...receiptLines].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Wallet transaction receipt',
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        dispatch(
          pushNotification({
            type: 'success',
            title: 'Receipt copied',
            message: 'Transaction receipt details were copied to your clipboard.',
          }),
        );
      }
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') return;

      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to share',
          message: 'Unable to share this transaction receipt.',
        }),
      );
    }
  };

  const downloadReceipt = () => {
    if (!transaction) return;

    const blob = createReceiptPdf(receiptLines);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `wallet-receipt-${transaction.reference || transaction.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (!transaction) {
    return (
      <AppShell>
        <main className="mx-auto grid min-h-[65vh] w-full max-w-md place-items-center px-4 py-6 pb-28 text-center">
          <section className="grid gap-4">
            <AppText variant="h4" align="center">
              Transaction details unavailable
            </AppText>
            <AppText variant="bodyMedium" color="textSecondary" align="center">
              Open transaction details from your wallet transaction history.
            </AppText>
            <AppButton onClick={() => navigate(paths.wallet)}>Back to wallet</AppButton>
          </section>
        </main>
      </AppShell>
    );
  }

  const isCredit = transaction.type === 'credit';

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9 md:py-9">
        <header className="grid gap-4">
          <AppButton
            className="justify-self-start"
            leftIcon={<ArrowLeft className="size-4" aria-hidden />}
            variant="ghost"
            onClick={goBack}
          >
            Transactions
          </AppButton>

          <div className="grid gap-2">
            <AppText variant="h3">Transaction details</AppText>
            <AppText variant="bodyMedium" color="textSecondary">
              Wallet No. {decodedWalletNumber || 'Not provided'}
            </AppText>
          </div>
        </header>

        <section className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_28px_rgba(11,31,74,0.08)]">
          <div className="rounded-xl bg-[#EAF1FF] p-4">
            <AppText variant="caption" color="textMuted" weight="bold">
              Amount
            </AppText>
            <AppText variant="h3" color={isCredit ? '#047857' : '#B91C1C'}>
              {isCredit ? '+' : '-'}
              {formatMinorMoney(transaction.amount, currency)}
            </AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {transaction.description}
            </AppText>
          </div>

          <div className="grid rounded-xl border border-[#E5E7EB] px-4">
            <DetailRow label="Status" value={formatLabel(transaction.status)} />
            <DetailRow label="Type" value={formatLabel(transaction.type)} />
            <DetailRow label="Channel" value={formatLabel(transaction.channel)} />
            <DetailRow label="Date" value={formatDate(transaction.createdAt)} />
            <DetailRow label="Balance before" value={formatMinorMoney(transaction.balanceBefore, currency)} />
            <DetailRow label="Balance after" value={formatMinorMoney(transaction.balanceAfter, currency)} />
            <DetailRow label="Reference" value={transaction.reference} />
            <DetailRow label="Provider reference" value={transaction.providerRef ?? ''} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AppButton leftIcon={<Share2 className="size-4" aria-hidden />} variant="secondary" onClick={shareReceipt}>
              Share
            </AppButton>
            <AppButton leftIcon={<Download className="size-4" aria-hidden />} onClick={downloadReceipt}>
              Download receipt
            </AppButton>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
