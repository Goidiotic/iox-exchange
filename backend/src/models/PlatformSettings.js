import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'platform', unique: true, index: true },
    quickSellFees: {
      processingFeePercentage: { type: Number, default: 0.5, min: 0 },
      burnPercentage: { type: Number, default: 1, min: 0 },
      paymentGatewayPercentage: { type: Number, default: 2, min: 0 },
    },
  },
  { timestamps: true },
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
