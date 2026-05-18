import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller.js';
import { validateRequest } from '../middlewares/errorHandler.js';
import { connectWalletRules, walletOtpRules } from '../validators/wallet.validator.js';

const router = Router();

router.get('/me', walletController.me);
router.post('/otp', walletOtpRules, validateRequest, walletController.requestOtp);
router.post('/connect', connectWalletRules, validateRequest, walletController.connect);
router.post('/extra-request', walletController.extraRequest);

export default router;
