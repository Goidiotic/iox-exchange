import { tokenService } from '../services/token.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const tokenController = {
  list: asyncHandler(async (_req, res) => ok(res, await tokenService.listActive())),
  balance: asyncHandler(async (req, res) => ok(res, await tokenService.getBalance(req.user._id, req.params.tokenId))),
};
