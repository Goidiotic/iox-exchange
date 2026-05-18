import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    token: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
    percentage: { type: Number, required: true },
    amountInr: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending', index: true },
    processedAt: Date,
  },
  { timestamps: true },
);

export const Reward = mongoose.model('Reward', rewardSchema);
