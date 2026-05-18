import { body } from 'express-validator';

export const registerRules = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian mobile number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('referralCode').optional().isString(),
];

export const loginRules = [
  body('mobile').matches(/^[6-9]\d{9}$/),
  body('password').notEmpty(),
];

export const otpRules = [
  body('mobile').matches(/^[6-9]\d{9}$/),
  body('otp').isLength({ min: 6, max: 6 }),
];

export const transactionPinRules = [
  body('otp').isLength({ min: 6, max: 6 }),
  body('pin').matches(/^\d{4,6}$/).withMessage('Transaction PIN must be 4 to 6 digits'),
];
