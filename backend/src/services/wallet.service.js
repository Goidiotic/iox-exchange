import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { WalletRequest } from '../models/WalletRequest.js';
import { ApiError } from '../utils/apiError.js';
import { otpService } from './otp.service.js';
import { m3WalletService } from './m3Wallet.service.js';

export const walletService = {
  requestPlatformOtp(user, mobile) {
    return otpService.issue(mobile || user.mobile, 'wallet');
  },

  async connect({ user, mobile, platformOtp, syncKey, walletOtp }) {
    const existing = await Wallet.findOne({ user: user._id });
    if (existing?.verified) throw new ApiError(409, 'Only one wallet is allowed and connected wallets cannot be removed');
    await otpService.verify(mobile, 'wallet', platformOtp);
    const verified = await m3WalletService.verifyWallet({ mobile, syncKey, otp: walletOtp });
    const wallet = await Wallet.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        mobile,
        walletId: verified.walletId,
        encryptedSyncKey: syncKey,
        verified: true,
        status: 'active',
        connectedAt: new Date(),
        metadata: verified,
      },
      { upsert: true, new: true },
    );
    await User.updateOne({ _id: user._id }, { walletConnected: true, walletVerified: true });
    return wallet;
  },

  getWallet(user) {
    return Wallet.findOne({ user: user._id });
  },

  requestExtraWallet(user, payload) {
    return WalletRequest.create({ user: user._id, ...payload });
  },
};
