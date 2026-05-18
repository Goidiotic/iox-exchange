import { ArrowLeft, Bell, ChartCandlestick, Coins, Gift, History, LayoutDashboard, ListChecks, LogOut, Settings, UserRound, Wallet } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';
import { classNames } from '../utils/format';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/market', label: 'Market', icon: ChartCandlestick },
  { to: '/orders', label: 'Orders', icon: ListChecks },
  { to: '/wallet', label: 'M3 Wallet', icon: Wallet },
  { to: '/coupons', label: 'Coupons', icon: Gift },
  { to: '/referrals', label: 'Referrals', icon: UserRound },
  { to: '/history', label: 'History', icon: History },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Account', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  return (
    <aside className="flex h-full flex-col border-r border-line bg-ink/90 p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-acid font-black text-ink"><Coins size={20} /></div>
        <div>
          <p className="font-semibold">IOX Exchange</p>
          <p className="text-xs text-slate-500">Build your assets</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                isActive ? 'bg-acid text-ink' : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/10 hover:text-white"
      >
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );
}

const bottomItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/market', label: 'Market', icon: ChartCandlestick },
  { to: '/orders', label: 'Orders', icon: ListChecks },
  { to: '/profile', label: 'Account', icon: UserRound },
];

const mainPaths = new Set(bottomItems.map((item) => item.to));

const innerPageTitles = [
  { match: (path) => path === '/wallet', title: 'Manage M3 Wallet' },
  { match: (path) => path === '/history', title: 'Transactions' },
  { match: (path) => path === '/tickets', title: 'Tickets' },
  { match: (path) => path === '/tickets/new', title: 'New Ticket' },
  { match: (path) => path.startsWith('/tickets/'), title: 'Ticket Details' },
  { match: (path) => path.startsWith('/orders/'), title: 'Transaction Detail' },
  { match: (path) => path.startsWith('/payment/'), title: 'Payment Verification' },
  { match: (path) => path === '/sell', title: 'Sell' },
  { match: (path) => path === '/sell/confirm', title: 'Sell Confirmation' },
  { match: (path) => path === '/sell/pin', title: 'Transaction PIN' },
  { match: (path) => path === '/sell-waiting', title: 'Sell Waiting Room' },
  { match: (path) => path === '/coupons', title: 'Coupons' },
  { match: (path) => path === '/referrals', title: 'Referrals' },
  { match: (path) => path === '/notifications', title: 'Notifications' },
  { match: (path) => path === '/account/profile', title: 'Profile' },
  { match: (path) => path === '/settings', title: 'Settings' },
  { match: (path) => path === '/transaction-pin', title: 'Transaction PIN' },
];

function getInnerPageTitle(pathname) {
  return innerPageTitles.find((item) => item.match(pathname))?.title ?? 'Details';
}

function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              classNames(
                'flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition',
                isActive ? 'text-acid' : 'text-slate-400 hover:text-white',
              )
            }
          >
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function AppHeader({ isMainPage, title }) {
  const navigate = useNavigate();
  const { data: coupons = [] } = useMockQuery('coupons', mockApi.coupons);
  const hasActiveCoupons = coupons.some((coupon) => (
    !coupon.redeemed
    && coupon.active !== false
    && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())
    && Number(coupon.usedCount || 0) < Number(coupon.usageLimit || 1)
  ));

  const goBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate('/');
  };

  const headerActions = (
    <div className="ml-3 flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => navigate('/coupons')}
        aria-label="Open coupons"
        title="Coupons"
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-line bg-white/[0.06] text-slate-100 transition hover:border-acid/60 hover:bg-acid/10 hover:text-acid"
      >
        <Gift size={18} />
        {hasActiveCoupons && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-ink bg-acid" />}
      </button>
      <button
        type="button"
        onClick={() => navigate('/notifications')}
        aria-label="Open notifications"
        title="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-line bg-white/[0.06] text-slate-100 transition hover:border-acid/60 hover:bg-acid/10 hover:text-acid"
      >
        <Bell size={18} />
        {hasActiveCoupons && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-ink bg-acid" />}
      </button>
    </div>
  );

  return (
    <header className="app-mobile-header flex items-center justify-between border-b border-line bg-ink/95 px-4 backdrop-blur-xl sm:px-6 lg:sticky lg:inset-x-auto lg:h-16 lg:bg-ink/75">
      {isMainPage ? (
        <>
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-acid font-black text-ink">IOX</div>
            <div>
              <p className="text-sm font-semibold">IOX Exchange</p>
              <p className="text-xs text-slate-500">Build your assets</p>
            </div>
          </div>
          <div className="hidden text-sm text-slate-400 lg:block">Fixed-price internal tokens. No blockchain rails.</div>
          {headerActions}
        </>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="grid h-9 w-10 shrink-0 place-items-center rounded-lg border border-line bg-white/[0.06] text-slate-100 transition hover:border-acid/60 hover:bg-acid/10 hover:text-acid"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="truncate text-base font-semibold text-white sm:text-lg">{title}</h1>
          </div>
          {headerActions}
        </>
      )}
    </header>
  );
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const isMainPage = mainPaths.has(pathname);
  const isPinScreen = pathname === '/sell/pin';
  const innerPageTitle = getInnerPageTitle(pathname);

  return (
    <div className={classNames('min-h-screen overflow-x-hidden', !isPinScreen && 'lg:grid lg:grid-cols-[280px_1fr]')}>
      <div className={classNames('hidden', !isPinScreen && 'lg:block')}>
        <Sidebar />
      </div>
      <main className="min-w-0 overflow-x-hidden">
        {!isPinScreen && <AppHeader isMainPage={isMainPage} title={innerPageTitle} />}
        <div className={classNames(
          'mx-auto overflow-x-hidden px-4 sm:px-6',
          isPinScreen ? 'max-w-[430px] px-3 pb-4 pt-4 sm:px-4' : 'app-mobile-content max-w-7xl lg:px-8 lg:pb-8 lg:pt-6',
          isMainPage ? 'pb-28' : 'pb-8',
        )}>
          <Outlet />
        </div>
      </main>
      {isMainPage && <MobileBottomNav />}
    </div>
  );
}
