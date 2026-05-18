import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

export const authController = {
  register: asyncHandler(async (req, res) => created(res, await authService.register(req.body), 'Registration started')),
  verifyRegistration: asyncHandler(async (req, res) => ok(res, await authService.verifyRegistration(req.body), 'Registration verified')),
  login: asyncHandler(async (req, res) => ok(res, await authService.login({ ...req.body, meta: req.requestMeta }), 'Logged in')),
  refresh: asyncHandler(async (req, res) => ok(res, await authService.refresh(req.body.refreshToken), 'Token refreshed')),
  requestPasswordReset: asyncHandler(async (req, res) => ok(res, await authService.requestPasswordReset(req.body.mobile), 'Password reset OTP sent')),
  resetPassword: asyncHandler(async (req, res) => ok(res, await authService.resetPassword(req.body), 'Password updated')),
  transactionPinStatus: asyncHandler(async (req, res) => ok(res, await authService.transactionPinStatus(req.user))),
  requestTransactionPinOtp: asyncHandler(async (req, res) => ok(res, await authService.requestTransactionPinOtp(req.user), 'Transaction PIN OTP sent')),
  setTransactionPin: asyncHandler(async (req, res) => ok(res, await authService.setTransactionPin(req.user, req.body), 'Transaction PIN created')),
};
