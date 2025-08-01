import mongoose, { Document, Schema } from 'mongoose';
import { Request } from 'express';

export interface ProductResponse {
  success: boolean;
  data?: IProductDocument | IProductDocument[] | null;
  error?: string;
}

export interface ProductFilters {
  isActive?: boolean;
  category?: string;
  [key: string]: any;
}

export interface IProduct {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  reservedQuantity: number;
  category: string;
  isActive: boolean;
  imageUrl?: string;
  lastUpdated: Date;
}

export interface ProductRequest extends Request {
  params: {
    id?: string;
  };
  body: {
    name?: string;
    description?: string;
    price?: number;
    stockQuantity?: number;
    category?: string;
    imageUrl?: string;
    data?: string;
    [key: string]: any;
  };
  file?: Express.Multer.File;
}

export interface IProductDocument extends IProduct, Document {
  availableQuantity: number; // Virtual field
}

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
      index: true, // Index for Performance
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.virtual('availableQuantity').get(function (
  this: IProductDocument,
) {
  return this.stockQuantity - this.reservedQuantity;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model<IProductDocument>(
  'Product',
  productSchema,
);
