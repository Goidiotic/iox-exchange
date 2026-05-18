import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../configs/env.js';

export const securityMiddleware = [
  helmet(),
  cors({ origin: env.clientOrigin, credentials: true }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
];
