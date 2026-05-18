import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, index: true },
    purpose: { type: String, enum: ['registration', 'login', 'wallet', 'password_reset', 'auto_sell', 'transaction_pin'], required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    consumedAt: Date,
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model('Otp', otpSchema);
