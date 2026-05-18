import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import TokenLogo from '../components/tokens/TokenLogo';
import { usePreciseCountdown } from '../hooks/usePreciseCountdown';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';
import { useTradingStore } from '../stores/tradingStore';
import { classNames, formatINR } from '../utils/format';

const terminalStatuses = ['completed', 'cancelled', 'failed', 'expired', 'rejected'];
const systemVerificationStatuses = ['processing', 'under review'];

function getInitialStatus(order) {
  if ((order.status === 'verified pending' || order.status === 'pending') && order.type === 'buy') return 'awaiting payment';
  return order.status || 'pending';
}

function getInitialTimerMs(status, order) {
  if (terminalStatuses.includes(status)) return 0;
  if (order.expiresAt) return Math.max(new Date(order.expiresAt).getTime() - Date.now(), 0);
  if (status === 'awaiting payment') return (order.payTime || 10) * 60 * 1000;
  if (status === 'processing') return (order.verifyMinutes || 3) * 60 * 1000;
  if (status === 'under review') return 2 * 60 * 1000;

  const minutesMatch = order.expiresIn?.match(/(\d+)\s*min/i);
  if (minutesMatch) return Number(minutesMatch[1]) * 60 * 1000;

  return 42 * 60 * 1000;
}

function getStaticProgress(status, order) {
  if (status === 'completed') return 100;
  if (status === 'cancelled') return 0;
  if (status === 'awaiting payment') return 48;
  return order.expiryProgress ?? 65;
}

function DetailRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={classNames('text-right text-sm', strong ? 'font-semibold text-white' : 'text-slate-200')}>{value}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useMockQuery(['order', orderId], () => mockApi.order(orderId));
  const orderStatusOverrides = useTradingStore((state) => state.orderStatusOverrides);
  const orderTimerOverrides = useTradingStore((state) => state.orderTimerOverrides);
  const setOrderStatus = useTradingStore((state) => state.setOrderStatus);

  const initialStatus = useMemo(() => (order ? getInitialStatus(order) : 'pending'), [order]);
  const status = orderStatusOverrides[orderId] || initialStatus;
  const timerMs = useMemo(() => orderTimerOverrides[orderId] ?? (order ? getInitialTimerMs(status, order) : 0), [order, orderId, orderTimerOverrides, status]);
  const timer = usePreciseCountdown(timerMs);

  if (isLoading) return <Skeleton rows={2} />;

  const clockExpired = Boolean(order.expiresAt && timer.expired && ['pending', 'awaiting payment', 'verified pending'].includes(status));
  const displayStatus = clockExpired ? 'expired' : status;
  const side = order.type || 'buy';
  const isBuy = side === 'buy';
  const isActionable = !terminalStatuses.includes(displayStatus);
  const isBuyerView = isBuy && !order.isSubSell;
  const isSystemVerification = systemVerificationStatuses.includes(displayStatus);
  const canCancel = isActionable && !timer.expired && !order.isSubSell && (!isSystemVerification || isBuyerView);
  const progress = isActionable ? timer.progress : getStaticProgress(displayStatus, order);
  const timerLabel = isActionable ? timer.label : '0:00:00';
  const counterparty = order.counterparty || order.seller || 'Platform verified seller';
  const transactionId = order.transactionId || 'Pending assignment';
  const displayType = order.displayType || side;
  const SideIcon = displayType === 'sub-sell' || !isBuy ? ArrowUpRight : ArrowDownLeft;

  const completeOrder = () => {
    if (isBuy && displayStatus === 'awaiting payment') {
      navigate(`/payment/${order.id}`);
      return;
    }

    setOrderStatus(order.id, 'completed');
    toast.success('Order marked completed');
  };

  const cancelOrder = async () => {
    await mockApi.cancelOrder(order.id);
    setOrderStatus(order.id, 'cancelled');
    toast.success('Order cancelled');
  };

  return (
    <>
      <PageHeader title="Transaction Detail" eyebrow={order.id} action={<Badge status={displayStatus}>{displayStatus}</Badge>} />

      <Card hover={false} className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <TokenLogo token={order.token} size="h-16 w-16" />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-ink bg-panel">
              <SideIcon size={14} className={isBuyerView ? 'text-acid' : 'text-cyanx'} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-white">{displayType.toUpperCase()} {order.token.symbol}</h2>
              <Badge status={displayStatus} className="capitalize">{displayStatus}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-400">{order.token.name}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{formatINR(order.amount)}</p>
            <p className="mt-1 text-sm text-slate-500">Qty {order.quantity} {order.token.symbol}</p>
          </div>
        </div>

        {isActionable && (
          <div className="mt-6 rounded-lg border border-line bg-white/[0.035] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Order timer</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isSystemVerification ? 'M3 Wallet API verifying, completes within 2-3 min' : 'min:sec:mili sec'}
                </p>
              </div>
              <span className="shrink-0 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 font-mono text-lg font-semibold tabular-nums text-warn">
                {timerLabel}
              </span>
            </div>
            <div className="mt-3 h-1.5 max-w-sm overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-warn to-acid transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 divide-y divide-transparent">
          <DetailRow label="Status" value={displayStatus} strong />
          {isSystemVerification && <DetailRow label="Verification" value="System is verifying payment details with M3 Wallet API" />}
          <DetailRow label="Order ID" value={order.id} />
          <DetailRow label="Transaction ID" value={transactionId} />
          <DetailRow label="Counterparty" value={counterparty} />
          <DetailRow label="Date" value={order.date || 'Today'} />
        </div>

        {canCancel && (
          <div className={classNames('mt-6 flex flex-wrap gap-3', isBuy ? 'justify-start' : 'justify-end')}>
            {isBuyerView && (
              <Button type="button" onClick={completeOrder}>
                <CheckCircle2 size={16} /> {displayStatus === 'awaiting payment' ? 'Complete the order' : 'Complete'}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={cancelOrder}>
              <XCircle size={16} /> Cancel
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
