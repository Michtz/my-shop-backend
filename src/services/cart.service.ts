import { Cart, CartCreateData, CartResponse } from '../models/cart.model';
import mongoose from 'mongoose';
import { Product } from '../models/product.model';

export const createCart = async (
  data: CartCreateData,
): Promise<CartResponse> => {
  try {
    const existingCart = await Cart.findOne({
      $or: [{ sessionId: data.sessionId }, { userId: data.userId }],
    });

    if (existingCart) {
      const populatedCart = await existingCart.populate('items.productId');

      return {
        success: false,
        error: 'Cart already exists for this session/user',
        data: populatedCart,
      };
    }

    const cart = new Cart({
      sessionId: data.sessionId,
      userId: data.userId,
      items: data.items || [],
      total: data.total || 0,
    });
    await cart.save();
    const populatedCart = await cart.populate('items.productId');

    return { success: true, data: populatedCart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getCart = async (
  sessionId: string,
  userId?: string,
): Promise<CartResponse> => {
  try {
    let cart = await Cart.findOne({
      sessionId,
    }).populate('items.productId');

    if (!cart) {
      return {
        success: false,
        error: 'Cart not found',
        data: null,
      };
    }

    console.log('Cart Data:', JSON.stringify(cart, null, 2));
    return { success: true, data: cart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const addToCart = async (
  sessionId: string,
  userId: string | undefined,
  productId: string,
  quantity: number,
): Promise<CartResponse> => {
  try {
    let cart = await Cart.findOne({ sessionId });
    const product = await Product.findById(productId);
    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    if (cart) {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId,
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({
          productId,
          quantity,
          price: product.price,
        });
      }

      cart.calculateTotal();
      await cart.save();
    } else {
      cart = new Cart({
        sessionId,
        userId,
        items: [
          {
            productId,
            quantity,
            price: product.price,
          },
        ],
      });

      await cart.save();
    }

    const populatedCart = await cart.populate('items.productId');
    return {
      success: true,
      data: populatedCart,
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const removeFromCart = async (
  sessionId: string,
  productId: string,
): Promise<CartResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { success: false, error: 'Invalid product ID' };
    }

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    await cart.save();
    const populatedCart = await cart.populate('items.productId');

    return { success: true, data: populatedCart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
export const updateCartItem = async (
  sessionId: string,
  productId: string,
  quantity: number,
): Promise<CartResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { success: false, error: 'Invalid product ID' };
    }

    const cart = await Cart.findOne({ sessionId: sessionId });
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId,
    );
    if (!item) {
      return { success: false, error: 'Item not found in cart' };
    }

    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.stockQuantity < quantity) {
      return { success: false, error: 'Not enough stock available' };
    }

    item.quantity = quantity;
    item.price = product.price;
    await cart.save();
    const populatedCart = await cart.populate('items.productId');

    return { success: true, data: populatedCart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
