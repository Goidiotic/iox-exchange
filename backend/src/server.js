import http from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './configs/database.js';
import { connectRedis } from './configs/redis.js';
import { env, validateEnv } from './configs/env.js';
import { initSockets } from './sockets/index.js';
import { registerCronJobs } from './cron/index.js';
import { logger } from './utils/logger.js';

const bootstrap = async () => {
  validateEnv();
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);
  registerCronJobs();

  server.listen(env.port, () => logger.info(`Backend listening on port ${env.port}`));
};

bootstrap().catch((error) => {
  logger.error('Bootstrap failed', { error: error.message, stack: error.stack });
  process.exit(1);
});
