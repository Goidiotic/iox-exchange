import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import TokenLogo from '../components/tokens/TokenLogo';
import { usePreciseCountdown } from '../hooks/usePreciseCountdown';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';
import { classNames, formatINR } from '../utils/format';

const filters = ['all', 'buy', 'sell'];
const terminalStatuses = ['completed', 'cancelled', 'expired', 'failed', 'rejected'];

function OrderRow({ order, index }) {
  const isSellSide = order.displayType === 'sub-sell' || order.type === 'sell';
  const Icon = isSellSide ? ArrowUpRight : ArrowDownLeft;
  const sideClass = isSellSide ? 'text-cyanx' : 'text-acid';
  const countdownMs = order.expiresAt ? Math.max(new Date(order.expiresAt).getTime() - Date.now(), 0) : 0;
  const timer = usePreciseCountdown(countdownMs);
  const clockExpired = Boolean(order.expiresAt && countdownMs === 0 && ['pending', 'awaiting payment', 'verified pending'].includes(order.status));
  const displayStatus = clockExpired ? 'expired' : order.status;
  const showProgress = !terminalStatuses.includes(displayStatus);

  return (
    <Link
      key={order.id}
      to={`/orders/${order.id}`}
      className={classNames(
        'block p-3 transition hover:bg-white/[0.06] sm:p-4',
        index !== 0 && 'border-t border-line',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <TokenLogo token={order.token} size="h-11 w-11" />
          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-ink bg-panel">
            <Icon size={12} className={sideClass} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-white sm:text-base">
              {(order.displayType || order.type).toUpperCase()} {order.token.symbol}
            </h2>
            <Badge status={displayStatus} className="px-2 py-0.5 text-[10px] capitalize">
              {displayStatus}
            </Badge>
          </div>
          <p className="mt-1 truncate text-xs text-slate-400">{order.token.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{order.date}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-white sm:text-base">{formatINR(order.amount)}</p>
          <p className="mt-1 text-xs text-slate-400">Qty {order.quantity}</p>
          <p className="mt-0.5 text-[11px] capitalize text-slate-500">{displayStatus}</p>
        </div>

        <ChevronRight size={16} className="hidden shrink-0 text-slate-600 sm:block" />
      </div>

      {showProgress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Time remaining to expire</span>
            <span className={timer.expired ? 'text-red-300' : 'font-mono text-warn'}>{timer.label}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-warn to-acid transition-[width] duration-75"
              style={{ width: `${timer.progress}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');
  const { data = [], isLoading } = useMockQuery('user-orders', mockApi.userOrders);

  const orders = useMemo(
    () => {
      if (filter === 'all') return data;
      if (filter === 'sell') return data.filter((order) => order.type === 'sell' || order.displayType === 'sub-sell');
      return data.filter((order) => order.type === filter && order.displayType !== 'sub-sell');
    },
    [data, filter],
  );

  if (isLoading) return <Skeleton rows={4} />;

  return (
    <>
      <PageHeader title="Orders" eyebrow="Buy and sell transactions" />

      <div className="mb-4 inline-grid grid-cols-3 rounded-lg border border-line bg-white/[0.04] p-1">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={classNames(
              'rounded-md px-4 py-2 text-sm font-semibold capitalize transition',
              filter === item ? 'bg-acid text-ink' : 'text-slate-300 hover:bg-white/10',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders found" body="Your buy and sell orders will appear here after you place them." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white/[0.045]">
          {orders.map((order, index) => <OrderRow key={order.id} order={order} index={index} />)}
        </div>
      )}
    </>
  );
}
