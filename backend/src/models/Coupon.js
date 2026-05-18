import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    title: { type: String, required: true },
    description: String,
    scope: { type: String, enum: ['global', 'user_specific'], default: 'global' },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    token: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true, index: true },
    discountType: { type: String, enum: ['flat', 'percentage', 'reward'], default: 'flat' },
    value: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    redeemedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      redeemedAt: { type: Date, default: Date.now },
    }],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model('Coupon', couponSchema);
