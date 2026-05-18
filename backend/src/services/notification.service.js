import { Notification } from '../models/Notification.js';
import { getSocketServer } from '../sockets/index.js';

export const notificationService = {
  async notify(user, type, title, body, metadata = {}) {
    const notification = await Notification.create({ user, type, title, body, metadata });
    getSocketServer()?.to(`user:${user}`).emit('notification:new', notification);
    return notification;
  },

  list(user, query = {}) {
    return Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(Number(query.limit || 50));
  },
};
