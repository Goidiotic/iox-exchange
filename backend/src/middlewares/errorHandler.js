import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, 'Validation failed', errors.array()));
  }
  next();
};

export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) logger.error(error.message, { stack: error.stack });
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    details: error.details || null,
  });
};
