import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5174',
  mongoUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  apiHomeKey: process.env.APIHOME_KEY,
  m3BaseUrl: process.env.M3_BASE_URL,
  m3ApiKey: process.env.M3_API_KEY,
  m3MerchantWalletId: process.env.M3_MERCHANT_WALLET_ID,
  walletSyncEncryptionKey: process.env.WALLET_SYNC_ENCRYPTION_KEY,
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'no-reply@example.com',
  },
};

export const validateEnv = () => {
  const required = ['mongoUri', 'jwtAccessSecret', 'jwtRefreshSecret'];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
