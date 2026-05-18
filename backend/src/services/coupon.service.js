import { Coupon } from '../models/Coupon.js';
import { Token } from '../models/Token.js';
import { TokenBalance } from '../models/TokenBalance.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

const nextNo = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const couponService = {
  listForUser(user) {
    const now = new Date();
    return Coupon.find({
      $or: [{ scope: 'global' }, { users: user._id }],
      $and: [
        {
          $or: [
            {
              active: true,
              startsAt: { $lte: now },
              expiresAt: { $gte: now },
            },
            { 'redeemedBy.user': user._id },
          ],
        },
      ],
    })
      .populate('users token', 'mobile uid name symbol fixedPrice')
      .sort({ expiresAt: 1 })
      .lean()
      .then((coupons) => coupons.map((coupon) => ({
        ...coupon,
        redeemed: coupon.redeemedBy?.some((entry) => entry.user?.toString() === user._id.toString()) || false,
      })));
  },

  async listAdmin() {
    return Coupon.find().populate('users token', 'mobile uid name symbol fixedPrice').sort({ createdAt: -1 }).limit(200);
  },

  async create(payload) {
    const code = payload.code?.trim().toUpperCase();
    if (!code) throw new ApiError(400, 'Coupon code is required');
    if (!payload.value || Number(payload.value) <= 0) throw new ApiError(400, 'Coupon token amount must be greater than zero');
    if (!payload.expiresAt || Number.isNaN(new Date(payload.expiresAt).getTime())) {
      throw new ApiError(400, 'Coupon expiry date is required');
    }
    if (payload.startsAt && Number.isNaN(new Date(payload.startsAt).getTime())) {
      throw new ApiError(400, 'Coupon start date is invalid');
    }

    let users = payload.users || payload.userIds || [];
    if (payload.mobiles?.length) {
      const normalizedMobiles = payload.mobiles.map((mobile) => String(mobile).replace(/\s+/g, ''));
      const matchedUsers = await User.find({ mobile: { $in: normalizedMobiles } }).select('_id');
      users = matchedUsers.map((user) => user._id);
    }

    const scope = payload.scope === 'user_specific' || users.length ? 'user_specific' : 'global';
    if (scope === 'user_specific' && users.length === 0) throw new ApiError(400, 'Select at least one user for individual coupon');

    let token = payload.tokenId
      ? await Token.findById(payload.tokenId)
      : payload.tokenSymbol
        ? await Token.findOne({ symbol: payload.tokenSymbol.toUpperCase(), active: true })
        : await Token.findOne({ active: true }).sort({ createdAt: 1 });
    if (!token && !payload.tokenId) {
      token = await Token.findOneAndUpdate(
        { symbol: 'COIN' },
        { name: 'Default Coin', symbol: 'COIN', fixedPrice: 1, rewardPercentage: 2.4, logo: 'CO', active: true },
        { upsert: true, new: true },
      );
    }
    if (!token) throw new ApiError(404, 'Coupon token not found');

    return Coupon.create({
      code,
      title: payload.title,
      description: payload.description,
      scope,
      users,
      token: token._id,
      discountType: 'reward',
      value: payload.value || 0,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : new Date(),
      expiresAt: new Date(payload.expiresAt),
      usageLimit: payload.usageLimit || 1,
      active: payload.active !== false,
    });
  },

  async redeem(user, couponIdOrCode) {
    const now = new Date();
    const query = couponIdOrCode.match(/^[a-f\d]{24}$/i) ? { _id: couponIdOrCode } : { code: couponIdOrCode.toUpperCase() };
    const coupon = await Coupon.findOne({
      ...query,
      active: true,
      startsAt: { $lte: now },
      expiresAt: { $gte: now },
      $or: [{ scope: 'global' }, { users: user._id }],
    }).populate('token');

    if (!coupon) throw new ApiError(404, 'Coupon not available');
    if (coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');
    if (coupon.redeemedBy.some((entry) => entry.user.equals(user._id))) throw new ApiError(400, 'Coupon already redeemed');

    const redeemedCoupon = await Coupon.findOneAndUpdate(
      {
        _id: coupon._id,
        usedCount: { $lt: coupon.usageLimit },
        'redeemedBy.user': { $ne: user._id },
      },
      {
        $inc: { usedCount: 1 },
        $push: { redeemedBy: { user: user._id, redeemedAt: new Date() } },
      },
      { new: true },
    ).populate('token');

    if (!redeemedCoupon) throw new ApiError(400, 'Coupon already redeemed or usage limit reached');

    await TokenBalance.findOneAndUpdate(
      { user: user._id, token: redeemedCoupon.token._id },
      { $inc: { available: redeemedCoupon.value } },
      { upsert: true, new: true },
    );

    await Transaction.findOneAndUpdate(
      { externalReference: `${redeemedCoupon.code}-${user._id}`, type: 'coupon' },
      {
        $setOnInsert: {
          transactionNo: nextNo('CPN'),
          user: user._id,
          token: redeemedCoupon.token._id,
          type: 'coupon',
          amountInr: 0,
          tokenQuantity: redeemedCoupon.value,
          status: 'completed',
          externalReference: `${redeemedCoupon.code}-${user._id}`,
          metadata: { couponId: redeemedCoupon._id, couponCode: redeemedCoupon.code },
        },
      },
      { upsert: true, new: true },
    );

    return redeemedCoupon;
  },
};
