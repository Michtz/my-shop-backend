import { Document, Schema, model } from 'mongoose';

export interface ICartItem {
    productId: string;
    quantity: number;
    price: number;
}
export interface ICart extends Document {
    userId: string;
    items: ICartItem[];
    total: number;
    createdAt: Date;
    calculateTotal: () => number;
}

const cartItemSchema = new Schema<ICartItem>({
    // @ts-ignore
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    }
});

const cartSchema = new Schema<ICart>({
    userId: {
        type: String,
        required: true
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 7 * 24 * 60 * 60
    }
});

cartSchema.methods.calculateTotal = function(this: ICart): number {
    this.total = this.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    return this.total;
};

cartSchema.pre('save', function(next) {
    this.calculateTotal();
    next();
});

export const Cart = model<ICart>('Cart', cartSchema);