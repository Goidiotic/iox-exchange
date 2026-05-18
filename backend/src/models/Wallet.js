import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    mobile: { type: String, required: true },
    walletId: { type: String, index: true },
    encryptedSyncKey: String,
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    connectedAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const Wallet = mongoose.model('Wallet', walletSchema);
