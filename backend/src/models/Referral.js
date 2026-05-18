import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    level: { type: Number, enum: [1, 2], required: true },
    rebatePercentage: { type: Number, default: 0 },
    earningsInr: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

export const Referral = mongoose.model('Referral', referralSchema);
