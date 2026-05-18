import { PlatformSettings } from '../models/PlatformSettings.js';

const defaults = {
  quickSellFees: {
    processingFeePercentage: 0.5,
    burnPercentage: 1,
    paymentGatewayPercentage: 2,
  },
};

export const platformSettingsService = {
  get() {
    return PlatformSettings.findOneAndUpdate(
      { key: 'platform' },
      { $setOnInsert: { key: 'platform', ...defaults } },
      { upsert: true, new: true },
    );
  },

  async update(payload) {
    const quickSellFees = payload.quickSellFees || payload;
    return PlatformSettings.findOneAndUpdate(
      { key: 'platform' },
      {
        $set: {
          key: 'platform',
          'quickSellFees.processingFeePercentage': Number(quickSellFees.processingFeePercentage ?? defaults.quickSellFees.processingFeePercentage),
          'quickSellFees.burnPercentage': Number(quickSellFees.burnPercentage ?? defaults.quickSellFees.burnPercentage),
          'quickSellFees.paymentGatewayPercentage': Number(quickSellFees.paymentGatewayPercentage ?? defaults.quickSellFees.paymentGatewayPercentage),
        },
      },
      { upsert: true, new: true },
    );
  },
};
