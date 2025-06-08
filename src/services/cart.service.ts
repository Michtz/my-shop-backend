import {
  Cart,
  CartCreateData,
  CartResponse,
  IUserCartInfo,
} from '../models/cart.model';
import mongoose from 'mongoose';
import { Product } from '../models/product.model';
import { IUser, User } from '../models/user.model';

// works as intended
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

    return { success: true, data: populatedCart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// works as intended
//Todo: add user id validation
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

    return { success: true, data: cart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// works as intended
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

// works as intended
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

// works as intended
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
    cart.calculateTotal?.();

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

export type cartItemsTest = Array<{ productId: string; quantity: number }>;

export const replaceCartItems = async (
  sessionId: string,
  items: cartItemsTest,
): Promise<CartResponse> => {
  try {
    // Find or create cart
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    // Validate all products first
    const validatedItems = [];

    for (const item of items) {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return {
          success: false,
          error: `Invalid product ID: ${item.productId}`,
        };
      }

      // Check if product exists
      const product = await Product.findById(item.productId);
      if (!product) {
        return {
          success: false,
          error: `Product not found: ${item.productId}`,
        };
      }

      // Check if product is active
      if (!product.isActive) {
        return {
          success: false,
          error: `Product is not available: ${product.name}`,
        };
      }

      // Check stock
      if (product.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `Not enough stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        };
      }

      // Add validated item
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // If all validations pass, replace items
    cart.items = validatedItems;
    cart.calculateTotal();

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

// Todo: control after fix of user service
export const updateCartUserInfo = async (
  sessionId: string,
  userInfo: IUserCartInfo,
): Promise<CartResponse> => {
  try {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }
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

// Todo: control after fix of user service
export const updateCartAddress = async (
  sessionId: string,
  addressId: string,
): Promise<CartResponse> => {
  try {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    if (!cart.userId) {
      return { success: false, error: 'Cart has no associated user' };
    }

    const user = await User.findById(cart.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    console.log('Cart Data:', JSON.stringify(user, null, 2));

    const selectedAddress = user.addresses.find(
      (address) => address.street.toString() === addressId,
    );

    if (!selectedAddress) {
      return { success: false, error: 'Address not found' };
    }

    if (!cart.userInfo) {
      cart.userInfo = { userId: cart.userId };
    }

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

// Todo: control after fix of user service
export const updateCartPayment = async (
  sessionId: string,
  paymentId: string,
): Promise<CartResponse> => {
  try {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

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

    if (!cart.userInfo) {
      cart.userInfo = { userId: cart.userId };
    }

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

// works as intended
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
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    if (!cart.userInfo) {
      cart.userInfo = {};
    }

    cart.userInfo.guestInfo = {
      email: guestInfo.email,
      firstName: guestInfo.firstName,
      lastName: guestInfo.lastName,
      phoneNumber: guestInfo.phoneNumber,
    };

    if (guestInfo.address) {
      cart.userInfo.selectedAddress = guestInfo.address;
    }

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
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

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

    if (userId) {
      cart.userId = userId;
    }

    cart.calculateTotal?.();
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
