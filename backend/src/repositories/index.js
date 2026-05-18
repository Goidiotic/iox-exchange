import { AdminLog } from '../models/AdminLog.js';
import { AutoSellSettings } from '../models/AutoSellSettings.js';
import { Coupon } from '../models/Coupon.js';
import { Notification } from '../models/Notification.js';
import { Order } from '../models/Order.js';
import { Otp } from '../models/Otp.js';
import { Referral } from '../models/Referral.js';
import { Reward } from '../models/Reward.js';
import { Token } from '../models/Token.js';
import { TokenBalance } from '../models/TokenBalance.js';
import { Transaction } from '../models/Transaction.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { WalletRequest } from '../models/WalletRequest.js';
import { BaseRepository } from './base.repository.js';

export const repos = {
  users: new BaseRepository(User),
  otps: new BaseRepository(Otp),
  wallets: new BaseRepository(Wallet),
  tokens: new BaseRepository(Token),
  balances: new BaseRepository(TokenBalance),
  orders: new BaseRepository(Order),
  transactions: new BaseRepository(Transaction),
  tickets: new BaseRepository(Ticket),
  coupons: new BaseRepository(Coupon),
  referrals: new BaseRepository(Referral),
  notifications: new BaseRepository(Notification),
  rewards: new BaseRepository(Reward),
  adminLogs: new BaseRepository(AdminLog),
  autoSell: new BaseRepository(AutoSellSettings),
  walletRequests: new BaseRepository(WalletRequest),
};
