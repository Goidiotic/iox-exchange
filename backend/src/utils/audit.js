import { AdminLog } from '../models/AdminLog.js';

export const audit = (action, entity) => async (req, _res, next) => {
  req.audit = async ({ entityId, before, after } = {}) =>
    AdminLog.create({
      actor: req.user._id,
      action,
      entity,
      entityId,
      ip: req.ip,
      before,
      after,
    });
  next();
};
