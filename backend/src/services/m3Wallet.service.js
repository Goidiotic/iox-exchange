import axios from 'axios';
import { env } from '../configs/env.js';
import { ApiError } from '../utils/apiError.js';

const client = axios.create({
  baseURL: env.m3BaseUrl,
  timeout: 15000,
  headers: { 'x-api-key': env.m3ApiKey },
});

export const m3WalletService = {
  async verifyWallet({ mobile, syncKey, otp }) {
    if (!env.m3BaseUrl) return { walletId: `mock-${mobile}`, verified: true };
    const { data } = await client.post('/wallet/verify', { mobile, syncKey, otp });
    if (!data.verified) throw new ApiError(400, 'M3 wallet verification failed');
    return data;
  },

  async verifyTransaction({ transactionId, amountInr }) {
    if (!env.m3BaseUrl) return { verified: true, transactionId, amountInr };
    const { data } = await client.post('/transactions/verify', { transactionId, amountInr });
    if (!data.verified) throw new ApiError(400, 'M3 transaction verification failed');
    return data;
  },

  async merchantPayout({ walletId, amountInr, reference }) {
    if (!env.m3BaseUrl) return { payoutReference: `mock-payout-${reference}`, status: 'completed' };
    const { data } = await client.post('/merchant/payout', { merchantWalletId: env.m3MerchantWalletId, walletId, amountInr, reference });
    return data;
  },

  async paymentStatus(reference) {
    if (!env.m3BaseUrl) return { reference, status: 'completed' };
    const { data } = await client.get(`/payments/${reference}`);
    return data;
  },

  async walletBalance(walletId) {
    if (!env.m3BaseUrl) return { walletId, balanceInr: 1000000 };
    const { data } = await client.get(`/wallet/${walletId}/balance`);
    return data;
  },
};
