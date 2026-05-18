import { ticketService } from '../services/ticket.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

export const ticketController = {
  list: asyncHandler(async (req, res) => ok(res, await ticketService.list(req.user, req.query))),
  get: asyncHandler(async (req, res) => ok(res, await ticketService.get(req.user, req.params.ticketId))),
  create: asyncHandler(async (req, res) => created(res, await ticketService.create(req.user, req.body), 'Ticket created')),
  reply: asyncHandler(async (req, res) => ok(res, await ticketService.reply(req.user, req.params.ticketId, req.body), 'Reply added')),
  updateStatus: asyncHandler(async (req, res) => ok(res, await ticketService.updateStatus(req.user, req.params.ticketId, req.body.status), 'Ticket status updated')),
};
