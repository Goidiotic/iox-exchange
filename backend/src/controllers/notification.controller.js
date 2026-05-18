import { Notification } from '../models/Notification.js';
import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const notificationController = {
  list: asyncHandler(async (req, res) => ok(res, await notificationService.list(req.user, req.query))),
  markRead: asyncHandler(async (req, res) => ok(res, await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { readAt: new Date() }, { new: true }))),
};
