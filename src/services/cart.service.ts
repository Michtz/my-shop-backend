import { Cart } from '../models/cart.model';
import * as ProductService from './product.service';
import { ICart } from '../models/cart.model';
import mongoose from 'mongoose';

export interface CartResponse {
    success: boolean;
    data?: ICart | null;
    error?: string;
}

export const getCart = async (userId: string): Promise<CartResponse> => {
    try {
        let cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                total: 0
            });
            await cart.save();
        }

        return { success: true, data: cart };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const addToCart = async (
    userId: string,
    productId: string,
    quantity: number
): Promise<CartResponse> => {
    try {

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return { success: false, error: 'Invalid product ID' };
        }

        let cart = await Cart.findOne({ userId });
        const productResponse = await ProductService.getProductById(productId);

        if (!productResponse.success) {
            return { success: false, error: 'Product not found' };
        }

        const product = productResponse.data;

        // @ts-ignore
        if (product.stockQuantity < quantity) {
            return { success: false, error: 'Not enough stock available' };
        }

        if (!cart) {
            cart = new Cart({
                userId,
                items: [{
                    productId,
                    quantity,
                    // @ts-ignore
                    price: product.price
                }],
                // @ts-ignore
                total: product.price * quantity
            });
        } else {

            const existingItem = cart.items.find(
                item => item.productId.toString() === productId
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    productId,
                    quantity,
                    // @ts-ignore
                    price: product.price
                });
            }
        }

        await cart.save();
        return { success: true, data: cart };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};


export const updateCartItem = async (
    userId: string,
    productId: string,
    quantity: number
): Promise<CartResponse> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return { success: false, error: 'Invalid product ID' };
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return { success: false, error: 'Cart not found' };
        }

        const item = cart.items.find(item => item.productId.toString() === productId);
        if (!item) {
            return { success: false, error: 'Item not found in cart' };
        }

        const productResponse = await ProductService.getProductById(productId);
        if (!productResponse.success) {
            return { success: false, error: 'Product not found' };
        }
        // @ts-ignore
        if (productResponse.data.stockQuantity < quantity) {
            return { success: false, error: 'Not enough stock available' };
        }

        item.quantity = quantity;
        await cart.save();

        return { success: true, data: cart };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};


export const removeFromCart = async (
    userId: string,
    productId: string
): Promise<CartResponse> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return { success: false, error: 'Invalid product ID' };
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return { success: false, error: 'Cart not found' };
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();

        return { success: true, data: cart };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};