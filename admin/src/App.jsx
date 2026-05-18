import { useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, CheckCircle2, Coins, LogOut, RefreshCw, Shield, TicketPercent, UsersRound, XCircle } from 'lucide-react';
import { adminApi, session } from './api';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'orders', label: 'Orders', icon: Coins },
  { id: 'users', label: 'Users', icon: UsersRound },
  { id: 'transactions', label: 'Transactions', icon: BadgeIndianRupee },
  { id: 'settings', label: 'Tokens & Coupons', icon: TicketPercent },
];

const formatDate = (value) => (value ? new Date(value).toLocaleString('en-IN') : '-');
const formatInr = (value = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

function Field({ label, children }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Login({ onLogin }) {
  const [values, setValues] = useState({ mobile: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.login(values);
      if (!['admin', 'super_admin'].includes(response.user?.role)) {
        throw new Error('Admin access required');
      }
      session.set(response);
      onLogin(response.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark"><Shield size={24} /></div>
        <h1>IOX Admin</h1>
        <p>Sign in with an admin account to manage exchange operations.</p>
        <Field label="Mobile number">
          <input value={values.mobile} onChange={(event) => setValues({ ...values, mobile: event.target.value })} placeholder="Mobile number" />
        </Field>
        <Field label="Password">
          <input value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="Password" type="password" />
        </Field>
        {error && <div className="error">{error}</div>}
        <button disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <section className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function AdminShell({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ users: [], orders: [], paymentApprovals: [], transactions: [], coupons: [], tokens: [], settings: null });
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setNotice('');
    try {
      const [users, orders, paymentApprovals, transactions, coupons, tokens, settings] = await Promise.all([
        adminApi.users(),
        adminApi.pendingOrders(),
        adminApi.paymentApprovals(),
        adminApi.transactions(),
        adminApi.coupons(),
        adminApi.tokens(),
        adminApi.settings(),
      ]);
      setData({ users, orders, paymentApprovals, transactions, coupons, tokens, settings });
    } catch (err) {
      setNotice(err.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    users: data.users.length,
    pendingOrders: data.orders.length,
    transactions: data.transactions.length,
    volume: data.transactions.reduce((sum, tx) => sum + (tx.amountInr || 0), 0),
  }), [data]);

  const decideOrder = async (id, action) => {
    setNotice('');
    try {
      const reason = action === 'reject' ? window.prompt('Rejection reason') || 'Rejected by admin' : undefined;
      if (action === 'approve') await adminApi.approveOrder(id);
      if (action === 'reject') await adminApi.rejectOrder(id, reason);
      setNotice(action === 'approve' ? 'Sell order approved and listed on Market' : 'Sell order rejected and tokens unlocked');
      await load();
    } catch (err) {
      setNotice(err.message || 'Unable to update sell order');
    }
  };

  const decidePayment = async (id, action) => {
    setNotice('');
    try {
      const reason = action === 'reject' ? window.prompt('Payment rejection reason') || 'Payment rejected by admin' : undefined;
      if (action === 'approve') await adminApi.approvePayment(id);
      if (action === 'reject') await adminApi.rejectPayment(id, reason);
      setNotice(action === 'approve' ? 'Payment approved and order completed' : 'Payment rejected and sell quantity released');
      await load();
    } catch (err) {
      setNotice(err.message || 'Unable to update payment order');
    }
  };

  const logout = () => {
    session.clear();
    onLogout();
  };

  return (
    <div className="app-shell">
      <aside>
        <div className="sidebar-brand">
          <div className="brand-mark"><Shield size={20} /></div>
          <div>
            <strong>IOX Admin</strong>
            <span>{user?.role || 'admin'}</span>
          </div>
        </div>
        <nav>
          {tabs.map((tab) => (
            <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
        <button className="logout" onClick={logout}><LogOut size={18} /> Logout</button>
      </aside>

      <main>
        <header>
          <div>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            <p>Manage users, order approvals, transactions, tokens and coupons.</p>
          </div>
          <button className="ghost" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</button>
        </header>

        {notice && <div className="notice">{notice}</div>}
        {activeTab === 'overview' && <Overview stats={stats} data={data} />}
        {activeTab === 'orders' && <Orders orders={data.orders} paymentApprovals={data.paymentApprovals} onDecision={decideOrder} onPaymentDecision={decidePayment} />}
        {activeTab === 'users' && <Users users={data.users} />}
        {activeTab === 'transactions' && <Transactions transactions={data.transactions} />}
        {activeTab === 'settings' && <Settings users={data.users} coupons={data.coupons} tokens={data.tokens} settings={data.settings} onSaved={load} />}
      </main>
    </div>
  );
}

function Overview({ stats, data }) {
  return (
    <>
      <div className="stats-grid">
        <Stat label="Users" value={stats.users} />
        <Stat label="Active orders" value={stats.pendingOrders} />
        <Stat label="Transactions" value={stats.transactions} />
        <Stat label="Volume" value={formatInr(stats.volume)} />
      </div>
      <section className="panel">
        <h2>Latest Transactions</h2>
        <Transactions transactions={data.transactions.slice(0, 6)} compact />
      </section>
    </>
  );
}

function Orders({ orders, paymentApprovals, onDecision, onPaymentDecision }) {
  return (
    <>
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Sell Order Verification</h2>
          <p>Approve verified sell orders to list them on Market. Rejecting unlocks the seller token balance.</p>
        </div>
        <strong>{orders.length} pending</strong>
      </div>
      <div className="table">
        <div className="row sell-order-row head">
          <span>Order</span>
          <span>Seller</span>
          <span>Token Qty</span>
          <span>Price</span>
          <span>INR Value</span>
          <span>Submitted</span>
          <span>Actions</span>
        </div>
        {orders.map((order) => (
          <div className="row sell-order-row" key={order._id}>
            <span>
              <strong>{order.orderNo}</strong>
              <small>{order.type === 'fast_track_sell' ? 'Quick Sell' : 'Manual'}</small>
            </span>
            <span>
              <strong>{order.seller?.mobile || '-'}</strong>
              <small>{order.seller?.uid || order.seller?.referralCode || 'User account'}</small>
            </span>
            <span>{Number(order.quantity || 0).toLocaleString('en-IN')} {order.token?.symbol || 'TOKEN'}</span>
            <span>{formatInr(order.fixedPrice || order.token?.fixedPrice || 0)}</span>
            <span>{formatInr(order.inrAmount)}</span>
            <span>{formatDate(order.createdAt)}</span>
            <span className="actions">
              <button className="mini success" onClick={() => onDecision(order._id, 'approve')}><CheckCircle2 size={15} />Approve</button>
              <button className="mini danger" onClick={() => onDecision(order._id, 'reject')}><XCircle size={15} />Reject</button>
            </span>
          </div>
        ))}
        {orders.length === 0 && <div className="empty">No pending verification orders.</div>}
      </div>
    </section>
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Buyer Payment Approval</h2>
          <p>Approve submitted buyer payment details to complete buyer and seller orders without M3 Wallet verification.</p>
        </div>
        <strong>{paymentApprovals.length} waiting</strong>
      </div>
      <div className="table">
        <div className="row sell-order-row head">
          <span>Buy Order</span>
          <span>Buyer</span>
          <span>Token Qty</span>
          <span>Payment Ref</span>
          <span>INR Value</span>
          <span>Submitted</span>
          <span>Actions</span>
        </div>
        {paymentApprovals.map((order) => (
          <div className="row sell-order-row" key={order._id}>
            <span>
              <strong>{order.orderNo}</strong>
              <small>Parent {order.parentOrder?.orderNo || '-'}</small>
            </span>
            <span>
              <strong>{order.buyer?.mobile || '-'}</strong>
              <small>{order.buyer?.uid || order.buyer?.referralCode || 'Buyer account'}</small>
            </span>
            <span>{Number(order.quantity || 0).toLocaleString('en-IN')} {order.token?.symbol || 'TOKEN'}</span>
            <span>{order.settlement?.m3TransactionId || '-'}</span>
            <span>{formatInr(order.inrAmount)}</span>
            <span>{formatDate(order.settlement?.submittedAt || order.updatedAt)}</span>
            <span className="actions">
              <button className="mini success" onClick={() => onPaymentDecision(order._id, 'approve')}><CheckCircle2 size={15} />Approve</button>
              <button className="mini danger" onClick={() => onPaymentDecision(order._id, 'reject')}><XCircle size={15} />Reject</button>
            </span>
          </div>
        ))}
        {paymentApprovals.length === 0 && <div className="empty">No buyer payments awaiting approval.</div>}
      </div>
    </section>
    </>
  );
}

function Users({ users }) {
  return (
    <section className="panel">
      <h2>Users</h2>
      <div className="table">
        <div className="row head"><span>Mobile</span><span>Role</span><span>Status</span><span>Wallet</span><span>Joined</span></div>
        {users.map((user) => (
          <div className="row" key={user._id}>
            <span>{user.mobile}</span>
            <span>{user.role}</span>
            <span>{user.status}</span>
            <span>{user.walletConnected ? 'Connected' : 'Not connected'}</span>
            <span>{formatDate(user.createdAt)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Transactions({ transactions, compact = false }) {
  return (
    <div className={compact ? 'table compact' : 'panel'}>
      {!compact && <h2>Transactions</h2>}
      <div className="table">
        <div className="row head"><span>No</span><span>Type</span><span>Amount</span><span>Status</span><span>Date</span></div>
        {transactions.map((tx) => (
          <div className="row" key={tx._id}>
            <span>{tx.transactionNo}</span>
            <span>{tx.type}</span>
            <span>{formatInr(tx.amountInr)}</span>
            <span>{tx.status}</span>
            <span>{formatDate(tx.createdAt)}</span>
          </div>
        ))}
        {transactions.length === 0 && <div className="empty">No transactions found.</div>}
      </div>
    </div>
  );
}

function Settings({ users, coupons, tokens, settings, onSaved }) {
  const [token, setToken] = useState({ symbol: 'COIN', name: 'Default Coin', fixedPrice: 1, rewardPercentage: 0.2, active: true });
  const [quickSellFees, setQuickSellFees] = useState({
    processingFeePercentage: 0.5,
    burnPercentage: 1,
    paymentGatewayPercentage: 2,
  });
  const [coupon, setCoupon] = useState({ code: '', title: '', description: '', scope: 'global', tokenId: '', value: 0, startsAt: '', expiresAt: '', usageLimit: 1, mobiles: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (tokens[0]) {
      setToken({
        _id: tokens[0]._id,
        symbol: tokens[0].symbol || 'COIN',
        name: tokens[0].name || 'Default Coin',
        fixedPrice: tokens[0].fixedPrice ?? 1,
        rewardPercentage: tokens[0].rewardPercentage ?? 0,
        active: tokens[0].active !== false,
      });
    }
  }, [tokens]);

  useEffect(() => {
    if (settings?.quickSellFees) {
      setQuickSellFees(settings.quickSellFees);
    }
  }, [settings]);

  const saveToken = async (event) => {
    event.preventDefault();
    try {
      await adminApi.saveToken(token);
      setMessage('Token saved');
      onSaved();
    } catch (err) {
      setMessage(err.message || 'Unable to save token');
    }
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    try {
      await adminApi.createCoupon({
        ...coupon,
        value: Number(coupon.value),
        usageLimit: Number(coupon.usageLimit),
        tokenId: coupon.tokenId || tokens[0]?._id,
        tokenSymbol: tokens.find((item) => item._id === coupon.tokenId)?.symbol || tokens[0]?.symbol,
        mobiles: coupon.scope === 'user_specific'
          ? coupon.mobiles.split(',').map((mobile) => mobile.trim()).filter(Boolean)
          : [],
      });
      setCoupon({ code: '', title: '', description: '', scope: 'global', tokenId: '', value: 0, startsAt: '', expiresAt: '', usageLimit: 1, mobiles: '' });
      setMessage('Coupon created');
      onSaved();
    } catch (err) {
      setMessage(err.message || 'Unable to create coupon');
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      await adminApi.saveSettings({ quickSellFees });
      setMessage('Quick sell fees saved');
      onSaved();
    } catch (err) {
      setMessage(err.message || 'Unable to save quick sell fees');
    }
  };

  return (
    <div className="form-grid">
      <form className="panel form" onSubmit={saveToken}>
        <h2>Token Controls</h2>
        <Field label="Token symbol">
          <input value={token.symbol} onChange={(event) => setToken({ ...token, symbol: event.target.value })} placeholder="Symbol" />
        </Field>
        <Field label="Token name">
          <input value={token.name} onChange={(event) => setToken({ ...token, name: event.target.value })} placeholder="Name" />
        </Field>
        <Field label="Fixed price">
          <input value={token.fixedPrice} onChange={(event) => setToken({ ...token, fixedPrice: Number(event.target.value) })} type="number" placeholder="Fixed price" />
        </Field>
        <Field label="Reward percentage">
          <input value={token.rewardPercentage} onChange={(event) => setToken({ ...token, rewardPercentage: Number(event.target.value) })} type="number" placeholder="Reward %" />
        </Field>
        <button>Save Token</button>
      </form>
      <form className="panel form" onSubmit={saveSettings}>
        <h2>Quick Sell Fees</h2>
        <Field label="Processing Fee %">
          <input value={quickSellFees.processingFeePercentage} onChange={(event) => setQuickSellFees({ ...quickSellFees, processingFeePercentage: Number(event.target.value) })} type="number" step="0.01" min="0" />
        </Field>
        <Field label="Quick Sell Burn %">
          <input value={quickSellFees.burnPercentage} onChange={(event) => setQuickSellFees({ ...quickSellFees, burnPercentage: Number(event.target.value) })} type="number" step="0.01" min="0" />
        </Field>
        <Field label="Payment Gateway Charge %">
          <input value={quickSellFees.paymentGatewayPercentage} onChange={(event) => setQuickSellFees({ ...quickSellFees, paymentGatewayPercentage: Number(event.target.value) })} type="number" step="0.01" min="0" />
        </Field>
        <button>Save Fees</button>
      </form>
      <form className="panel form" onSubmit={saveCoupon}>
        <h2>Create Coupon</h2>
        <Field label="Coupon code">
          <input required value={coupon.code} onChange={(event) => setCoupon({ ...coupon, code: event.target.value })} placeholder="Code" />
        </Field>
        <Field label="Coupon title">
          <input required value={coupon.title} onChange={(event) => setCoupon({ ...coupon, title: event.target.value })} placeholder="Title" />
        </Field>
        <Field label="Description">
          <input value={coupon.description} onChange={(event) => setCoupon({ ...coupon, description: event.target.value })} placeholder="Description" />
        </Field>
        <Field label="Coupon scope">
          <select value={coupon.scope} onChange={(event) => setCoupon({ ...coupon, scope: event.target.value })}>
            <option value="global">Global - all users</option>
            <option value="user_specific">Individual users</option>
          </select>
        </Field>
        {coupon.scope === 'user_specific' && (
          <Field label="User mobile numbers">
            <input value={coupon.mobiles} onChange={(event) => setCoupon({ ...coupon, mobiles: event.target.value })} placeholder="User mobiles comma separated" />
          </Field>
        )}
        <Field label="Coupon token">
          <select value={coupon.tokenId} onChange={(event) => setCoupon({ ...coupon, tokenId: event.target.value })}>
            <option value="">Default token</option>
            {tokens.map((item) => (
              <option key={item._id} value={item._id}>{item.symbol}</option>
            ))}
          </select>
        </Field>
        <Field label="Token amount">
          <input value={coupon.value} onChange={(event) => setCoupon({ ...coupon, value: Number(event.target.value) })} type="number" placeholder="Value" />
        </Field>
        <Field label="Start time">
          <input value={coupon.startsAt} onChange={(event) => setCoupon({ ...coupon, startsAt: event.target.value })} type="datetime-local" />
        </Field>
        <Field label="Expiry date">
          <input required value={coupon.expiresAt} onChange={(event) => setCoupon({ ...coupon, expiresAt: event.target.value })} type="date" />
        </Field>
        <Field label="Usage limit">
          <input required min="1" value={coupon.usageLimit} onChange={(event) => setCoupon({ ...coupon, usageLimit: Number(event.target.value) })} type="number" placeholder="Usage limit" />
        </Field>
        <button>Create Coupon</button>
      </form>
      {message && <div className="notice">{message}</div>}
      <section className="panel full-span">
        <h2>Coupon Management</h2>
        <div className="table">
          <div className="row head"><span>Code</span><span>Scope</span><span>Value</span><span>Used</span><span>Valid till</span></div>
          {coupons.map((item) => (
            <div className="row" key={item._id}>
              <span>{item.code}</span>
              <span>{item.scope === 'user_specific' ? `Individual (${item.users?.length || 0})` : 'Global'}</span>
              <span>{item.value} {item.token?.symbol || 'TOKEN'}</span>
              <span>{item.usedCount}/{item.usageLimit}</span>
              <span>{formatDate(item.expiresAt)}</span>
            </div>
          ))}
          {coupons.length === 0 && <div className="empty">No coupons created.</div>}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(session.user);

  if (!user) return <Login onLogin={setUser} />;
  return <AdminShell user={user} onLogout={() => setUser(null)} />;
}
