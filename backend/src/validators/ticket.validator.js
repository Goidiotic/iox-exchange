import { body, param } from 'express-validator';

export const createTicketRules = [
  body('subject').isLength({ min: 4 }),
  body('category').isIn(['Payment', 'Wallet', 'Order', 'Rewards', 'Account', 'Other']),
  body('priority').isIn(['Low', 'Medium', 'High']),
  body('message').isLength({ min: 10 }),
];

export const replyTicketRules = [
  param('ticketId').isMongoId(),
  body('message').isLength({ min: 2 }),
];

export const statusTicketRules = [
  param('ticketId').isMongoId(),
  body('status').isIn(['open', 'in_review', 'resolved', 'closed']),
];
