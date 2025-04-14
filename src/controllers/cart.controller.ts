import { Response } from 'express';
import * as CartService from '../services/cart.service';
import { CartCreateData, CartRequest } from '../models/cart.model';

// works as intended
export const createCart = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId, userId } = req.params;

    const data: CartCreateData = {
      sessionId,
      userId,
      items: req.body.items?.map((item) => ({
        productId: item.productId,
        quantity: item.quantity || 1,
      })),
    };

    const cart = await CartService.createCart(data);
    if (!cart.success) {
      res.status(400).json(cart);
      return;
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creating cart',
    });
  }
};

// works as intended
export const getCart = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params?.userId;
    const sessionId = req.params.sessionId;
    const cart = await CartService.getCart(sessionId, userId);
    if (!cart.success) {
      res.status(400).json(cart);
      return;
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching cart',
    });
  }
};

// works as intended
export const addToCart = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const sessionId = req.params.sessionId;

    if (!req.body.items || req.body.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
      });
      return;
    }

    const results = [];
    for (const item of req.body.items) {
      const { productId, quantity } = item;

      if (!productId || !quantity) {
        res.status(400).json({
          success: false,
          error: 'ProductId and quantity are required for all items',
        });
        return;
      }

      const cart = await CartService.addToCart(
        sessionId,
        userId,
        productId,
        quantity,
      );

      if (!cart.success) {
        res.status(400).json(cart);
        return;
      }
      results.push(cart);
    }

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error adding items to cart',
    });
  }
};

// works as intended
export const removeFromCart = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;

    if (!req.body.items || req.body.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
      });
      return;
    }

    const results = [];
    for (const item of req.body.items) {
      const { productId } = item;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'ProductId are required for all items to delete them',
        });
        return;
      }

      const cart = await CartService.removeFromCart(sessionId, productId);
      if (!cart.success) {
        res.status(400).json(cart);
        return;
      }
      results.push(cart);
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error removing item from cart',
    });
  }
};

// works as intended
export const updateCartItem = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId, productId } = req.params;
    const quantity = req.body.items?.[0]?.quantity;

    if (!productId || !quantity) {
      res.status(400).json({
        success: false,
        error: 'ProductId and quantity are required',
      });
      return;
    }

    const cart = await CartService.updateCartItem(
      sessionId,
      productId,
      quantity,
    );

    if (!cart.success) {
      res.status(400).json(cart);
      return;
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating cart item',
    });
  }
};

// Todo: control after fix of user service
export const updateCartUserInfo = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    const { userInfo } = req.body;

    if (!userInfo) {
      res.status(400).json({
        success: false,
        error: 'User information is required',
      });
      return;
    }

    const cart = await CartService.updateCartUserInfo(sessionId, userInfo);

    if (!cart.success) {
      res.status(400).json(cart);
      return;
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating user information',
    });
  }
};

// Todo: control after fix of user service
export const updateCartAddress = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    const addressId = req.body.userInfo?.selectedAddressId;

    if (!addressId) {
      res.status(400).json({
        success: false,
        error: 'AddressId is required',
      });
      return;
    }

    const cart = await CartService.updateCartAddress(sessionId, addressId);
    if (!cart.success) {
      res.status(400).json(cart);
      return;
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating cart address',
    });
  }
};

// Todo: control after fix of user service
export const updateCartPayment = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    const paymentId = req.params.paymentId;

    if (!paymentId) {
      res.status(400).json({
        success: false,
        error: 'PaymentId is required',
      });
      return;
    }

    const cart = await CartService.updateCartPayment(sessionId, paymentId);
    if (!cart.success) {
      res.status(400).json(cart);
      return;
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating payment method',
    });
  }
};

// works as intended
export const updateCartGuestInfo = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    const { userInfo } = req.body;

    if (!userInfo || !userInfo.guestInfo) {
      res.status(400).json({
        success: false,
        error: 'Guest information is required',
      });
      return;
    }

    const cart = await CartService.updateCartGuestInfo(
      sessionId,
      userInfo.guestInfo,
    );
    if (!cart.success) {
      res.status(400).json(cart);
      return;
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating guest information',
    });
  }
};
