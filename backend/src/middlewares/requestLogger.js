import { logger } from '../utils/logger.js';

export const requestLogger = (req, _res, next) => {
  req.requestMeta = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.get('x-request-id') || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  logger.info('Incoming request', { method: req.method, url: req.originalUrl, ...req.requestMeta });
  next();
};
