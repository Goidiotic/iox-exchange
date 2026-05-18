import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tokenRoutes from './token.routes.js';
import orderRoutes from './order.routes.js';
import walletRoutes from './wallet.routes.js';
import adminRoutes from './admin.routes.js';
import ticketRoutes from './ticket.routes.js';
import { authenticate } from '../middlewares/auth.js';
import { couponController } from '../controllers/coupon.controller.js';
import { referralController } from '../controllers/referral.controller.js';
import { transactionController } from '../controllers/transaction.controller.js';
import { notificationController } from '../controllers/notification.controller.js';
import { autoSellController } from '../controllers/autoSell.controller.js';

const router = Router();

router.use('/auth', authRoutes);
router.use(authenticate);
router.use('/tokens', tokenRoutes);
router.use('/orders', orderRoutes);
router.use('/wallet', walletRoutes);
router.use('/tickets', ticketRoutes);
router.get('/coupons', couponController.list);
router.post('/coupons/:couponId/redeem', couponController.redeem);
router.get('/referrals/stats', referralController.stats);
router.get('/referrals/history', referralController.history);
router.get('/transactions', transactionController.list);
router.get('/notifications', notificationController.list);
router.patch('/notifications/:id/read', notificationController.markRead);
router.post('/auto-sell/otp', autoSellController.requestOtp);
router.patch('/auto-sell', autoSellController.toggle);
router.use('/admin', adminRoutes);

export default router;
