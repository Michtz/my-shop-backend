import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/user.model';
import { BlacklistedToken } from '../models/auth.model';
import { env } from '../config/env';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface JwtRefreshPayload {
  id: string;
  tokenVersion: number;
}

const JWT_SECRET: string = env.JWT_SECRET;
const JWT_REFRESH_SECRET: string = env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN: string =
  process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
};

export const generateRefreshToken = (payload: JwtRefreshPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as any);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtRefreshPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtRefreshPayload;
  } catch (error) {
    return null;
  }
};

export const storeRefreshToken = async (
  userId: string,
  refreshToken: string,
): Promise<boolean> => {
  try {
    await User.findByIdAndUpdate(userId, { refreshToken });
    return true;
  } catch (error) {
    return false;
  }
};

// logout
export const blacklistToken = async (token: string): Promise<boolean> => {
  try {
    await BlacklistedToken.create({ token });
    return true;
  } catch (error) {
    return false;
  }
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const blacklisted = await BlacklistedToken.findOne({ token });
    return !!blacklisted;
  } catch (error) {
    return false;
  }
};

export const generateSessionId = (): string => {
  return `sess_${crypto.randomBytes(16).toString('hex')}`;
};
