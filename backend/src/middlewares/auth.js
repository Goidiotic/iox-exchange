import jwt from 'jsonwebtoken';
import { env } from '../configs/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

export const authenticate = async (req, _res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Authentication token required');
    const payload = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user || user.status !== 'active') throw new ApiError(401, 'Invalid or inactive user');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid authentication token'));
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Insufficient permissions'));
  next();
};
