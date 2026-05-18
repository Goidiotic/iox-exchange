import { TOKENS } from '../constants/tokens';
import { apiClient } from './apiClient';
import { useAuthStore } from '../stores/authStore';

const unwrap = (response) => response?.data ?? response;

const normalizeToken = (token = TOKENS[0]) => ({
  id: token._id || token.id,
  name: token.name,
  symbol: token.symbol,
  price: token.fixedPrice ?? token.price ?? 1,
  balance: token.balance || 0,
  rewardAmount: token.rewardAmount || 15,
  logo: token.logo || token.symbol?.slice(0, 2) || 'CO',
  color: token.color || 'from-acid to-cyanx',
});

const normalizeBalance = (token, balance) => ({
  ...normalizeToken(token),
  balance: balance?.available ?? balance?.balance ?? 0,
  locked: balance?.locked ?? 0,
  rewards: balance?.rewards ?? 0,
});

const normalizeStatus = (status = 'pending') => {
  const normalized = status.replaceAll('_', ' ');
  return normalized === 'under review' ? 'processing' : normalized;
};

const getTimeMeta = (order, status) => {
  const normalizedStatus = normalizeStatus(status);
  if (!order.expiresAt) {
    return {
      expiresAt: null,
      expiresIn: normalizedStatus === 'completed' ? 'Completed' : '0:00:00',
      expiryProgress: normalizedStatus === 'completed' ? 100 : 65,
      payTime: 15,
    };
  }
  const expiresAt = new Date(order.expiresAt);
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const totalMs = Math.max(expiresAt.getTime() - createdAt.getTime(), 1);
  const remainingMs = Math.max(expiresAt.getTime() - Date.now(), 0);
  const minutes = Math.ceil(remainingMs / 60000);
  return {
    expiresAt: order.expiresAt,
    expiresIn: remainingMs ? `${minutes}:00:00` : '0:00:00',
    expiryProgress: Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)),
    payTime: Math.max(1, Math.ceil(totalMs / 60000)),
  };
};

const normalizeOrder = (order = {}) => {
  const token = normalizeToken(order.token || TOKENS[0]);
  const type = order.type?.includes('sell') ? 'sell' : 'buy';
  const amount = order.inrAmount || order.amount || 0;
  const status = normalizeStatus(order.status);
  const authUserId = useAuthStore.getState().user?.id;
  const sellerId = order.seller?._id || order.seller?.id || order.seller;
  const buyerId = order.buyer?._id || order.buyer?.id || order.buyer;
  const isSubSell = type === 'buy' && authUserId && sellerId === authUserId && buyerId;
  const displayType = isSubSell ? 'sub-sell' : type;
  const timeMeta = getTimeMeta(order, status);
  return {
    id: order._id || order.id || order.orderNo,
    transactionId: order.settlement?.m3TransactionId || order.transactionId,
    type,
    displayType,
    isSubSell,
    sellerId,
    buyerId,
    parentOrderId: order.parentOrder?._id || order.parentOrder?.id || order.parentOrder,
    seller: order.seller?.uid || order.seller?.referralCode || order.seller?.name || order.seller || 'Verified seller',
    token,
    quantity: order.availableQuantity ?? order.quantity,
    totalQuantity: order.quantity,
    availableQuantity: order.availableQuantity ?? order.quantity,
    escrowedQuantity: order.escrowedQuantity ?? 0,
    completedQuantity: order.completedQuantity ?? 0,
    amount: (order.availableQuantity ?? order.quantity) * (order.fixedPrice || token.price || 0) || amount,
    totalAmount: amount,
    netAmount: order.netInrAmount ?? amount,
    feeBreakdown: order.feeBreakdown || {},
    rewardAmount: order.rewardAmount || Math.round((amount * (order.rewardPercentage || 0)) / 100),
    status: status === 'pending' ? 'awaiting payment' : status,
    counterparty: order.buyer?.uid || order.seller?.uid || order.buyer?.name || order.seller?.name || order.counterparty || 'M3 Wallet verification',
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : order.date || 'Today',
    ...timeMeta,
    verifyMinutes: order.verifyMinutes || 3,
    minLimit: order.minLimit || amount,
    maxLimit: order.maxLimit || amount,
    completion: order.completion || 98,
    trades: order.trades || 240,
  };
};

export const mockApi = {
  login: async (payload) => {
    const data = unwrap(await apiClient.post('/auth/login', payload));
    return { user: data.user, token: data.tokens?.accessToken, refreshToken: data.tokens?.refreshToken };
  },
  register: async (payload) => {
    const data = unwrap(await apiClient.post('/auth/register', { ...payload, referralCode: payload.referral }));
    return { mobile: data.user?.mobile || payload.mobile, otpSent: true, otp: data.otp };
  },
  verifyOtp: async (payload) => {
    const data = unwrap(await apiClient.post('/auth/verify-registration', payload));
    return { verified: true, user: data.user, token: data.tokens?.accessToken, refreshToken: data.tokens?.refreshToken };
  },
  requestPasswordReset: async (payload) => unwrap(await apiClient.post('/auth/password/forgot', payload)),
  resetPassword: async (payload) => unwrap(await apiClient.post('/auth/password/reset', payload)),
  transactionPinStatus: async () => unwrap(await apiClient.get('/auth/transaction-pin/status')),
  requestTransactionPinOtp: async () => unwrap(await apiClient.post('/auth/transaction-pin/otp')),
  setupTransactionPin: async (payload) => unwrap(await apiClient.post('/auth/transaction-pin/setup', payload)),
  dashboard: () =>
    Promise.all([apiClient.get('/tokens'), apiClient.get('/coupons')]).then(async ([tokenResponse, couponResponse]) => {
      const rawTokens = unwrap(tokenResponse);
      const tokens = await Promise.all(rawTokens.map(async (token) => {
        const balance = unwrap(await apiClient.get(`/tokens/${token._id || token.id}/balance`));
        return normalizeBalance(token, balance);
      }));
      const activeCoupons = unwrap(couponResponse);
      return {
        portfolio: tokens.reduce((sum, token) => sum + token.balance * token.price, 0),
        rewards: 0,
        referrals: 0,
        tokens: tokens.length ? tokens : TOKENS,
        activities: [],
        coupons: activeCoupons,
      };
    }),
  walletSummary: async () => {
    const rawTokens = unwrap(await apiClient.get('/tokens'));
    const tokens = await Promise.all(rawTokens.map(async (token) => {
      const balance = unwrap(await apiClient.get(`/tokens/${token._id || token.id}/balance`));
      return normalizeBalance(token, balance);
    }));
    const wallet = unwrap(await apiClient.get('/wallet/me'));
    return { tokens, wallet };
  },
  platformSettings: async () => unwrap(await apiClient.get('/settings')),
  market: async () => unwrap(await apiClient.get('/orders/market')).map(normalizeOrder),
  order: async (id) => normalizeOrder(unwrap(await apiClient.get(`/orders/${id}`))),
  userOrders: async () => unwrap(await apiClient.get('/orders/me')).map(normalizeOrder),
  createSellOrder: async (payload) => normalizeOrder(unwrap(await apiClient.post('/orders/sell', payload))),
  createPurchaseOrder: async (id, payload) => normalizeOrder(unwrap(await apiClient.post(`/orders/${id}/purchase`, payload))),
  submitPayment: async (id, payload) => normalizeOrder(unwrap(await apiClient.post(`/orders/${id}/payment`, payload))),
  cancelOrder: async (id) => normalizeOrder(unwrap(await apiClient.post(`/orders/${id}/cancel`))),
  coupons: async () => unwrap(await apiClient.get('/coupons')),
  redeemCoupon: async (id) => unwrap(await apiClient.post(`/coupons/${id}/redeem`)),
  history: async () => {
    const [transactions, orders] = await Promise.all([
      apiClient.get('/transactions'),
      apiClient.get('/orders/me'),
    ]);
    const transactionPayload = unwrap(transactions);
    const transactionRows = Array.isArray(transactionPayload) ? transactionPayload : transactionPayload.rows || [];
    const txRows = transactionRows.map((tx) => ({
      id: tx.transactionNo || tx._id,
      type: tx.type,
      token: tx.token?.symbol || tx.tokenSymbol || '-',
      amount: tx.amountInr
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tx.amountInr)
        : `${tx.tokenQuantity || 0} ${tx.token?.symbol || ''}`.trim(),
      status: tx.status,
      date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
    }));
    const orderRows = unwrap(orders).map(normalizeOrder).map((order) => ({
      id: order.id,
      type: order.displayType,
      token: order.token.symbol,
      amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(order.totalAmount || order.amount),
      status: order.status,
      date: order.date,
    }));
    return [...orderRows, ...txRows];
  },
  notifications: async () => unwrap(await apiClient.get('/notifications')),
  tickets: async () => unwrap(await apiClient.get('/tickets')),
  ticket: async (id) => unwrap(await apiClient.get(`/tickets/${id}`)),
  createTicket: async (payload) => unwrap(await apiClient.post('/tickets', payload)),
};
