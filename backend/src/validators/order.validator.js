import { body, param, query } from 'express-validator';

export const createSellRules = [
  body('tokenId').isMongoId(),
  body('quantity').isFloat({ min: 100, max: 50000 }).withMessage('Sell quantity must be between 100 and 50000'),
  body('mode').optional().isIn(['manual', 'auto', 'fast']),
  body('transactionPin').isLength({ min: 4, max: 10 }).withMessage('Transaction PIN is required'),
];

export const buyOrderRules = [
  param('orderId').isMongoId(),
  body('transactionId').notEmpty(),
];

export const purchaseOrderRules = [
  param('orderId').isMongoId(),
  body('quantity').isFloat({ min: 100 }).withMessage('Buy quantity must be at least 100'),
];

export const orderIdRules = [param('orderId').isMongoId()];

export const marketRules = [query('token').optional().isMongoId()];
