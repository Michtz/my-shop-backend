import { Response } from 'express';
import * as CartService from '../services/cart.service';
import { CartRequest } from '../models/cart.model';

export const createCart = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = { sessionId: req.params.sessionId };
    const cart = await CartService.createCart(data);
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching cart',
    });
  }
};

export const getCart = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params?.userId;
    const sessionId = req.params.sessionId;
    const cart = await CartService.getCart(sessionId, userId);
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching cart',
    });
  }
};

export const addToCart = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const sessionId = req.params.sessionId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      res.status(400).json({
        success: false,
        error: 'ProductId and quantity are required',
      });
      return;
    }

    const result = await CartService.addToCart(
      sessionId,
      userId,
      productId,
      quantity,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error adding item to cart',
    });
  }
};

export const removeFromCart = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    const productId = req.params.productId;

    if (!productId) {
      res.status(400).json({
        success: false,
        error: 'ProductId is required',
      });
      return;
    }

    const result = await CartService.removeFromCart(sessionId, productId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error removing item from cart',
    });
  }
};

export const updateCartItem = async (
  req: CartRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!productId || !quantity) {
      res.status(400).json({
        success: false,
        error: 'ProductId and quantity are required',
      });
      return;
    }

    const result = await CartService.updateCartItem(
      sessionId,
      productId,
      quantity,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating cart item',
    });
  }
};
