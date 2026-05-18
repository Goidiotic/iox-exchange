import { transactionService } from '../services/transaction.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const transactionController = {
  list: asyncHandler(async (req, res) => ok(res, await transactionService.list(req.user, req.query))),
};
