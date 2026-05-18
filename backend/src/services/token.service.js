import { Token } from '../models/Token.js';
import { TokenBalance } from '../models/TokenBalance.js';

export const tokenService = {
  listActive() {
    return Token.find({ active: true }).sort({ symbol: 1 });
  },

  upsertToken(filter, payload) {
    const update = {
      name: payload.name,
      symbol: String(payload.symbol || '').toUpperCase(),
      fixedPrice: Number(payload.fixedPrice ?? 1),
      rewardPercentage: Number(payload.rewardPercentage ?? 0),
      logo: payload.logo,
      active: payload.active ?? true,
    };
    if (payload._id) {
      return Token.findByIdAndUpdate(payload._id, update, { new: true, runValidators: true });
    }
    return Token.findOneAndUpdate(filter, update, { upsert: true, new: true, runValidators: true });
  },

  async getBalance(userId, tokenId) {
    return TokenBalance.findOneAndUpdate(
      { user: userId, token: tokenId },
      { $setOnInsert: { available: 0, locked: 0, rewards: 0 } },
      { upsert: true, new: true },
    );
  },

  lockBalance(userId, tokenId, quantity, session) {
    return TokenBalance.findOneAndUpdate(
      { user: userId, token: tokenId, available: { $gte: quantity } },
      { $inc: { available: -quantity, locked: quantity } },
      { new: true, session },
    );
  },
};
