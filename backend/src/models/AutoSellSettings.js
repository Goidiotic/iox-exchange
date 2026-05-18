import mongoose from 'mongoose';

const autoSellSettingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    verifiedByOtpAt: Date,
    lastToggledAt: Date,
  },
  { timestamps: true },
);

export const AutoSellSettings = mongoose.model('AutoSellSettings', autoSellSettingsSchema);
