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

const RESERVATION_DURATION = 20 * 60 * 1000; //  20min

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
//
// // 67fff5e6f9efaf23deb69622 user id
// export const getCart = async (
//   sessionId: string,
//   userId?: string,
// ): Promise<CartResponse> => {
//   try {
//     console.log(
//       'this is the start of get Cart',
//       'userId',
//       userId,
//       'sessionId',
//       sessionId,
//     );
//     let cart = await Cart.findOne({ sessionId }).populate('items.productId');
//     const userCart = await Cart.findOne({ userId }).populate('items.productId');
//     console.log('cart testsssss', userCart, 'cart', cart, 'userid', userId);
//     if (!userCart && cart) {
//       cart.userId = userId || 'test user id';
//       await cart.save();
//     }
//
//     if (userCart && cart) {
//       console.log('cart in tesssst ', userCart);
//       const carts = [cart, userCart];
//       console.log('cart 22222', carts);
//       const mergedCartItems = mergeCartItems(carts);
//       console.log('mergedCartItemssertdghsdfgsdfg', mergedCartItems);
//       cart.items = mergedCartItems;
//       await cart.save();
//
//       console.log('mergedCartItems in getcart', mergedCartItems);
//     }
//     if (!cart && userCart) {
//       cart = userCart;
//       await cart.save();
//     }
//     console.log('cart', cart);
//     console.log('chunts bis hie? ');
//     if (!cart) {
//       cart = new Cart({
//         sessionId,
//         userId,
//         items: [],
//         total: 0,
//       });
//       const newCart = await cart.save();
//       console.log('new cart', newCart);
//       return {
//         success: true,
//         error: 'Cart not found, new cart created',
//         data: newCart,
//       };
//     }
//     return { success: true, data: cart };
//   } catch (error) {
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// };

/**
 * Holt oder erstellt einen Warenkorb basierend auf sessionId und/oder userId
 */
export const getCart = async (
  sessionId: string,
  userId?: string,
): Promise<CartResponse> => {
  try {
    // Validierung
    if (!sessionId) {
      return {
        success: false,
        error: 'SessionId is required',
      };
    }

    // Suche nach beiden Carts
    let sessionCart = await Cart.findOne({ sessionId }).populate(
      'items.productId',
    );
    let userCart = userId
      ? await Cart.findOne({ userId }).populate('items.productId')
      : null;

    let finalCart: ICartDocument | null;

    // Fall 1: Beide Carts wurden gefunden
    if (sessionCart && userCart) {
      // Merge sessionCart items in userCart
      const mergedCart = await mergeCarts(userCart, sessionCart);

      // Lösche den sessionCart nach dem Merge
      await Cart.deleteOne({ _id: sessionCart._id });

      finalCart = mergedCart;
    }
    // Fall 2: Nur userCart gefunden
    else if (userCart) {
      // Ergänze sessionId falls nicht vorhanden
      if (!userCart.sessionId) {
        userCart.sessionId = sessionId;
        await userCart.save();
        // Hole aktualisierten Cart
        finalCart = await Cart.findById(userCart._id).populate(
          'items.productId',
        );
      } else {
        finalCart = userCart;
      }
    }
    // Fall 3: Nur sessionCart gefunden
    else if (sessionCart) {
      // Ergänze userId falls vorhanden und nicht im Cart
      if (userId && !sessionCart.userId) {
        sessionCart.userId = userId;
        await sessionCart.save();
        // Hole aktualisierten Cart
        finalCart = await Cart.findById(sessionCart._id).populate(
          'items.productId',
        );
      } else {
        finalCart = sessionCart;
      }
    }
    // Fall 4: Kein Cart gefunden - erstelle neuen
    else {
      const newCart = new Cart({
        sessionId,
        userId: userId || undefined,
        items: [],
        total: 0,
      });

      await newCart.save();
      // Populate für konsistente Rückgabe
      finalCart = await Cart.findById(newCart._id).populate('items.productId');
    }

    // Zusätzliche Sicherheitsprüfung
    if (!finalCart) {
      return {
        success: false,
        error: 'Failed to retrieve or create cart',
      };
    }

    emitCartUpdated(sessionId, userId);

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

/**
 * Merged sessionCart items in userCart
 * Bei Duplikaten wird die Quantity aus userCart beibehalten
 */
const mergeCarts = async (
  userCart: ICartDocument,
  sessionCart: ICartDocument,
): Promise<ICartDocument | null> => {
  try {
    // Erstelle eine Map der userCart items für schnellen Zugriff
    const userCartItemsMap = new Map<string, ICartItem>();

    userCart.items.forEach((item) => {
      const productId = item.productId._id
        ? item.productId._id.toString()
        : item.productId.toString();
      userCartItemsMap.set(productId, item);
    });

    // Füge items aus sessionCart hinzu, die nicht in userCart sind
    sessionCart.items.forEach((sessionItem) => {
      const productId = sessionItem.productId._id
        ? sessionItem.productId._id.toString()
        : sessionItem.productId.toString();

      // Wenn das Produkt nicht im userCart ist, füge es hinzu
      if (!userCartItemsMap.has(productId)) {
        userCart.items.push({
          productId: sessionItem.productId,
          quantity: sessionItem.quantity,
          price: sessionItem.price,
          reservedUntil: sessionItem.reservedUntil,
        });
      }
      // Bei Duplikaten behalten wir die Quantity vom userCart (passiert automatisch)
    });

    // Aktualisiere den Total
    userCart.calculateTotal();

    // Speichere den aktualisierten userCart
    await userCart.save();

    // Hole den frisch gespeicherten Cart aus der DB und populate
    return await Cart.findById(userCart._id).populate('items.productId');
  } catch (error) {
    console.error('Error merging carts:', error);
    throw error;
  }
};

/**
 * Fügt ein Produkt zum Warenkorb hinzu oder setzt die neue Menge
 */
export const addToCart = async (
  sessionId: string,
  userId: string | undefined,
  productId: string,
  quantity: number,
): Promise<CartResponse> => {
  try {
    // Hole oder erstelle Cart
    const cartResponse = await getCart(sessionId, userId);

    if (!cartResponse.success || !cartResponse.data) {
      return cartResponse;
    }

    // Hole frischen Cart aus der DB um sicherzustellen, dass wir die aktuelle Version haben
    const freshCart = await Cart.findById(cartResponse.data._id);

    if (!freshCart) {
      return {
        success: false,
        error: 'Cart not found after retrieval',
      };
    }

    // Hole Produktinformationen für den Preis
    const product = await (
      await import('../models/product.model')
    ).Product.findById(productId);

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    // Prüfe ob Produkt bereits im Cart ist
    const existingItemIndex = freshCart.items.findIndex(
      (item) => item.productId?.toString() === productId,
    );

    if (existingItemIndex > -1) {
      // Setze die neue Quantity (nicht addieren!)
      freshCart.items[existingItemIndex].quantity = quantity;
      freshCart.items[existingItemIndex].price = product.price;
    } else {
      // Füge neues Item hinzu
      freshCart.items.push({
        productId,
        quantity,
        price: product.price,
        reservedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 Minuten Reservierung
      } as ICartItem);
    }

    // Berechne Total neu und speichere
    freshCart.calculateTotal();
    await freshCart.save();

    // Populate und return
    const updatedCart = await Cart.findById(freshCart._id).populate(
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

//
// export const addToCart = async (
//   sessionId: string,
//   userId: string | undefined,
//   productId: string,
//   quantity: number,
// ): Promise<CartResponse> => {
//   try {
//     let cart = await Cart.findOne({ sessionId }).populate('items.productId');
//     const userCart = await Cart.findOne({ userId }).populate('items.productId');
//     console.log(
//       'cart test in addtocart',
//       userCart,
//       'cart',
//       cart,
//       'userid',
//       userId,
//     );
//
//     // Cart merging logic
//     if (!cart && !userCart) {
//       // Case 1: Neither cart exists -> create new cart
//       console.log('Creating new cart - no existing carts found');
//       cart = new Cart({
//         sessionId,
//         userId,
//         items: [],
//         total: 0,
//       });
//     } else if (!cart && userCart) {
//       // Case 2: Only user cart exists -> use user cart and update sessionId
//       cart = userCart;
//       cart.sessionId = sessionId;
//       await cart.save();
//       console.log('Using user cart, updated sessionId');
//     } else if (cart && !userCart) {
//       // Case 3: Only session cart exists -> add userId to session cart
//       if (userId) {
//         cart.userId = userId;
//         await cart.save();
//       }
//       console.log('Using session cart, added userId');
//     } else if (cart && userCart) {
//       // Case 4: Both exist -> merge items into session cart and delete user cart
//       const mergedCartItems = mergeCartItems([cart, userCart]);
//       cart.items = mergedCartItems;
//       cart.userId = userId;
//       await cart.save();
//       await Cart.deleteOne({ _id: userCart._id });
//       console.log('Merged both carts, deleted user cart');
//     }
//     const product = await Product.findById(productId);
//
//     if (!product) {
//       return {
//         success: false,
//         error: 'Product not found',
//       };
//     }
//
//     if (product.stockQuantity < quantity) {
//       return {
//         success: false,
//         error: `Not enough stock available. Available: ${product.stockQuantity}, Requested: ${quantity}`,
//       };
//     }
//
//     // At this point cart should always exist from the logic above
//     if (userId && !cart.userId) cart.userId = userId;
//
//     const existingItemIndex = cart.items.findIndex(
//       (item) => item.productId.toString() === productId,
//     );
//
//     if (existingItemIndex > -1) {
//       cart.items[existingItemIndex].quantity += quantity;
//     } else {
//       cart.items.push({
//         productId,
//         quantity,
//         price: product.price,
//       });
//     }
//
//     cart.calculateTotal();
//     await cart.save();
//
//     const populatedCart = await cart.populate('items.productId');
//     emitCartUpdated(sessionId);
//     return {
//       success: true,
//       data: populatedCart,
//     };
//   } catch (error) {
//     console.error('Error adding to cart:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// };

export const removeFromCart = async (
  sessionId: string,
  productId: string,
  userId?: string,
): Promise<CartResponse> => {
  try {
    const cartResponse = await getCart(sessionId, userId);

    if (!cartResponse.success || !cartResponse.data) {
      return cartResponse;
    }

    const cart = cartResponse.data;

    // Filtere das Produkt aus den Items
    cart.items = cart.items.filter(
      (item) =>
        item.productId._id?.toString() !== productId &&
        item.productId.toString() !== productId,
    );

    // Berechne Total neu und speichere
    cart.calculateTotal();
    await cart.save();

    // Populate und return
    const updatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
    );

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
    item.reservedUntil = new Date(Date.now() + RESERVATION_DURATION); // Timer reset
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
        reservedUntil: new Date(Date.now() + RESERVATION_DURATION),
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
