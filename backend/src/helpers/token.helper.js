import jwt from 'jsonwebtoken';
import { env } from '../configs/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpires });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), tokenVersion: user.tokenVersion }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpires });
