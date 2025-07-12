import jwt from 'jsonwebtoken';
import { type JWTPayload } from '../types/auth.js';
import { JWT_CONFIG } from '../config/constants.js';

export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_CONFIG.SECRET, { expiresIn: JWT_CONFIG.EXPIRES_IN });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_CONFIG.SECRET) as JWTPayload;
};