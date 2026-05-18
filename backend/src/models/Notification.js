import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['transaction', 'reward', 'coupon', 'referral', 'wallet', 'order'], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    readAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const Notification = mongoose.model('Notification', notificationSchema);
