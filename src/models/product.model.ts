import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    category: string;
    isActive: boolean;
    lastUpdated: Date;
}

export interface IProductDocument extends IProduct, Document {}

// Das Schema bleibt weitgehend unverändert
const productSchema = new Schema<IProductDocument>({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    stockQuantity: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock quantity cannot be negative'],
        default: 0
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const Product = mongoose.model<IProductDocument>('Product', productSchema);