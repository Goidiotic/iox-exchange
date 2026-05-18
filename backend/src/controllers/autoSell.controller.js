import { autoSellService } from '../services/autoSell.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const autoSellController = {
  requestOtp: asyncHandler(async (req, res) => ok(res, await autoSellService.requestOtp(req.user), 'Auto sell OTP sent')),
  toggle: asyncHandler(async (req, res) => ok(res, await autoSellService.toggle(req.user, req.body), 'Auto sell updated')),
};
