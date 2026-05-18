import { connectDatabase } from '../configs/database.js';
import { validateEnv } from '../configs/env.js';
import { Token } from '../models/Token.js';
import { logger } from './logger.js';

const defaults = [
  { name: 'VLX Token', symbol: 'VLX', fixedPrice: 75, rewardPercentage: 2.4, logo: 'VL', active: true },
];

const run = async () => {
  validateEnv();
  await connectDatabase();
  await Promise.all(defaults.map((token) => Token.findOneAndUpdate({ symbol: token.symbol }, token, { upsert: true, new: true })));
  logger.info('Default tokens seeded');
  process.exit(0);
};

run().catch((error) => {
  logger.error('Seed failed', { error: error.message });
  process.exit(1);
});
