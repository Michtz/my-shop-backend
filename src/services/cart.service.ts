import { Cart, CartCreateData, CartResponse } from '../models/cart.model';
import * as ProductService from './product.service';
import mongoose from 'mongoose';
import { ISession, Session, SessionResponse } from '../models/session.model';

export const createCart = async (
  data: CartCreateData,
): Promise<CartResponse> => {
  try {
    const existingCart = await Cart.findOne({
      $or: [{ sessionId: data.sessionId }, { userId: data.userId }],
    });

    if (existingCart) {
      return {
        success: false,
        error: 'Cart already exists for this session/user',
        data: existingCart,
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
): Promise<SessionResponse> => {
  try {
    let cart: ISession | null | undefined = await Session.findOne({
      sessionId,
    });
    console.log('Cart Data:', JSON.stringify(cart?.data.lastActivity, null, 2));

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
) => {
  // try {
  //   if (!mongoose.Types.ObjectId.isValid(productId)) {
  //     return { success: false, error: 'Invalid product ID' };
  //   }
  //
  //   let cart = await Session.findOne({ sessionId: sessionId });
  //   console.log(cart);
  //   const productResponse = await ProductService.getProductById(productId);
  //
  //   if (!productResponse.success) {
  //     return { success: false, error: 'Product not found' };
  //   }
  //
  //   const product = productResponse.data;
  //
  //   // @ts-ignore
  //   if (product.stockQuantity < quantity) {
  //     return { success: false, error: 'Not enough stock available' };
  //   }
  //
  //   if (!cart) {
  //     cart = new Cart({
  //       userId,
  //       items: [
  //         {
  //           productId,
  //           quantity,
  //           // @ts-ignore
  //           price: product.price,
  //         },
  //       ],
  //       // @ts-ignore
  //       total: product.price * quantity,
  //     });
  //   } else {
  //     const existingItem = cart.items.find(
  //       (item) => item.productId.toString() === productId,
  //     );
  //
  //     if (existingItem) {
  //       existingItem.quantity += quantity;
  //     } else {
  //       cart.items.push({
  //         productId,
  //         quantity,
  //         // @ts-ignore
  //         price: product.price,
  //       });
  //     }
  //   }
  //
  //   await cart.save();
  //   return { success: true, data: cart };
  // } catch (error) {
  //   return {
  //     success: false,
  //     error: error instanceof Error ? error.message : 'Unknown error',
  //   };
  // }
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

    return { success: true, data: cart };
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
