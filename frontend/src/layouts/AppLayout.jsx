import { ArrowLeft, Bell, ChartCandlestick, Coins, Gift, History, LayoutDashboard, ListChecks, LogOut, Settings, UserRound, Wallet } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
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
                isActive ? 'bg-acid text-ink' : 'text-slate-400 hover:bg-white/10 hover:text-white',
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

  const goBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-ink/75 px-4 backdrop-blur-xl sm:px-6">
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
        </>
      ) : (
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
      )}
    </header>
  );
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const isMainPage = mainPaths.has(pathname);
  const innerPageTitle = getInnerPageTitle(pathname);

  return (
    <div className="min-h-screen overflow-x-hidden lg:grid lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="min-w-0 overflow-x-hidden">
        <AppHeader isMainPage={isMainPage} title={innerPageTitle} />
        <div className={classNames('mx-auto max-w-7xl overflow-x-hidden px-4 pt-6 sm:px-6 lg:px-8 lg:pb-8', isMainPage ? 'pb-28' : 'pb-8')}>
          <Outlet />
        </div>
      </main>
      {isMainPage && <MobileBottomNav />}
    </div>
  );
}
