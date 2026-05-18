import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    ip: String,
    userAgent: String,
    loggedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, unique: true, index: true },
    uid: { type: String, unique: true, sparse: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    transactionPinHash: { type: String, select: false },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    kycStatus: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
    autoSellEnabled: { type: Boolean, default: false },
    walletConnected: { type: Boolean, default: false },
    walletVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'blocked', 'pending_otp'], default: 'pending_otp', index: true },
    loginHistory: [loginHistorySchema],
    notificationPreferences: {
      transactions: { type: Boolean, default: true },
      rewards: { type: Boolean, default: true },
      coupons: { type: Boolean, default: true },
      referrals: { type: Boolean, default: true },
      wallet: { type: Boolean, default: true },
    },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
