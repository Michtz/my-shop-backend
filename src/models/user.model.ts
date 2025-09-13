import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress {
  street: string;
  houseNumber: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface IPaymentInfo {
  _id: mongoose.Types.ObjectId;
  cardType: string;
  lastFourDigits: string;
  expiryDate: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  refreshToken?: string;
  tokenVersion?: number;
  addresses: IAddress[];
  paymentInfo: IPaymentInfo[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  addresses?: IAddress[];
  paymentInfo?: IPaymentInfo[];
}

export const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  houseNumber: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: false },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

export const paymentInfoSchema = new Schema<IPaymentInfo>({
  cardType: { type: String, required: true },
  lastFourDigits: { type: String, required: true },
  expiryDate: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

export const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    refreshToken: {
      type: String,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    addresses: [addressSchema],
    paymentInfo: [paymentInfoSchema],
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>('User', userSchema);
