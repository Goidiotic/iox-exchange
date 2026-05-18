import mongoose from 'mongoose';
import { ORDER_STATUS, ORDER_TYPES } from '../constants/orderStatus.js';

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: Object.values(ORDER_TYPES), required: true, index: true },
    parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    token: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    quantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, default: 0, min: 0 },
    escrowedQuantity: { type: Number, default: 0, min: 0 },
    completedQuantity: { type: Number, default: 0, min: 0 },
    cancelledQuantity: { type: Number, default: 0, min: 0 },
    expiredQuantity: { type: Number, default: 0, min: 0 },
    fixedPrice: { type: Number, required: true, min: 0 },
    inrAmount: { type: Number, required: true, min: 0 },
    netInrAmount: { type: Number, default: 0, min: 0 },
    rewardPercentage: { type: Number, default: 0 },
    feeBreakdown: {
      processingFeePercentage: { type: Number, default: 0 },
      processingFeeAmount: { type: Number, default: 0 },
      burnPercentage: { type: Number, default: 0 },
      burnAmount: { type: Number, default: 0 },
      paymentGatewayPercentage: { type: Number, default: 0 },
      paymentGatewayAmount: { type: Number, default: 0 },
      totalFeeAmount: { type: Number, default: 0 },
    },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING_VERIFICATION, index: true },
    verification: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      rejectionReason: String,
    },
    expiresAt: { type: Date, index: true },
    settlement: {
      m3TransactionId: String,
      screenshotUrl: String,
      paymentAddress: String,
      submittedAt: Date,
      verifiedAt: Date,
      payoutReference: String,
    },
  },
  { timestamps: true },
);

orderSchema.index({ status: 1, token: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
