import { Token } from '../models/Token.js';
import { TokenBalance } from '../models/TokenBalance.js';

export const tokenService = {
  listActive() {
    return Token.find({ active: true }).sort({ symbol: 1 });
  },

  upsertToken(filter, payload) {
    return Token.findOneAndUpdate(filter, payload, { upsert: true, new: true });
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
