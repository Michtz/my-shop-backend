import { Document, Schema, model } from 'mongoose';
import { Request } from 'express';
import { IProduct } from './product.model';
import {
  addressSchema,
  paymentInfoSchema,
  IAddress,
  IPaymentInfo,
} from './user.model';

export interface CartResponse {
  success: boolean;
  data?: ICartDocument | null;
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
  productId: string | Schema.Types.ObjectId | any;
  quantity: number;
  price: number;
  product?: IProduct;
}

export interface IUserCartInfo {
  userId?: string;
  selectedAddress?: IAddress;
  selectedPayment?: IPaymentInfo;
  guestInfo?: IGuestInfo;
}

export interface IGuestInfo {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface ICart extends Document {
  sessionId: string;
  userId?: string;
  userInfo?: IUserCartInfo;
  items: ICartItem[];
  total: number;
  createdAt: Date;
  calculateTotal: () => number;
}

export interface ICartDocument extends ICart, Document {}

export interface CartRequest extends Request {
  params: {
    sessionId: string;
    userId?: string;
    productId?: string;
    quantity?: string;
    adresseId?: string;
    paymentId?: string;
  };
  body: {
    items?: {
      productId: string;
      quantity?: number;
    }[];
    userInfo?: {
      selectedAddressId?: string;
      selectedPaymentId?: string;
      guestInfo?: {
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        address: IAddress;
      };
    };
  };
}

const cartItemSchema = new Schema<ICartItem>({
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
    required: false,
    min: [0, 'Price cannot be negative'],
  },
});

const guestInfoSchema = new Schema<IGuestInfo>({
  email: {
    type: String,
    required: true,
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
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
});

const userCartInfoSchema = new Schema<IUserCartInfo>({
  userId: {
    ref: 'User',
    type: String,
    required: false,
  },
  selectedAddress: addressSchema,
  selectedPayment: paymentInfoSchema,
  guestInfo: guestInfoSchema,
});

const cartSchema = new Schema<ICartDocument>(
  {
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
    userInfo: userCartInfoSchema,
    items: [cartItemSchema],
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7 * 24 * 60 * 60, // 7 days
    },
  },
  {
    versionKey: false,
  },
);

cartSchema.methods.calculateTotal = function (this: ICartDocument): number {
  this.total = this.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
  return this.total;
};

cartSchema.pre('save', function (next) {
  this.calculateTotal();
  next();
});

cartSchema.set('toJSON', {
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

cartSchema.index({ sessionId: 1, userId: 1 });

export const Cart = model<ICartDocument>('Cart', cartSchema);
