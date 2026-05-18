import { User } from '../models/User.js';
import { AutoSellSettings } from '../models/AutoSellSettings.js';
import { ApiError } from '../utils/apiError.js';
import { otpService } from './otp.service.js';

export const autoSellService = {
  requestOtp(user) {
    if (!user.walletConnected || !user.walletVerified) throw new ApiError(400, 'Verified wallet required for auto sell');
    return otpService.issue(user.mobile, 'auto_sell');
  },

  async toggle(user, { enabled, otp }) {
    if (!user.walletConnected || !user.walletVerified) throw new ApiError(400, 'Verified wallet required for auto sell');
    await otpService.verify(user.mobile, 'auto_sell', otp);
    await User.updateOne({ _id: user._id }, { autoSellEnabled: enabled });
    return AutoSellSettings.findOneAndUpdate(
      { user: user._id },
      { enabled, verifiedByOtpAt: new Date(), lastToggledAt: new Date() },
      { upsert: true, new: true },
    );
  },
};
