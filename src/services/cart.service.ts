import {
  Cart,
  CartCreateData,
  CartResponse,
  ICartDocument,
  ICartItem,
  IUserCartInfo,
} from '../models/cart.model';
import mongoose from 'mongoose';
import { Product } from '../models/product.model';
import { IUser, User } from '../models/user.model';
import { emitCartUpdated } from './socket.service';

export const createCart = async (
  data: CartCreateData,
): Promise<CartResponse> => {
  try {
    const { sessionId, userId, items = [], total = 0 } = data;
    const existingCart = await Cart.findOne({
      $or: [{ sessionId }, ...(userId ? [{ userId }] : [])],
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
      sessionId,
      userId,
      items,
      total,
    });

    await cart.save();
    const populatedCart = await cart.populate('items.productId');
    emitCartUpdated(sessionId, userId);

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
    if (!sessionId) {
      return {
        success: false,
        error: 'SessionId is required',
      };
    }

    const [sessionCart, userCart] = await Promise.all([
      Cart.findOne({ sessionId }),
      userId ? Cart.findOne({ userId }) : null,
    ]);

    let finalCart: ICartDocument | null;

    const areDifferentCarts =
      sessionCart &&
      userCart &&
      sessionCart._id.toString() !== userCart._id.toString();

    // if both cart => merge and delete
    if (areDifferentCarts && userId) {
      const sessionItemsMap = new Map(
        sessionCart.items.map((item) => [item.productId.toString(), item]),
      );

      const userItemsMap = new Map(
        userCart.items.map((item) => [item.productId.toString(), item]),
      );

      const mergedItems: ICartItem[] = [];

      for (const [productId, item] of sessionItemsMap) {
        mergedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // merge items
      for (const [productId, item] of userItemsMap) {
        if (!sessionItemsMap.has(productId)) {
          mergedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          });
        }
      }

      userCart.items = mergedItems;
      userCart.sessionId = sessionId; // Übernehme sessionId

      // only delet if diffrent carts .... achtung nid lösche :D oder ömu nid wieder...
      await userCart.save();
      await Cart.deleteOne({ _id: sessionCart._id });

      finalCart = await Cart.findById(userCart._id).populate('items.productId');
    }
    // session cart and user cart are the same => return
    else if (sessionCart && userCart && !areDifferentCarts) {
      finalCart = await Cart.findById(userCart._id).populate('items.productId');
    }

    // to update user id if only session cart found
    else if (sessionCart && userId && !userCart) {
      sessionCart.userId = userId;
      await sessionCart.save();

      finalCart = await Cart.findById(sessionCart._id).populate(
        'items.productId',
      );
    } else if (userCart && !sessionCart) {
      finalCart = await Cart.findById(userCart._id).populate('items.productId');
    } else if (sessionCart) {
      finalCart = await Cart.findById(sessionCart._id).populate(
        'items.productId',
      );
    }
    // if no cart create new
    else {
      const newCart = new Cart({
        sessionId,
        userId: userId || undefined,
        items: [],
        total: 0,
      });

      await newCart.save();
      emitCartUpdated(sessionId, userId);
      finalCart = await Cart.findById(newCart._id).populate('items.productId');
    }

    if (!finalCart) {
      return {
        success: false,
        error: 'Failed to retrieve or create cart',
      };
    }

    return {
      success: true,
      data: finalCart,
    };
  } catch (error) {
    console.error('Error in getCart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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
    if (!sessionId) {
      return {
        success: false,
        error: 'SessionId is required',
      };
    }

    let cart: ICartDocument | null;

    // search locig for cart
    if (userId) {
      // Erst mit userId suchen
      cart = await Cart.findOne({ userId });

      if (!cart) {
        cart = await Cart.findOne({ sessionId });

        if (cart) {
          cart.userId = userId;
        }
      }
    } else {
      // search only with sessionid
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      cart = new Cart({
        sessionId,
        userId: userId || undefined,
        items: [],
        total: 0,
      });
    }

    const product = await (
      await import('../models/product.model')
    ).Product.findById(productId);

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    // check if product in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId?.toString() === productId,
    );

    if (existingItemIndex > -1) {
      // use session quantity like galaxus :D
      cart.items[existingItemIndex].quantity = quantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
      } as ICartItem);
    }

    cart.calculateTotal();
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
    );

    emitCartUpdated(sessionId, userId);

    return {
      success: true,
      data: updatedCart,
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
export const removeFromCart = async (
  sessionId: string,
  productId: string,
  userId: string | undefined,
): Promise<CartResponse> => {
  try {
    if (!sessionId) {
      return {
        success: false,
        error: 'SessionId is required',
      };
    }

    let cart: ICartDocument | null;

    if (userId) {
      cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = await Cart.findOne({ sessionId });
        if (cart) {
          cart.userId = userId;
        }
      }
    } else {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      return {
        success: false,
        error: 'Cart not found',
      };
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter((item) => {
      const itemProductId = item.productId.toString();
      return itemProductId !== productId;
    });

    // Check if item was removed
    if (cart.items.length === originalLength) {
      return {
        success: false,
        error: 'Product not found in cart',
      };
    }

    cart.calculateTotal();
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
    );

    emitCartUpdated(sessionId, userId);

    return {
      success: true,
      data: updatedCart,
    };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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

    const cart = await Cart.findOne({ sessionId });
    if (!cart) return { success: false, error: 'Cart not found' };

    const item = cart.items.find(
      (item) => item.productId.toString() === productId,
    );
    if (!item) return { success: false, error: 'Item not found in cart' };

    const product = await Product.findById(productId);
    if (!product) return { success: false, error: 'Product not found' };

    const oldQuantity = item.quantity;
    const quantityDiff = quantity - oldQuantity;

    if (quantityDiff > 0) {
      if (product.stockQuantity < quantityDiff) {
        return {
          success: false,
          error: `Not enough stock available. Available: ${product.stockQuantity + oldQuantity}, Requested: ${quantity}`,
        };
      }
    }

    item.quantity = quantity;
    item.price = product.price;
    cart.calculateTotal?.();
    await cart.save();
    const populatedCart = await cart.populate('items.productId');
    emitCartUpdated(sessionId, undefined);
    return { success: true, data: populatedCart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export type cartItemsTest = Array<{ productId: string; quantity: number }>;

export const replaceCartItems = async (
  sessionId: string,
  items: cartItemsTest,
  userId?: string,
): Promise<CartResponse> => {
  try {
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, userId, items: [] });
    }

    const validatedItems: any[] = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return {
          success: false,
          error: `Invalid product ID: ${item.productId}`,
        };
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return {
          success: false,
          error: `Product not found: ${item.productId}`,
        };
      }

      if (!product.isActive) {
        return {
          success: false,
          error: `Product is not available: ${product.name}`,
        };
      }

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    cart.items = validatedItems;
    cart.calculateTotal();
    await cart.save();
    const populatedCart = await cart.populate('items.productId');
    emitCartUpdated(sessionId, userId);
    return { success: true, data: populatedCart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const updateCartUserInfo = async (
  sessionId: string,
  userInfo: IUserCartInfo,
): Promise<CartResponse> => {
  try {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) return { success: false, error: 'Cart not found' };
    cart.userInfo = userInfo;
    await cart.save();
    const populatedCart = await cart.populate('userInfo');
    return { success: true, data: populatedCart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const updateCartAddress = async (
  sessionId: string,
  addressId: string,
): Promise<CartResponse> => {
  try {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) return { success: false, error: 'Cart not found' };

    if (!cart.userId) {
      return { success: false, error: 'Cart has no associated user' };
    }

    const user = await User.findById(cart.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const selectedAddress = user.addresses.find(
      (address) => address.street.toString() === addressId,
    );

    if (!selectedAddress) return { success: false, error: 'Address not found' };
    if (!cart.userInfo) cart.userInfo = { userId: cart.userId };
    cart.userInfo.selectedAddress = selectedAddress;
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

export const updateCartPayment = async (
  sessionId: string,
  paymentId: string,
): Promise<CartResponse> => {
  try {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) return { success: false, error: 'Cart not found' };
    if (!cart.userId) {
      return { success: false, error: 'Cart has no associated user' };
    }

    const user: IUser | null = await User.findById(cart.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const selectedPayment = user.paymentInfo.find(
      (payment) => payment._id.toString() === paymentId,
    );

    if (!selectedPayment) {
      return { success: false, error: 'Payment method not found' };
    }

    if (!cart.userInfo) cart.userInfo = { userId: cart.userId };
    cart.userInfo.selectedPayment = selectedPayment;
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

export const updateCartGuestInfo = async (
  sessionId: string,
  guestInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: any;
  },
): Promise<CartResponse> => {
  try {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) return { success: false, error: 'Cart not found' };
    if (!cart.userInfo) cart.userInfo = {};

    cart.userInfo.guestInfo = {
      email: guestInfo.email,
      firstName: guestInfo.firstName,
      lastName: guestInfo.lastName,
      phoneNumber: guestInfo.phoneNumber,
    };

    if (guestInfo.address) cart.userInfo.selectedAddress = guestInfo.address;
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

export const updateCart = async (
  data: CartCreateData,
): Promise<CartResponse> => {
  try {
    const { sessionId, userId, items = [] } = data;
    const cart = await Cart.findOne({ sessionId });
    if (!cart) return { success: false, error: 'Cart not found' };
    cart.items = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return {
          success: false,
          error: `Product with ID ${item.productId} not found`,
        };
      }

      cart.items.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    if (userId) cart.userId = userId;
    cart.calculateTotal?.();
    await cart.save();
    const populatedCart = await cart.populate('items.productId');
    emitCartUpdated(sessionId, userId);

    return { success: true, data: populatedCart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
