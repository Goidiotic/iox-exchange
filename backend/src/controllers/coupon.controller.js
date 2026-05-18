import { couponService } from '../services/coupon.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const couponController = {
  list: asyncHandler(async (req, res) => ok(res, await couponService.listForUser(req.user))),
  redeem: asyncHandler(async (req, res) => ok(res, await couponService.redeem(req.user, req.params.couponId), 'Coupon redeemed')),
};
