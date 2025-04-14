import mongoose, { Document, Schema } from 'mongoose';
import { Request } from 'express';

export interface AuthResponse {
  success: boolean;
  data?: {
    token?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  } | null;
  error?: string;
}

export interface AuthRequest extends Request {
  body: {
    email?: string;
    password?: string;
    refreshToken?: string;
    firstName?: string;
    lastName?: string;
    sessionId?: string;
    currentPassword?: string;
    newPassword?: string;
  };
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface IBlacklistedToken extends Document {
  token: string;
  createdAt: Date;
}

// Schema for blacklisted tokens
// This is used instead of a full session model for JWT implementation
const blacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 * 30, // 30 days TTL
  },
});

export const BlacklistedToken = mongoose.model<IBlacklistedToken>(
  'BlacklistedToken',
  blacklistedTokenSchema,
);
