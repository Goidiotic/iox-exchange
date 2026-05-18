import compression from 'compression';
import express from 'express';
import { env } from './configs/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { securityMiddleware } from './middlewares/security.js';
import routes from './routes/index.js';

export const createApp = () => {
  const app = express();
  app.use(securityMiddleware);
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.get('/health', (_req, res) => res.json({ success: true, service: 'iox-exchange-backend' }));
  app.use(env.apiPrefix, routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};
