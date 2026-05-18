import mongoose from 'mongoose';

const walletRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedMobile: String,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true },
);

export const WalletRequest = mongoose.model('WalletRequest', walletRequestSchema);
