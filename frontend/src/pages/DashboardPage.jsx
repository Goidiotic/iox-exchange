import { useEffect, useState } from 'react';
import { Headphones, Send, ShoppingCart, Tag, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import TokenLogo from '../components/tokens/TokenLogo';
import { usePreciseCountdown } from '../hooks/usePreciseCountdown';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';
import { formatINR } from '../utils/format';

const terminalStatuses = ['completed', 'cancelled'];

const actions = [
  { label: 'Buy', to: '/market', icon: ShoppingCart, gradient: 'from-acid to-cyanx' },
  { label: 'Sell', to: '/market', icon: Tag, gradient: 'from-cyanx to-blue-500' },
  { label: 'Refer', to: '/referrals', icon: Send, gradient: 'from-warn to-acid' },
  { label: 'Support', to: '/notifications', icon: Headphones, gradient: 'from-fuchsia-400 to-cyanx' },
];

const banners = [
  {
    title: 'Trade VLX instantly',
    body: 'Buy and sell with M3 Wallet settlement support.',
    image: 'https://images.unsplash.com/photo-1642790551116-18e150f248e1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Track every transaction',
    body: 'Follow pending, processing and completed orders from one dashboard.',
    image: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Manage wallet flow',
    body: 'Keep your VLX balance and wallet activity easy to scan.',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80',
  },
];

function BannerSlider({ balance }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-label="Dashboard banners" className="overflow-hidden">
      <div className="glass overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div key={banner.title} className="relative h-44 w-full shrink-0 overflow-hidden sm:h-56">
              <img
                src={banner.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />
              <div className="relative flex h-full max-w-xl flex-col justify-end p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase text-acid">IOX Exchange</p>
                <h2 className="mt-2 max-w-[18rem] text-2xl font-semibold text-white sm:text-3xl">{banner.title}</h2>
                <p className="mt-2 max-w-[20rem] text-sm text-slate-300">{banner.body}</p>
                <p className="mt-4 text-xl font-semibold text-white">{balance.toLocaleString('en-IN')} VLX</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {banners.map((banner, index) => (
          <button
            key={banner.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show banner ${index + 1}`}
            aria-current={activeIndex === index}
            className={`h-2 rounded-full transition-all ${activeIndex === index ? 'w-7 bg-acid' : 'w-2 bg-slate-600 hover:bg-slate-400'}`}
          />
        ))}
      </div>
    </section>
  );
}

function PendingOrderRow({ order, index }) {
  const fallbackMs = (index + 12) * 60 * 1000;
  const timer = usePreciseCountdown(order.expiresAt ? Math.max(new Date(order.expiresAt).getTime() - Date.now(), 0) : fallbackMs);
  const side = (order.displayType || order.type).toUpperCase();

  return (
    <Link
      to={`/orders/${order.id}`}
      className="panel block p-3 transition hover:border-cyanx/50 hover:bg-cyanx/5"
    >
      <div className="flex items-center gap-3">
        <TokenLogo token={order.token} size="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{side} {order.token.symbol}</p>
            <Badge status={order.status}>{order.status}</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-slate-400">{order.counterparty} - {order.quantity} VLX</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatINR(order.amount)}</p>
          <p className="text-xs capitalize text-slate-500">{order.status}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Expires in</span>
          <span className={timer.expired ? 'text-red-300' : 'font-mono text-warn'}>{timer.label}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-warn to-acid transition-[width] duration-75"
            style={{ width: `${timer.progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useMockQuery('dashboard', mockApi.dashboard);
  const { data: orders = [], isLoading: ordersLoading } = useMockQuery('dashboard-user-orders', mockApi.userOrders);

  if (isLoading) return <Skeleton rows={4} />;
  if (isError || !data?.tokens?.length) {
    return <EmptyState title="Dashboard unavailable" body={error?.message || 'Please login again or try after the backend is ready.'} />;
  }

  const pendingOrders = orders.filter((order) => !terminalStatuses.includes(order.status));
  const nativeToken = data.tokens[0];
  const walletWorth = nativeToken.balance * nativeToken.price;

  return (
    <div className="space-y-5 overflow-x-hidden">
      <BannerSlider balance={nativeToken.balance} />

      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <Link key={action.label} to={action.to} className="min-w-0">
            <div className="flex flex-col items-center gap-2 rounded-lg border border-line bg-white/[0.035] px-2 py-3 transition hover:border-cyanx/50 hover:bg-white/[0.06]">
              <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${action.gradient} text-ink shadow-blue`}>
                <action.icon size={19} />
              </div>
              <p className="text-xs font-medium text-slate-300">{action.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <Card hover={false} className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Wallet balance</p>
            <p className="mt-1 text-2xl font-semibold text-white">{nativeToken.balance.toLocaleString('en-IN')} {nativeToken.symbol}</p>
            <p className="mt-1 text-xs text-slate-500">Worth {formatINR(walletWorth)}</p>
            <p className="mt-1 text-xs text-slate-500">Locked {nativeToken.locked?.toLocaleString('en-IN') || 0} {nativeToken.symbol}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/[0.07] text-acid">
            <WalletCards size={20} />
          </div>
        </div>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Pending orders</h2>
            <p className="text-sm text-slate-500">Your buy and sell orders awaiting completion</p>
          </div>
          <Link to="/orders" className="text-sm font-medium text-cyanx hover:text-acid">View all</Link>
        </div>

        {ordersLoading ? (
          <Skeleton rows={3} />
        ) : pendingOrders.length === 0 ? (
          <EmptyState title="No pending orders" body="Your active buy or sell orders will appear here." />
        ) : (
          <div className="space-y-3">
            {pendingOrders.slice(0, 5).map((order, index) => <PendingOrderRow key={order.id} order={order} index={index} />)}
          </div>
        )}
      </section>
    </div>
  );
}
