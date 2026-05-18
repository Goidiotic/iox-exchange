import { body } from 'express-validator';

export const walletOtpRules = [body('mobile').matches(/^[6-9]\d{9}$/)];

export const connectWalletRules = [
  body('mobile').matches(/^[6-9]\d{9}$/),
  body('platformOtp').isLength({ min: 6, max: 6 }),
  body('syncKey').notEmpty(),
  body('walletOtp').isLength({ min: 4 }),
];
