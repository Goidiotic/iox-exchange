import crypto from 'crypto';

export const generateNumericOtp = () => crypto.randomInt(100000, 999999).toString();

export const generateReferralCode = (mobile) =>
  `REF${mobile.slice(-4)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

export const generateUserUid = (mobile) =>
  `IOX${mobile.slice(-4)}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

export const generateM3WalletId = (mobile) =>
  `M3${mobile}${crypto.randomBytes(5).toString('hex').toUpperCase()}`.slice(0, 34);

export const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');
