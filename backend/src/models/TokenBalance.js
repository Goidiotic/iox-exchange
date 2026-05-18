import mongoose from 'mongoose';

const tokenBalanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true, index: true },
    available: { type: Number, default: 0, min: 0 },
    locked: { type: Number, default: 0, min: 0 },
    rewards: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

tokenBalanceSchema.index({ user: 1, token: 1 }, { unique: true });

export const TokenBalance = mongoose.model('TokenBalance', tokenBalanceSchema);
