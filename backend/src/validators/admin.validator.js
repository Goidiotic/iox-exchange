import { body, param } from 'express-validator';

export const tokenRules = [
  body('name').notEmpty(),
  body('symbol').notEmpty(),
  body('fixedPrice').isFloat({ min: 0 }),
  body('rewardPercentage').isFloat({ min: 0 }),
];

export const orderDecisionRules = [
  param('orderId').isMongoId(),
  body('reason').optional().isString(),
];
