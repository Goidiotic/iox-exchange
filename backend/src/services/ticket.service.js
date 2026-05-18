import { Ticket } from '../models/Ticket.js';
import { ApiError } from '../utils/apiError.js';
import { notificationService } from './notification.service.js';

const nextTicketNo = () => `TKT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

export const ticketService = {
  list(user, query = {}) {
    const filter = user.role === 'admin' || user.role === 'super_admin' ? {} : { user: user._id };
    if (query.status) filter.status = query.status;
    return Ticket.find(filter).sort({ lastReplyAt: -1 }).limit(Number(query.limit || 50));
  },

  async get(user, ticketId) {
    const filter = user.role === 'admin' || user.role === 'super_admin' ? { _id: ticketId } : { _id: ticketId, user: user._id };
    const ticket = await Ticket.findOne(filter);
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    return ticket;
  },

  async create(user, payload) {
    const ticket = await Ticket.create({
      ticketNo: nextTicketNo(),
      user: user._id,
      subject: payload.subject,
      category: payload.category,
      priority: payload.priority,
      messages: [{ sender: user._id, senderRole: 'user', body: payload.message, attachments: payload.attachments || [] }],
      lastReplyAt: new Date(),
    });
    await notificationService.notify(user._id, 'wallet', 'Ticket created', `${ticket.ticketNo} has been created.`, { ticketId: ticket._id });
    return ticket;
  },

  async reply(user, ticketId, payload) {
    const ticket = await this.get(user, ticketId);
    ticket.messages.push({
      sender: user._id,
      senderRole: user.role === 'admin' || user.role === 'super_admin' ? 'admin' : 'user',
      body: payload.message,
      attachments: payload.attachments || [],
    });
    ticket.status = ticket.status === 'resolved' ? 'in_review' : ticket.status;
    ticket.lastReplyAt = new Date();
    await ticket.save();
    return ticket;
  },

  async updateStatus(user, ticketId, status) {
    if (!['admin', 'super_admin'].includes(user.role)) throw new ApiError(403, 'Admin access required');
    const ticket = await Ticket.findByIdAndUpdate(ticketId, { status, lastReplyAt: new Date() }, { new: true });
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    return ticket;
  },
};
