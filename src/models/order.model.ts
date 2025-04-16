import mongoose, { Document, Schema } from 'mongoose';
import { Request } from 'express';
import {
  userSchema,
  paymentInfoSchema,
  IAddress,
  IPaymentInfo,
} from './user.model';

export interface OrderResponse {
  success: boolean;
  data?: IOrder | IOrder[] | null;
  error?: string;
}

export interface OrderRequest extends Request {
  params: {
    sessionId?: string;
    orderId?: string;
  };
  body: {
    cartId?: string;
    status?: Status;
    shippingDetails?: IShippingAddress;
    orderType?: 'guest' | 'user';
    guestInfo?: IGuestOrderInfo;
    shippingAddressId?: string;
    billingAddressId?: string;
    paymentMethodId?: string;
    notes?: string;
  };
}

export type Status =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | undefined;

export interface IShippingAddress extends IAddress {}

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IGuestOrderInfo {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address: IShippingAddress;
  consentToMarketing?: boolean;
}

export interface IOrder extends Document {
  orderNumber: string;
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  guestInfo?: IGuestOrderInfo;
  items: IOrderItem[];
  totalAmount: number;
  shippingCost: number;
  tax: number;
  grandTotal: number;
  shippingAddress: IShippingAddress;
  billingAddress?: IShippingAddress;
  paymentInfo: IPaymentInfo;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  calculateTotal: () => void;
  updateStatus: (newStatus: string) => Promise<void>;
}

const guestOrderInfoSchema = new Schema<IGuestOrderInfo>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v: string) {
        return /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Please enter a valid email address',
    },
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  address: userSchema,
  consentToMarketing: {
    type: Boolean,
    default: false,
  },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    guestInfo: guestOrderInfoSchema,
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Price cannot be negative'],
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: [0, 'Grand total cannot be negative'],
    },
    shippingAddress: userSchema,
    billingAddress: userSchema,
    paymentInfo: paymentInfoSchema,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.methods.calculateTotal = function (this: IOrder): void {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  this.grandTotal = this.totalAmount + this.shippingCost + this.tax;
};

orderSchema.methods.updateStatus = async function (
  this: IOrder,
  newStatus: string,
): Promise<void> {
  if (this.status !== newStatus) {
    // @ts-ignore
    this.status = newStatus;
    await this.save();
  }
};

orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;

    this.calculateTotal();
  }
  next();
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ 'guestInfo.email': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ sessionId: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
