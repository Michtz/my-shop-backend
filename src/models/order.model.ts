import mongoose, { Document, Schema } from 'mongoose';
import { Request } from 'express';

export interface OrderResponse {
  success: boolean;
  data?: IOrder | IOrder[] | null;
  error?: string;
}

export interface ShippingDetails {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface IShippingAddress {
  street: string;
  city: string;
  zipCode: string;
  country: string;
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
  };
}

export type Status =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | undefined;

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: IShippingAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  calculateTotal: () => void;
  updateStatus: (newStatus: string) => Promise<void>;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    shippingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
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

orderSchema.index({ userId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
