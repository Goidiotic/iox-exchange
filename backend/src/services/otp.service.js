import bcrypt from 'bcrypt';
import axios from 'axios';
import { env } from '../configs/env.js';
import { Otp } from '../models/Otp.js';
import { ApiError } from '../utils/apiError.js';
import { generateNumericOtp } from '../helpers/crypto.helper.js';
import { logger } from '../utils/logger.js';

export const otpService = {
  async issue(mobile, purpose) {
    mobile = String(mobile || '').replace(/\s+/g, '');
    if (!/^\d{10}$/.test(mobile)) throw new ApiError(400, 'Mobile number must be exactly 10 digits');

    const since24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const otpCount = await Otp.countDocuments({ mobile, purpose, createdAt: { $gte: since24Hours } });
    if (otpCount >= 3) throw new ApiError(429, 'You have reached the OTP request limit. Please try again after 24 hours.');

    const otp = generateNumericOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await Otp.create({
      mobile,
      purpose,
      otpHash,
      expiresAt: new Date(Date.now() + env.otpTtlMinutes * 60 * 1000),
    });
    if (env.apiHomeKey) {
      const apiUrl = `https://apihome.in/panel/api/bulksms/?key=${encodeURIComponent(env.apiHomeKey)}&mobile=${mobile}&otp=${otp}`;
      const response = await axios.get(apiUrl);
      if (response.data?.status !== 'Success') throw new ApiError(502, 'Failed to send OTP');
    }
    logger.info('OTP issued', { mobile, purpose, otpPreview: env.nodeEnv === 'production' ? undefined : otp });
    return { mobile, purpose, expiresInMinutes: env.otpTtlMinutes, devOtp: env.nodeEnv === 'production' ? undefined : otp };
  },

  async verify(mobile, purpose, otp) {
    const record = await Otp.findOne({ mobile, purpose, consumedAt: null }).sort({ createdAt: -1 });
    if (!record || record.expiresAt < new Date()) throw new ApiError(400, 'OTP expired or not found');
    if (record.attempts >= env.otpMaxAttempts) throw new ApiError(429, 'OTP verification limit exceeded');
    record.attempts += 1;
    const valid = await bcrypt.compare(otp, record.otpHash);
    if (!valid) {
      await record.save();
      throw new ApiError(400, 'Invalid OTP');
    }
    record.consumedAt = new Date();
    await record.save();
    return true;
  },
};
