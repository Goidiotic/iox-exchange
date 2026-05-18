import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/errorHandler.js';
import { loginRules, otpRules, registerRules, transactionPinRules } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerRules, validateRequest, authController.register);
router.post('/verify-registration', otpRules, validateRequest, authController.verifyRegistration);
router.post('/login', loginRules, validateRequest, authController.login);
router.post('/refresh', authController.refresh);
router.post('/password/forgot', authController.requestPasswordReset);
router.post('/password/reset', authController.resetPassword);
router.get('/transaction-pin/status', authenticate, authController.transactionPinStatus);
router.post('/transaction-pin/otp', authenticate, authController.requestTransactionPinOtp);
router.post('/transaction-pin/setup', authenticate, transactionPinRules, validateRequest, authController.setTransactionPin);

export default router;
