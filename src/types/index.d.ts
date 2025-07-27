import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
      cookies: {
        [key: string]: string;
      };
    }
  }
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
  };
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  sessionId?: string;
}

export interface UserPayload {
  id: string;
  email: string;
  role?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DatabaseConfig {
  uri: string;
  options?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
  };
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}
