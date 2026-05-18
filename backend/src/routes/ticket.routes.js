import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
import { validateRequest } from '../middlewares/errorHandler.js';
import { createTicketRules, replyTicketRules, statusTicketRules } from '../validators/ticket.validator.js';

const router = Router();

router.get('/', ticketController.list);
router.post('/', createTicketRules, validateRequest, ticketController.create);
router.get('/:ticketId', ticketController.get);
router.post('/:ticketId/replies', replyTicketRules, validateRequest, ticketController.reply);
router.patch('/:ticketId/status', statusTicketRules, validateRequest, ticketController.updateStatus);

export default router;
