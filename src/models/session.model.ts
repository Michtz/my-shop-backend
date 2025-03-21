import mongoose, { Document, Schema } from 'mongoose';
import { Request } from 'express';

export interface SessionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ISession {
  sessionId: string;
  userId?: string;
  isAuthenticated: boolean;
  data: {
    cart?: any[];
    preferences?: any;
    lastActivity: Date;
    [key: string]: any;
  };
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionRequest extends Request {
  params: {
    sessionId?: string;
  };
  body: {
    userId?: string;
    data?: any;
    isAuthenticated?: boolean;
  };
}

export interface ISessionDocument extends ISession, Document {}

const sessionSchema = new Schema<ISessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      sparse: true,
      index: true,
    },
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {
        lastActivity: Date.now,
      },
    },
    expires: {
      type: Date,
      required: true,
      index: true,
      expires: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Session = mongoose.model<ISessionDocument>(
  'Session',
  sessionSchema,
);
