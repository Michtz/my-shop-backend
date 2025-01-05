import { Document, Schema, model } from 'mongoose';
import { Request } from 'express';

export interface CartResponse {
  success: boolean;
  data?: ICart | null;
  error?: string;
}
export interface CartCreateData {
  sessionId: string;
  userId?: string | undefined;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
  total?: number;
}

export interface ICartItem {
  productId: string;
  quantity: number;
  price: number;
}
export interface ICart extends Document {
  sessionId: string;
  userId?: string | undefined;
  items: ICartItem[];
  total: number;
  createdAt: Date;
  calculateTotal: () => number;
}

export interface CartRequest extends Request {
  params: {
    sessionId: string;
    userId?: string | undefined;
    productId: string;
    quantity?: string;
  };
  body: {
    productId: string;
    quantity?: number;
  };
}

const cartItemSchema = new Schema<ICartItem>({
  // @ts-ignore
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
});

const cartSchema = new Schema<ICart>({
  sessionId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: false,
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60,
  },
});

cartSchema.methods.calculateTotal = function (this: ICart): number {
  this.total = this.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
  return this.total;
};

cartSchema.pre('save', function (next) {
  this.calculateTotal();
  next();
});

export const Cart = model<ICart>('Cart', cartSchema);
