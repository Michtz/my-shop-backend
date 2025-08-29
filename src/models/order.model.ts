import { Document, Schema, model } from 'mongoose';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ICartItem, IUserCartInfo } from './cart.model';

export interface OrderResponse {
  orderNumber?: string;
  success: boolean;
  data?: IOrder | IOrder[] | null;
  error?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  sessionId: string;
  userId?: string;
  customerInfo?: IUserCartInfo;
  items: ICartItem[];
  total: number;
  paymentIntentId: string;
  paymentMethod?: {
    last4: string;
    brand: string;
    paymentMethodId?: string;
  };
  status: 'paid' | 'completed';
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
  generateOrderNumber: () => string;
}

export interface OrderRequest extends Request {
  params: {
    orderNumber?: string;
    sessionId?: string;
    userId?: string;
  };
  body: {
    status?: 'paid' | 'completed';
    cartSnapshot?: any;
    paymentIntentId?: string;
    paymentMethodId?: string;
  };
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: false,
      index: true,
    },
    customerInfo: {
      type: Schema.Types.Mixed,
      required: false,
      default: undefined,
    },
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
          min: [1, 'Quantity cannot be less than 1'],
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Price cannot be negative'],
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentMethod: {
      last4: { type: String },
      brand: { type: String },
      paymentMethodId: { type: String },
    },
    status: {
      type: String,
      enum: ['paid', 'completed'],
      default: 'paid',
      index: true,
    },
    paidAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.methods.generateOrderNumber = function (this: IOrder): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const uuid = uuidv4().slice(0, 8).toUpperCase();
  return `ORD-${date}-${uuid}`;
};

orderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = this.generateOrderNumber();
  }
  next();
});

orderSchema.set('toJSON', {
  transform: function (doc, ret) {
    if (ret.items) {
      ret.items = ret.items.map((item: { productId: { _id: any } }) => {
        if (item.productId && typeof item.productId !== 'string') {
          return {
            ...item,
            product: item.productId,
            productId: item.productId._id,
          };
        }
        return item;
      });
    }
    return ret;
  },
});

// Compound indexes for faster lookups
orderSchema.index({ sessionId: 1, userId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
