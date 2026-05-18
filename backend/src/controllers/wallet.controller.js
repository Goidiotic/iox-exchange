import { walletService } from '../services/wallet.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

export const walletController = {
  requestOtp: asyncHandler(async (req, res) => ok(res, await walletService.requestPlatformOtp(req.user, req.body.mobile), 'Wallet OTP sent')),
  connect: asyncHandler(async (req, res) => created(res, await walletService.connect({ user: req.user, ...req.body }), 'Wallet connected')),
  me: asyncHandler(async (req, res) => ok(res, await walletService.getWallet(req.user))),
  extraRequest: asyncHandler(async (req, res) => created(res, await walletService.requestExtraWallet(req.user, req.body), 'Wallet approval request created')),
};
