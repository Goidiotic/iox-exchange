import { Referral } from '../models/Referral.js';

export const referralService = {
  async createReferralChain(referrer, user) {
    await Referral.create({ referrer: referrer._id, referredUser: user._id, level: 1, rebatePercentage: 1 });
    if (referrer.referredBy) {
      await Referral.create({ referrer: referrer.referredBy, referredUser: user._id, level: 2, rebatePercentage: 0.5 });
    }
  },

  stats(user) {
    return Referral.aggregate([
      { $match: { referrer: user._id } },
      { $group: { _id: '$level', count: { $sum: 1 }, earnings: { $sum: '$earningsInr' } } },
    ]);
  },

  history(user) {
    return Referral.find({ referrer: user._id }).populate('referredUser', 'mobile').sort({ createdAt: -1 });
  },
};
