import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { validateRequest } from '../middlewares/errorHandler.js';
import { buyOrderRules, createSellRules, marketRules, orderIdRules, purchaseOrderRules } from '../validators/order.validator.js';

const router = Router();

router.get('/market', marketRules, validateRequest, orderController.market);
router.get('/me', orderController.mine);
router.get('/:orderId', orderIdRules, validateRequest, orderController.get);
router.post('/sell', createSellRules, validateRequest, orderController.createSell);
router.post('/:orderId/purchase', purchaseOrderRules, validateRequest, orderController.createPurchase);
router.post('/:orderId/payment', buyOrderRules, validateRequest, orderController.submitPayment);
router.post('/:orderId/cancel', orderIdRules, validateRequest, orderController.cancel);

export default router;
