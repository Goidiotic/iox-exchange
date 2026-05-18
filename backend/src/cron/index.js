import cron from 'node-cron';
import { ORDER_STATUS, ORDER_TYPES } from '../constants/orderStatus.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Reward } from '../models/Reward.js';
import { TokenBalance } from '../models/TokenBalance.js';
import { Transaction } from '../models/Transaction.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';
import { socketEvents } from '../sockets/index.js';

const EXPIRY_GRACE_MS = 60 * 1000;
const nextNo = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const createRefundTransaction = (order, quantity, reason) => Transaction.findOneAndUpdate(
  { externalReference: `REF-${order._id}-${reason}`, type: 'refund' },
  {
    $setOnInsert: {
      transactionNo: nextNo('REF'),
      user: order.seller?._id || order.seller,
      order: order._id,
      token: order.token?._id || order.token,
      type: 'refund',
      amountInr: quantity * (order.fixedPrice || 0),
      tokenQuantity: quantity,
      status: 'completed',
      externalReference: `REF-${order._id}-${reason}`,
      metadata: { reason },
    },
  },
  { upsert: true, new: true },
);

const refundToSellerWallet = async (order, quantity, reason) => {
  const refundQuantity = Number(quantity || 0);
  if (refundQuantity <= 0) return;
  const sellerId = order.seller?._id || order.seller;
  const tokenId = order.token?._id || order.token;
  const result = await TokenBalance.updateOne(
    {
      user: sellerId,
      token: tokenId,
      locked: { $gte: refundQuantity },
    },
    { $inc: { available: refundQuantity, locked: -refundQuantity } },
  );
  if (result.modifiedCount === 0) {
    const balance = await TokenBalance.findOne({ user: sellerId, token: tokenId });
    throw new ApiError(409, 'Unable to refund seller wallet balance', {
      code: 'SELLER_REFUND_FAILED',
      refundQuantity,
      available: balance?.available || 0,
      locked: balance?.locked || 0,
    });
  }
  await createRefundTransaction(order, refundQuantity, reason);
};

export const registerCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    const expiredBuyOrders = await Order.find({
      status: ORDER_STATUS.AWAITING_PAYMENT,
      type: ORDER_TYPES.BUY,
      expiresAt: { $lt: new Date(Date.now() - EXPIRY_GRACE_MS) },
    }).populate('token').limit(100);

    await Promise.all(expiredBuyOrders.map(async (order) => {
      const parentOrder = await Order.findById(order.parentOrder);
      if (parentOrder && parentOrder.status === ORDER_STATUS.PENDING) {
        await Order.updateOne(
          { _id: parentOrder._id, escrowedQuantity: { $gte: order.quantity } },
          { $inc: { availableQuantity: order.quantity, escrowedQuantity: -order.quantity, cancelledQuantity: order.quantity } },
        );
      } else {
        await Order.updateOne(
          { _id: order.parentOrder, escrowedQuantity: { $gte: order.quantity } },
          { $inc: { escrowedQuantity: -order.quantity, cancelledQuantity: order.quantity } },
        );
        await refundToSellerWallet(order, order.quantity, 'buy_expired');
      }
      order.status = ORDER_STATUS.EXPIRED;
      await order.save();
    }));

    if (expiredBuyOrders.length) socketEvents.marketRefresh();
    logger.info('Expired buy order cancellation completed', { cancelled: expiredBuyOrders.length });
  });

  cron.schedule('*/5 * * * *', async () => {
    const expiredSellOrders = await Order.find({
      status: ORDER_STATUS.PENDING,
      type: { $in: [ORDER_TYPES.SELL, ORDER_TYPES.FAST_TRACK_SELL] },
      expiresAt: { $lt: new Date(Date.now() - EXPIRY_GRACE_MS) },
    }).limit(100);

    await Promise.all(expiredSellOrders.map(async (order) => {
      const refundQuantity = Number(order.availableQuantity || 0);
      await refundToSellerWallet(order, refundQuantity, 'sell_expired');
      order.expiredQuantity += refundQuantity;
      order.availableQuantity = 0;
      order.status = ORDER_STATUS.EXPIRED;
      await order.save();
    }));

    if (expiredSellOrders.length) socketEvents.marketRefresh();
    logger.info('Expired order cleanup completed', { modified: expiredSellOrders.length });
  });

  cron.schedule('0 * * * *', async () => {
    const result = await Coupon.updateMany({ active: true, expiresAt: { $lt: new Date() } }, { active: false });
    logger.info('Coupon expiry job completed', { modified: result.modifiedCount });
  });

  cron.schedule('*/10 * * * *', async () => {
    const pendingRewards = await Reward.find({ status: 'pending' }).limit(100);
    await Promise.all(pendingRewards.map((reward) => Reward.updateOne({ _id: reward._id }, { status: 'processed', processedAt: new Date() })));
    logger.info('Reward processing job completed', { processed: pendingRewards.length });
  });

  cron.schedule('30 * * * *', async () => {
    const staleOrders = await Order.find({
      status: ORDER_STATUS.PENDING_VERIFICATION,
      type: { $in: [ORDER_TYPES.SELL, ORDER_TYPES.FAST_TRACK_SELL] },
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).limit(100);

    await Promise.all(staleOrders.map(async (order) => {
      await refundToSellerWallet(order, order.quantity, 'sell_verification_expired');
      order.status = ORDER_STATUS.EXPIRED;
      order.expiredQuantity = order.quantity;
      order.availableQuantity = 0;
      await order.save();
    }));
    logger.info('Pending verification cleanup completed', { expired: staleOrders.length });
  });
};
