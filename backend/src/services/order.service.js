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

const nextNo = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const paymentAddressFor = (order) => `M3${String(order.orderNo).replace(/[^A-Z0-9]/gi, '')}${Math.round(order.inrAmount)}${Math.round(order.quantity)}VLX9X7K4L2Q8P6N5R3T1V0Y`.slice(0, 34);

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

export const orderService = {
  listMarketOrders(query = {}) {
    return Order.find({
      status: ORDER_STATUS.PENDING,
      type: { $in: [ORDER_TYPES.SELL, ORDER_TYPES.FAST_TRACK_SELL] },
      availableQuantity: { $gt: 0 },
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

  async getOrder(user, orderId) {
    const order = await Order.findById(orderId).populate('token seller buyer parentOrder', 'name symbol fixedPrice rewardPercentage uid referralCode orderNo status availableQuantity escrowedQuantity');
    if (!order) throw new ApiError(404, 'Order not found');
    const isParticipant = order.seller?._id?.equals(user._id) || order.buyer?._id?.equals(user._id);
    if (!isParticipant && order.status !== ORDER_STATUS.PENDING) throw new ApiError(403, 'Order is not available');
    return order;
  },

  async createSellOrder(user, { tokenId, quantity, mode = 'auto', transactionPin }) {
    await verifyTransactionPin(user, transactionPin);
    const token = await Token.findById(tokenId);
    if (!token || !token.active) throw new ApiError(404, 'Token not found');
    const sellQuantity = Number(quantity);
    const balance = await TokenBalance.findOneAndUpdate(
      { user: user._id, token: tokenId, available: { $gte: sellQuantity } },
      { $inc: { available: -sellQuantity, locked: sellQuantity } },
      { new: true },
    );
    if (!balance) throw new ApiError(400, 'Insufficient token balance');
    try {
      const order = await Order.create({
        orderNo: nextNo(mode === 'fast' ? 'FT' : 'ORD'),
        type: mode === 'fast' ? ORDER_TYPES.FAST_TRACK_SELL : ORDER_TYPES.SELL,
        token: tokenId,
        seller: user._id,
        quantity: sellQuantity,
        fixedPrice: token.fixedPrice,
        inrAmount: sellQuantity * token.fixedPrice,
        rewardPercentage: mode === 'fast' ? 0.1 : token.rewardPercentage,
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

    order.status = ORDER_STATUS.PROCESSING;
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
    await notificationService.notify(user._id, 'transaction', 'Payment received', 'Your payment is being verified automatically.', { orderId: order._id });
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
        await TokenBalance.updateOne({ user: order.seller, token: order.token._id }, { $inc: { locked: -order.quantity } }, { session });
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
    const order = await Order.findOne({
      _id: orderId,
      status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.PENDING_VERIFICATION, ORDER_STATUS.PROCESSING] },
      $or: [{ seller: user._id }, { buyer: user._id }],
    }).populate('token');
    if (!order) throw new ApiError(404, 'Cancellable order not found');
    if (order.type === ORDER_TYPES.BUY && order.buyer?.equals(user._id)) {
      const parentOrder = await Order.findById(order.parentOrder);
      if (parentOrder && parentOrder.status === ORDER_STATUS.PENDING) {
        await Order.updateOne(
          { _id: parentOrder._id },
          { $inc: { availableQuantity: order.quantity, escrowedQuantity: -order.quantity, cancelledQuantity: order.quantity } },
        );
      } else {
        await Order.updateOne(
          { _id: order.parentOrder },
          { $inc: { escrowedQuantity: -order.quantity, cancelledQuantity: order.quantity } },
        );
        await TokenBalance.updateOne({ user: order.seller, token: order.token._id }, { $inc: { available: order.quantity, locked: -order.quantity } });
      }
    } else if (order.seller.equals(user._id)) {
      const refundQuantity = order.availableQuantity || order.quantity;
      await TokenBalance.updateOne({ user: order.seller, token: order.token._id }, { $inc: { available: refundQuantity, locked: -refundQuantity } });
      order.expiredQuantity += refundQuantity;
      order.availableQuantity = 0;
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
    await TokenBalance.updateOne(
      { user: order.seller._id || order.seller, token: order.token._id },
      { $inc: { available: order.quantity, locked: -order.quantity } },
    );
    order.status = ORDER_STATUS.REJECTED;
    order.verification = { reviewedBy: admin._id, reviewedAt: new Date(), rejectionReason: reason };
    await order.save();
    return order;
  },
};
