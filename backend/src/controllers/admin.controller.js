import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Transaction } from '../models/Transaction.js';
import { ORDER_STATUS, ORDER_TYPES } from '../constants/orderStatus.js';
import { tokenService } from '../services/token.service.js';
import { couponService } from '../services/coupon.service.js';
import { orderService } from '../services/order.service.js';
import { platformSettingsService } from '../services/platformSettings.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

export const adminController = {
  users: asyncHandler(async (req, res) => ok(res, await User.find(req.query).select('-passwordHash').sort({ createdAt: -1 }).limit(100))),
  upsertToken: asyncHandler(async (req, res) => ok(res, await tokenService.upsertToken({ symbol: req.body.symbol.toUpperCase() }, req.body), 'Token saved')),
  settings: asyncHandler(async (_req, res) => ok(res, await platformSettingsService.get())),
  updateSettings: asyncHandler(async (req, res) => ok(res, await platformSettingsService.update(req.body), 'Settings saved')),
  coupons: asyncHandler(async (_req, res) => ok(res, await couponService.listAdmin())),
  createCoupon: asyncHandler(async (req, res) => created(res, await couponService.create(req.body), 'Coupon created')),
  pendingOrders: asyncHandler(async (_req, res) => ok(
    res,
    await Order.find({
      status: ORDER_STATUS.PENDING_VERIFICATION,
      type: { $in: [ORDER_TYPES.SELL, ORDER_TYPES.FAST_TRACK_SELL] },
    })
      .populate('token seller', 'name symbol fixedPrice rewardPercentage mobile uid referralCode')
      .sort({ createdAt: -1 }),
  )),
  approveOrder: asyncHandler(async (req, res) => ok(res, await orderService.approveOrder(req.user, req.params.orderId), 'Order approved')),
  rejectOrder: asyncHandler(async (req, res) => ok(res, await orderService.rejectOrder(req.user, req.params.orderId, req.body.reason), 'Order rejected')),
  transactions: asyncHandler(async (_req, res) => ok(res, await Transaction.find().sort({ createdAt: -1 }).limit(100))),
};
