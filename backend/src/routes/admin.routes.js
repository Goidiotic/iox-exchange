import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authorize } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/errorHandler.js';
import { orderDecisionRules, tokenRules } from '../validators/admin.validator.js';

const router = Router();

router.use(authorize('admin', 'super_admin'));
router.get('/users', adminController.users);
router.post('/tokens', tokenRules, validateRequest, adminController.upsertToken);
router.get('/coupons', adminController.coupons);
router.post('/coupons', adminController.createCoupon);
router.get('/orders/pending-verification', adminController.pendingOrders);
router.patch('/orders/:orderId/approve', orderDecisionRules, validateRequest, adminController.approveOrder);
router.patch('/orders/:orderId/reject', orderDecisionRules, validateRequest, adminController.rejectOrder);
router.get('/transactions', adminController.transactions);

export default router;
