import { referralService } from '../services/referral.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const referralController = {
  stats: asyncHandler(async (req, res) => ok(res, await referralService.stats(req.user))),
  history: asyncHandler(async (req, res) => ok(res, await referralService.history(req.user))),
};
