import mongoose, { Document, Schema } from 'mongoose';
import { Request } from 'express';
import { IAddress, IPaymentInfo } from './user.model';

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
      phoneNumber?: string;
      addresses?: IAddress[];
      paymentInfo?: IPaymentInfo[];
      role: string;
    };
  } | null;
  error?: string;
  token?: string;
  sessionId?: string;
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
    userInfo?: any;
    credential?: string;
  };
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  sessionId?: string;
  cookies: {
    [key: string]: string;
  };
  headers: {
    [key: string]: string | string[] | undefined;
  };
}

export interface IBlacklistedToken extends Document {
  token: string;
  createdAt: Date;
}

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
