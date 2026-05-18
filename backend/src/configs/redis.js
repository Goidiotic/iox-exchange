import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = env.redisUrl
  ? new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 })
  : null;

export const connectRedis = async () => {
  if (!redis) {
    logger.warn('Redis URL not configured; queues and OTP cache will use database fallbacks where available');
    return;
  }
  try {
    await redis.connect();
    logger.info('Redis connected');
  } catch (error) {
    logger.warn('Redis unavailable; continuing without Redis-backed queues/cache', { error: error.message });
  }
};
