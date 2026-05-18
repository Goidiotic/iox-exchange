import { Bell, ChevronRight, Crown, FileText, Gift, Headphones, History, Info, LogOut, Megaphone, ShieldCheck, Ticket, UserRound, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';
import { useAuthStore } from '../stores/authStore';
import { formatINR } from '../utils/format';

const menuSections = [
  { to: '/account/profile', label: 'Profile', icon: UserRound },
  { to: '/wallet', label: 'M3 Wallet', icon: Wallet },
  { to: '/referrals', label: 'Referrals', icon: UserRound },
  { to: '/coupons', label: 'Coupons', icon: Gift },
  { to: '/history', label: 'Transaction History', icon: History },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

const moreSections = [
  { to: '/referrals', label: 'Influencers', icon: Megaphone },
  { to: '/settings', label: 'Legal', icon: FileText },
  { to: '/settings', label: 'About Us', icon: Info },
  { to: '/notifications', label: 'Live Support', icon: Headphones },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const mobile = user?.mobile || '9876543210';
  const { data: walletSummary, isLoading, isError } = useMockQuery('account-wallet-summary', mockApi.walletSummary);
  const token = walletSummary?.tokens?.[0];
  const wallet = walletSummary?.wallet;
  const walletUid = wallet?.walletId || user?.uid || `IOX-${mobile.slice(-6)}`;
  const walletBalance = token?.balance || 0;
  const walletSymbol = token?.symbol || 'VLX';
  const walletPrice = token?.price || 0;
  const walletStatus = isError ? 'Unavailable' : wallet?.verified ? 'Connected' : wallet?.status === 'pending' ? 'Pending' : 'Not connected';
  const walletConnected = wallet?.verified || wallet?.status === 'active';
  const walletWorth = walletBalance * walletPrice;

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-4 overflow-x-hidden">
      {isLoading && <Skeleton rows={1} />}
      <Card hover={false} className="overflow-hidden p-5">
        <div className="relative">
          <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-acid/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Wallet</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{walletBalance.toLocaleString('en-IN')} {walletSymbol}</h1>
              <p className="mt-1 text-sm text-slate-400">Worth {formatINR(walletWorth)}</p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-acid text-ink">
              <Wallet size={24} />
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-line bg-white/[0.05] px-3 py-2 text-sm font-medium text-slate-100">UID {walletUid}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-acid/40 bg-acid/10 px-2 py-1 text-xs font-medium text-acid">
              <ShieldCheck size={13} /> {walletStatus}
            </span>
            {!walletConnected && <span className="text-xs text-slate-500">Connect M3 Wallet to enable settlements</span>}
          </div>
        </div>
      </Card>

      <Link to="/coupons" className="flex items-center justify-between rounded-lg border border-acid/40 bg-acid/10 px-4 py-4 hover:bg-acid/15">
        <span className="flex items-center gap-3 text-sm font-semibold text-white">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-acid text-ink">
            <Crown size={18} />
          </span>
          <span><span className="text-acid">VIP</span> Club</span>
        </span>
        <ChevronRight size={17} className="text-acid" />
      </Link>

      <Link to="/tickets" className="flex items-center justify-between rounded-lg border border-line bg-white/[0.045] px-4 py-4 hover:bg-white/[0.06]">
        <span className="flex items-center gap-3 text-sm font-semibold text-white">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-acid">
            <Ticket size={18} />
          </span>
          Tickets
        </span>
        <ChevronRight size={17} className="text-slate-500" />
      </Link>

      <div className="overflow-hidden rounded-lg border border-line bg-white/[0.045]">
        {menuSections.map((item) => (
          <Link key={item.to} to={item.to} className="flex items-center justify-between border-b border-line px-4 py-4 last:border-b-0 hover:bg-white/[0.06]">
            <span className="flex items-center gap-3 text-sm font-medium text-slate-100">
              <item.icon size={18} className="text-acid" />
              {item.label}
            </span>
            <ChevronRight size={17} className="text-slate-500" />
          </Link>
        ))}
      </div>

      <div className="mt-auto overflow-hidden rounded-lg border border-line bg-white/[0.045]">
        {moreSections.map((item) => (
          <Link key={item.label} to={item.to} className="flex items-center justify-between border-b border-line px-4 py-4 hover:bg-white/[0.06]">
            <span className="flex items-center gap-3 text-sm font-medium text-slate-100">
              <item.icon size={18} className="text-acid" />
              {item.label}
            </span>
            <ChevronRight size={17} className="text-slate-500" />
          </Link>
        ))}
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-red-400/10"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-red-300">
            <LogOut size={18} />
            Logout
          </span>
          <ChevronRight size={17} className="text-red-300/70" />
        </button>
      </div>
    </div>
  );
}
