import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../configs/env.js';
import { logger } from '../utils/logger.js';

let io;

export const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Socket auth token required'));
      socket.user = jwt.verify(token, env.jwtAccessSecret);
      next();
    } catch {
      next(new Error('Invalid socket auth token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.sub}`);
    socket.on('market:join', () => socket.join('market'));
    socket.on('disconnect', () => logger.info('Socket disconnected', { socketId: socket.id }));
  });

  logger.info('Socket.IO initialized');
  return io;
};

export const getSocketServer = () => io;

export const socketEvents = {
  orderUpdated: (payload) => io?.to('market').emit('order:update', payload),
  rewardUpdated: (userId, payload) => io?.to(`user:${userId}`).emit('reward:update', payload),
  walletUpdated: (userId, payload) => io?.to(`user:${userId}`).emit('wallet:update', payload),
  marketRefresh: () => io?.to('market').emit('market:refresh'),
};
