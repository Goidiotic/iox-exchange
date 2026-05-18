import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authorize } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/errorHandler.js';
import { orderDecisionRules, tokenRules } from '../validators/admin.validator.js';

const router = Router();

router.use(authorize('admin', 'super_admin'));
router.get('/users', adminController.users);
router.get('/settings', adminController.settings);
router.patch('/settings', adminController.updateSettings);
router.post('/tokens', tokenRules, validateRequest, adminController.upsertToken);
router.get('/coupons', adminController.coupons);
router.post('/coupons', adminController.createCoupon);
router.get('/orders/pending-verification', adminController.pendingOrders);
router.get('/orders/payment-approvals', adminController.paymentApprovals);
router.patch('/orders/:orderId/approve', orderDecisionRules, validateRequest, adminController.approveOrder);
router.patch('/orders/:orderId/reject', orderDecisionRules, validateRequest, adminController.rejectOrder);
router.patch('/orders/:orderId/payment/approve', orderDecisionRules, validateRequest, adminController.approvePayment);
router.patch('/orders/:orderId/payment/reject', orderDecisionRules, validateRequest, adminController.rejectPayment);
router.get('/transactions', adminController.transactions);

export default router;
