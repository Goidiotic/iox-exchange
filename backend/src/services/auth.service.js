import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../configs/env.js';
import { User } from '../models/User.js';
import { Token } from '../models/Token.js';
import { TokenBalance } from '../models/TokenBalance.js';
import { Wallet } from '../models/Wallet.js';
import { ApiError } from '../utils/apiError.js';
import { generateM3WalletId, generateReferralCode, generateUserUid } from '../helpers/crypto.helper.js';
import { signAccessToken, signRefreshToken } from '../helpers/token.helper.js';
import { otpService } from './otp.service.js';
import { referralService } from './referral.service.js';

const publicUser = (user) => ({
  id: user._id,
  uid: user.uid,
  mobile: user.mobile,
  role: user.role,
  status: user.status,
  referralCode: user.referralCode,
  walletConnected: user.walletConnected,
  walletVerified: user.walletVerified,
  autoSellEnabled: user.autoSellEnabled,
  hasTransactionPin: Boolean(user.transactionPinHash),
});

export const authService = {
  async register({ mobile, password, referralCode }) {
    mobile = String(mobile || '').replace(/\s+/g, '');
    const existing = await User.findOne({ mobile });
    if (existing && existing.status === 'active') throw new ApiError(409, 'Mobile number already registered');
    const referredBy = referralCode ? await User.findOne({ referralCode }) : null;
    const user = existing || await User.create({
      mobile,
      passwordHash: await bcrypt.hash(password, 12),
      referralCode: generateReferralCode(mobile),
      referredBy: referredBy?._id,
      autoSellEnabled: false,
      walletConnected: false,
      walletVerified: false,
      status: 'pending_otp',
    });
    if (existing) {
      user.passwordHash = await bcrypt.hash(password, 12);
      user.referredBy = user.referredBy || referredBy?._id;
      user.status = 'pending_otp';
      await user.save();
    } else if (referredBy) {
      await referralService.createReferralChain(referredBy, user);
    }
    const otp = await otpService.issue(mobile, 'registration');
    return { user: publicUser(user), otp };
  },

  async verifyRegistration({ mobile, otp }) {
    mobile = String(mobile || '').replace(/\s+/g, '');
    await otpService.verify(mobile, 'registration', otp);
    const user = await User.findOne({ mobile });
    if (!user) throw new ApiError(404, 'User not found');
    user.status = 'active';
    user.uid = user.uid || generateUserUid(mobile);
    user.autoSellEnabled = false;
    user.walletConnected = false;
    user.walletVerified = false;
    await user.save();

    const tokens = await Token.find({ active: true });
    await Promise.all(tokens.map((token) =>
      TokenBalance.findOneAndUpdate(
        { user: user._id, token: token._id },
        { $setOnInsert: { available: 0, locked: 0, rewards: 0 } },
        { upsert: true, new: true },
      ),
    ));

    await Wallet.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          mobile,
          walletId: generateM3WalletId(mobile),
          verified: false,
          status: 'pending',
          metadata: { source: 'registration', m3Enabled: false },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return { user: publicUser(user), tokens: this.issueTokens(user) };
  },

  async login({ mobile, password, meta }) {
    const user = await User.findOne({ mobile }).select('+passwordHash +transactionPinHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, 'Invalid mobile number or password');
    if (user.status !== 'active') throw new ApiError(403, 'User is not active');
    user.loginHistory.push(meta);
    if (user.loginHistory.length > 10) user.loginHistory.shift();
    await user.save();
    return { user: publicUser(user), tokens: this.issueTokens(user) };
  },

  issueTokens(user) {
    return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
  },

  async refresh(refreshToken) {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await User.findById(payload.sub).select('+transactionPinHash');
    if (!user || user.tokenVersion !== payload.tokenVersion) throw new ApiError(401, 'Invalid refresh token');
    return { user: publicUser(user), tokens: this.issueTokens(user) };
  },

  async requestPasswordReset(mobile) {
    return otpService.issue(mobile, 'password_reset');
  },

  async resetPassword({ mobile, otp, password }) {
    await otpService.verify(mobile, 'password_reset', otp);
    await User.updateOne({ mobile }, { passwordHash: await bcrypt.hash(password, 12), $inc: { tokenVersion: 1 } });
  },

  async transactionPinStatus(user) {
    const account = await User.findById(user._id).select('+transactionPinHash');
    if (!account) throw new ApiError(404, 'User not found');
    return { hasTransactionPin: Boolean(account.transactionPinHash) };
  },

  async requestTransactionPinOtp(user) {
    return otpService.issue(user.mobile, 'transaction_pin');
  },

  async setTransactionPin(user, { otp, pin }) {
    await otpService.verify(user.mobile, 'transaction_pin', otp);
    await User.updateOne(
      { _id: user._id },
      { transactionPinHash: await bcrypt.hash(String(pin), 12) },
    );
    return { hasTransactionPin: true };
  },
};
