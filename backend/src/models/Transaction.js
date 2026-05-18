import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionNo: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    token: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
    type: { type: String, enum: ['buy', 'sell', 'reward', 'referral', 'coupon', 'wallet_settlement', 'fast_track_fee'], required: true, index: true },
    amountInr: { type: Number, default: 0 },
    tokenQuantity: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'reversed'], default: 'pending', index: true },
    externalReference: { type: String, index: true },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

transactionSchema.index({ externalReference: 1, type: 1 }, { unique: true, sparse: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
