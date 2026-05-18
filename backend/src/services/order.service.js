import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ORDER_STATUS, ORDER_TYPES } from '../constants/orderStatus.js';
import { Order } from '../models/Order.js';
import { Token } from '../models/Token.js';
import { TokenBalance } from '../models/TokenBalance.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { m3WalletService } from './m3Wallet.service.js';
import { notificationService } from './notification.service.js';
import { platformSettingsService } from './platformSettings.service.js';

const nextNo = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const paymentAddressFor = (order) => `M3${String(order.orderNo).replace(/[^A-Z0-9]/gi, '')}${Math.round(order.inrAmount)}${Math.round(order.quantity)}9X7K4L2Q8P6N5R3T1V0Y`.slice(0, 34);
const MIN_ORDER_QUANTITY = 100;
const MAX_SELL_QUANTITY = 50000;

const calculateQuickSellFees = (grossAmount, settings) => {
  const feeSettings = settings.quickSellFees || {};
  const processingFeePercentage = Number(feeSettings.processingFeePercentage || 0);
  const burnPercentage = Number(feeSettings.burnPercentage || 0);
  const paymentGatewayPercentage = Number(feeSettings.paymentGatewayPercentage || 0);
  const processingFeeAmount = (grossAmount * processingFeePercentage) / 100;
  const burnAmount = (grossAmount * burnPercentage) / 100;
  const paymentGatewayAmount = (grossAmount * paymentGatewayPercentage) / 100;
  const totalFeeAmount = processingFeeAmount + burnAmount + paymentGatewayAmount;
  return {
    processingFeePercentage,
    processingFeeAmount,
    burnPercentage,
    burnAmount,
    paymentGatewayPercentage,
    paymentGatewayAmount,
    totalFeeAmount,
  };
};

const verifyTransactionPin = async (user, transactionPin) => {
  const account = await User.findById(user._id).select('+transactionPinHash mobile');
  if (!account) throw new ApiError(404, 'User not found');
  if (!account.transactionPinHash) {
    throw new ApiError(428, 'Transaction PIN setup required', { code: 'TRANSACTION_PIN_REQUIRED' });
  }
  const pin = String(transactionPin || '');
  const isValid = await bcrypt.compare(pin, account.transactionPinHash);
  if (!isValid) throw new ApiError(400, 'Invalid transaction PIN');
};

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

const releaseBuyReservation = async (order, reason) => {
  const parentOrder = order.parentOrder ? await Order.findById(order.parentOrder) : null;
  const quantity = Number(order.quantity || 0);
  if (!parentOrder) {
    await refundToSellerWallet(order, quantity, reason);
    return;
  }

  if (parentOrder.status === ORDER_STATUS.PENDING) {
    await Order.updateOne(
      { _id: parentOrder._id, escrowedQuantity: { $gte: quantity } },
      { $inc: { availableQuantity: quantity, escrowedQuantity: -quantity, cancelledQuantity: quantity } },
    );
    return;
  }

  if (parentOrder) {
    await Order.updateOne(
      { _id: parentOrder._id, escrowedQuantity: { $gte: quantity } },
      { $inc: { escrowedQuantity: -quantity, cancelledQuantity: quantity } },
    );
  }
  await refundToSellerWallet(order, quantity, reason);
};

export const orderService = {
  listMarketOrders(query = {}) {
    return Order.find({
      status: ORDER_STATUS.PENDING,
      type: { $in: [ORDER_TYPES.SELL, ORDER_TYPES.FAST_TRACK_SELL] },
      availableQuantity: { $gt: 0 },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      ...(query.token ? { token: query.token } : {}),
    })
      .populate('token seller', 'name symbol fixedPrice rewardPercentage uid referralCode')
      .sort({ createdAt: -1 });
  },

  listUserOrders(user) {
    return Order.find({ $or: [{ seller: user._id }, { buyer: user._id }] })
      .populate('token seller buyer parentOrder', 'name symbol fixedPrice rewardPercentage uid referralCode orderNo status availableQuantity escrowedQuantity')
      .sort({ createdAt: -1 });
  },

  listPaymentApprovals() {
    return Order.find({
      type: ORDER_TYPES.BUY,
      status: ORDER_STATUS.UNDER_REVIEW,
    })
      .populate('token seller buyer parentOrder', 'name symbol fixedPrice rewardPercentage uid referralCode mobile orderNo status availableQuantity escrowedQuantity')
      .sort({ updatedAt: -1 });
  },

  async getOrder(user, orderId) {
    const order = await Order.findById(orderId).populate('token seller buyer parentOrder', 'name symbol fixedPrice rewardPercentage uid referralCode orderNo status availableQuantity escrowedQuantity');
    if (!order) throw new ApiError(404, 'Order not found');
    const isParticipant = order.seller?._id?.equals(user._id) || order.buyer?._id?.equals(user._id);
    if (!isParticipant && order.status !== ORDER_STATUS.PENDING) throw new ApiError(403, 'Order is not available');
    return order;
  },

  async createSellOrder(user, { tokenId, quantity, mode = 'quick', transactionPin }) {
    await verifyTransactionPin(user, transactionPin);
    const token = await Token.findById(tokenId);
    if (!token || !token.active) throw new ApiError(404, 'Token not found');
    const sellQuantity = Number(quantity);
    if (sellQuantity < MIN_ORDER_QUANTITY || sellQuantity > MAX_SELL_QUANTITY) {
      throw new ApiError(400, `Sell quantity must be between ${MIN_ORDER_QUANTITY} and ${MAX_SELL_QUANTITY}`);
    }
    const balance = await TokenBalance.findOneAndUpdate(
      { user: user._id, token: tokenId, available: { $gte: sellQuantity } },
      { $inc: { available: -sellQuantity, locked: sellQuantity } },
      { new: true },
    );
    if (!balance) throw new ApiError(400, 'Insufficient token balance');
    try {
      const isQuickSell = ['quick', 'fast', 'auto'].includes(mode);
      const inrAmount = sellQuantity * token.fixedPrice;
      const settings = isQuickSell ? await platformSettingsService.get() : null;
      const feeBreakdown = isQuickSell ? calculateQuickSellFees(inrAmount, settings) : {};
      const order = await Order.create({
        orderNo: nextNo(isQuickSell ? 'QS' : 'ORD'),
        type: isQuickSell ? ORDER_TYPES.FAST_TRACK_SELL : ORDER_TYPES.SELL,
        token: tokenId,
        seller: user._id,
        quantity: sellQuantity,
        fixedPrice: token.fixedPrice,
        inrAmount,
        netInrAmount: Math.max(inrAmount - (feeBreakdown.totalFeeAmount || 0), 0),
        rewardPercentage: isQuickSell ? 0 : token.rewardPercentage,
        feeBreakdown,
        status: ORDER_STATUS.PENDING_VERIFICATION,
        availableQuantity: sellQuantity,
        escrowedQuantity: 0,
        completedQuantity: 0,
        cancelledQuantity: 0,
        expiredQuantity: 0,
        expiresAt: new Date(Date.now() + 90 * 60 * 1000),
      });
      return order.populate('token seller', 'name symbol fixedPrice rewardPercentage uid referralCode');
    } catch (error) {
      await TokenBalance.updateOne(
        { user: user._id, token: tokenId },
        { $inc: { available: sellQuantity, locked: -sellQuantity } },
      );
      throw error;
    }
  },

  async createPurchaseOrder(user, { orderId, quantity }) {
    const parentOrder = await Order.findById(orderId).populate('token seller');
    if (!parentOrder || parentOrder.status !== ORDER_STATUS.PENDING) throw new ApiError(404, 'Verified pending order not found');
    if (parentOrder.seller.equals(user._id)) throw new ApiError(400, 'Seller cannot buy own order');
    if (parentOrder.expiresAt && parentOrder.expiresAt < new Date()) throw new ApiError(400, 'Sell order expired');

    const requestedQuantity = Number(quantity);
    if (requestedQuantity < MIN_ORDER_QUANTITY) throw new ApiError(400, `Buy quantity must be at least ${MIN_ORDER_QUANTITY}`);
    if (requestedQuantity > Number(parentOrder.availableQuantity || 0)) throw new ApiError(400, 'Requested token amount is not available');
    const reservedParent = await Order.findOneAndUpdate(
      {
        _id: parentOrder._id,
        status: ORDER_STATUS.PENDING,
        availableQuantity: { $gte: requestedQuantity },
      },
      {
        $inc: {
          availableQuantity: -requestedQuantity,
          escrowedQuantity: requestedQuantity,
        },
      },
      { new: true },
    ).populate('token seller');
    if (!reservedParent) throw new ApiError(400, 'Requested token amount is not available');

    try {
      const order = await Order.create({
        orderNo: nextNo('BUY'),
        type: ORDER_TYPES.BUY,
        parentOrder: parentOrder._id,
        token: parentOrder.token._id,
        seller: parentOrder.seller._id || parentOrder.seller,
        buyer: user._id,
        quantity: requestedQuantity,
        availableQuantity: 0,
        escrowedQuantity: requestedQuantity,
        fixedPrice: parentOrder.fixedPrice,
        inrAmount: requestedQuantity * parentOrder.fixedPrice,
        rewardPercentage: parentOrder.rewardPercentage,
        status: ORDER_STATUS.AWAITING_PAYMENT,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        settlement: { paymentAddress: paymentAddressFor(parentOrder) },
      });
      await notificationService.notify(user._id, 'transaction', 'Purchase order created', 'Complete payment before the order timer expires.', { orderId: order._id });
      return order.populate('token seller buyer parentOrder', 'name symbol fixedPrice rewardPercentage uid referralCode orderNo status');
    } catch (error) {
      await Order.updateOne(
        { _id: parentOrder._id },
        { $inc: { availableQuantity: requestedQuantity, escrowedQuantity: -requestedQuantity } },
      );
      throw error;
    }
  },

  async submitPayment(user, { orderId, transactionId }) {
    const order = await Order.findOne({
      _id: orderId,
      type: ORDER_TYPES.BUY,
      buyer: user._id,
      status: ORDER_STATUS.AWAITING_PAYMENT,
    }).populate('token seller buyer parentOrder');
    if (!order) throw new ApiError(404, 'Awaiting payment purchase order not found');
    if (order.expiresAt && order.expiresAt < new Date()) throw new ApiError(400, 'Purchase order expired');

    order.status = ORDER_STATUS.UNDER_REVIEW;
    order.settlement = {
      ...order.settlement,
      m3TransactionId: transactionId,
      submittedAt: new Date(),
    };
    await order.save();
    await Transaction.create({
      transactionNo: nextNo('TXN'),
      user: user._id,
      order: order._id,
      token: order.token._id,
      type: 'buy',
      amountInr: order.inrAmount,
      tokenQuantity: order.quantity,
      status: 'pending',
      externalReference: transactionId,
    });
    await notificationService.notify(user._id, 'transaction', 'Payment submitted', 'Your payment details are waiting for admin approval.', { orderId: order._id });
    return order;
  },

  async approveSubmittedPayment(admin, orderId) {
    const order = await Order.findOne({
      _id: orderId,
      type: ORDER_TYPES.BUY,
      status: ORDER_STATUS.UNDER_REVIEW,
    }).populate('token seller buyer parentOrder');
    if (!order) throw new ApiError(404, 'Submitted payment order not found');

    const buyerId = order.buyer?._id || order.buyer;
    const sellerId = order.seller?._id || order.seller;
    const tokenId = order.token?._id || order.token;
    const now = new Date();

    const completedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: ORDER_STATUS.UNDER_REVIEW },
      {
        $set: {
          status: ORDER_STATUS.COMPLETED,
          'settlement.verifiedAt': now,
          'verification.reviewedBy': admin._id,
          'verification.reviewedAt': now,
        },
      },
      { new: true },
    ).populate('token seller buyer parentOrder', 'name symbol fixedPrice rewardPercentage uid referralCode mobile orderNo status availableQuantity escrowedQuantity');
    if (!completedOrder) throw new ApiError(409, 'Payment approval was already processed');

    const sellerDebit = await TokenBalance.updateOne(
      { user: sellerId, token: tokenId, locked: { $gte: order.quantity } },
      { $inc: { locked: -order.quantity } },
    );
    if (sellerDebit.modifiedCount === 0) {
      const balance = await TokenBalance.findOne({ user: sellerId, token: tokenId });
      throw new ApiError(409, 'Unable to complete order because seller locked balance is inconsistent', {
        code: 'SELLER_LOCKED_BALANCE_INVALID',
        debitQuantity: order.quantity,
        available: balance?.available || 0,
        locked: balance?.locked || 0,
      });
    }

    if (order.parentOrder) {
      const parent = await Order.findById(order.parentOrder);
      if (parent) {
        parent.escrowedQuantity = Math.max((parent.escrowedQuantity || 0) - order.quantity, 0);
        parent.completedQuantity = (parent.completedQuantity || 0) + order.quantity;
        if ((parent.availableQuantity || 0) <= 0 && (parent.escrowedQuantity || 0) <= 0) {
          parent.status = ORDER_STATUS.COMPLETED;
          parent.expiresAt = now;
        }
        await parent.save();
      }
    }

    await TokenBalance.findOneAndUpdate(
      { user: buyerId, token: tokenId },
      { $inc: { available: order.quantity, rewards: (order.inrAmount * order.rewardPercentage) / 100 } },
      { upsert: true, new: true },
    );

    await Transaction.updateOne({ order: order._id, type: 'buy' }, { status: 'completed' });
    await notificationService.notify(buyerId, 'transaction', 'Order completed', 'Your buy order was approved and coins were credited.', { orderId });
    await notificationService.notify(sellerId, 'transaction', 'Sell order completed', 'Buyer payment was approved by admin.', { orderId });
    return completedOrder;
  },

  async rejectSubmittedPayment(admin, orderId, reason) {
    const review = {
      reviewedBy: admin._id,
      reviewedAt: new Date(),
      rejectionReason: reason || 'Payment rejected by admin',
    };
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        type: ORDER_TYPES.BUY,
        status: ORDER_STATUS.UNDER_REVIEW,
      },
      { $set: { status: ORDER_STATUS.REJECTED, verification: review } },
      { new: true },
    ).populate('token seller buyer parentOrder');
    if (!order) throw new ApiError(404, 'Submitted payment order not found');

    await releaseBuyReservation(order, 'payment_rejected');
    order.escrowedQuantity = 0;
    order.cancelledQuantity = Number(order.cancelledQuantity || 0) + Number(order.quantity || 0);
    await order.save();

    await Transaction.updateOne({ order: order._id, type: 'buy' }, { status: 'failed' });
    await notificationService.notify(order.buyer, 'transaction', 'Payment rejected', reason || 'Your submitted payment details were rejected.', { orderId });
    return order;
  },

  async completeProcessingOrder(orderId) {
    const order = await Order.findOne({ _id: orderId, status: ORDER_STATUS.PROCESSING }).populate('token');
    if (!order) throw new ApiError(404, 'Processing order not found');
    await m3WalletService.verifyTransaction({ transactionId: order.settlement.m3TransactionId, amountInr: order.inrAmount });
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        order.status = ORDER_STATUS.COMPLETED;
        order.settlement = { ...order.settlement, verifiedAt: new Date() };
        await order.save({ session });
        const sellerDebit = await TokenBalance.updateOne(
          { user: order.seller, token: order.token._id, locked: { $gte: order.quantity } },
          { $inc: { locked: -order.quantity } },
          { session },
        );
        if (sellerDebit.modifiedCount === 0) throw new ApiError(409, 'Seller locked balance is inconsistent');
        if (order.parentOrder) {
          await Order.updateOne(
            { _id: order.parentOrder },
            { $inc: { escrowedQuantity: -order.quantity, completedQuantity: order.quantity } },
            { session },
          );
        }
        await TokenBalance.findOneAndUpdate(
          { user: order.buyer, token: order.token._id },
          { $inc: { available: order.quantity, rewards: (order.inrAmount * order.rewardPercentage) / 100 } },
          { upsert: true, session },
        );
        await Transaction.updateOne({ order: order._id, type: 'buy' }, { status: 'completed' }, { session });
      });
      await notificationService.notify(order.buyer, 'transaction', 'Order completed', 'Tokens were credited to your internal balance.', { orderId });
      return order;
    } finally {
      session.endSession();
    }
  },

  async cancelOrder(user, orderId) {
    const now = new Date();
    const order = await Order.findOne({
      _id: orderId,
      status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.PENDING_VERIFICATION] },
      $or: [{ seller: user._id }, { buyer: user._id }],
    }).populate('token');
    if (!order) throw new ApiError(404, 'Cancellable order not found');
    if (order.expiresAt && order.expiresAt <= now) throw new ApiError(400, 'Expired order cannot be cancelled manually');

    if (order.type === ORDER_TYPES.BUY && order.buyer?.equals(user._id)) {
      await releaseBuyReservation(order, 'buy_cancelled');
      order.escrowedQuantity = 0;
      order.cancelledQuantity = Number(order.cancelledQuantity || 0) + Number(order.quantity || 0);
    } else if ([ORDER_TYPES.SELL, ORDER_TYPES.FAST_TRACK_SELL].includes(order.type) && order.seller.equals(user._id)) {
      const refundQuantity = Number(order.availableQuantity || 0);
      await refundToSellerWallet(order, refundQuantity, 'sell_cancelled');
      order.cancelledQuantity += refundQuantity;
      order.availableQuantity = 0;
    } else {
      throw new ApiError(403, 'Only the buyer can cancel this buy order');
    }
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();
    return order;
  },

  async approveOrder(admin, orderId) {
    const order = await Order.findOne({ _id: orderId, status: ORDER_STATUS.PENDING_VERIFICATION });
    if (!order) throw new ApiError(404, 'Pending verification order not found');
    order.status = ORDER_STATUS.PENDING;
    order.availableQuantity = order.availableQuantity || order.quantity;
    order.expiresAt = new Date(Date.now() + 90 * 60 * 1000);
    order.verification = { reviewedBy: admin._id, reviewedAt: new Date() };
    await order.save();
    return order.populate('token seller', 'name symbol fixedPrice rewardPercentage uid referralCode');
  },

  async rejectOrder(admin, orderId, reason) {
    const order = await Order.findOne({ _id: orderId, status: ORDER_STATUS.PENDING_VERIFICATION }).populate('token seller');
    if (!order) throw new ApiError(404, 'Pending verification order not found');
    await refundToSellerWallet(order, order.quantity, 'sell_rejected');
    order.status = ORDER_STATUS.REJECTED;
    order.verification = { reviewedBy: admin._id, reviewedAt: new Date(), rejectionReason: reason };
    await order.save();
    return order;
  },
};
