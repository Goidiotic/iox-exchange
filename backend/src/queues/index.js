import { redis } from '../configs/redis.js';
import { logger } from '../utils/logger.js';

export const queue = {
  async publish(name, payload) {
    if (!redis) {
      logger.info('Queue publish skipped; Redis not configured', { name, payload });
      return;
    }
    await redis.lpush(`queue:${name}`, JSON.stringify({ payload, queuedAt: new Date() }));
  },

  async consume(name, handler) {
    if (!redis) return;
    const item = await redis.rpop(`queue:${name}`);
    if (item) await handler(JSON.parse(item).payload);
  },
};
