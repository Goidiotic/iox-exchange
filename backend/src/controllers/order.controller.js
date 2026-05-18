import { orderService } from '../services/order.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

export const orderController = {
  market: asyncHandler(async (req, res) => ok(res, await orderService.listMarketOrders(req.query))),
  mine: asyncHandler(async (req, res) => ok(res, await orderService.listUserOrders(req.user, req.query))),
  get: asyncHandler(async (req, res) => ok(res, await orderService.getOrder(req.user, req.params.orderId))),
  createSell: asyncHandler(async (req, res) => created(res, await orderService.createSellOrder(req.user, req.body), 'Sell order created')),
  createPurchase: asyncHandler(async (req, res) => created(res, await orderService.createPurchaseOrder(req.user, { ...req.body, orderId: req.params.orderId }), 'Purchase order created')),
  submitPayment: asyncHandler(async (req, res) => ok(res, await orderService.submitPayment(req.user, { ...req.body, orderId: req.params.orderId }), 'Payment submitted')),
  cancel: asyncHandler(async (req, res) => ok(res, await orderService.cancelOrder(req.user, req.params.orderId), 'Order cancelled')),
};
