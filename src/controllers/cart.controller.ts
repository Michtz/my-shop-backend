import {Response} from "express";
import * as CartService from "../services/cart.service";
import {CartRequest} from "../models/cart.model";

export const getCart= async (req: CartRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const cart = await CartService.getCart(userId);
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching cart'
        });
    }
};

export const addToCart= async (req: CartRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            res.status(400).json({
                success: false,
                error: 'ProductId and quantity are required'
            });
            return;
        }

        const result = await CartService.addToCart(userId, productId, quantity);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error adding item to cart'
        });
    }
};


export const removeFromCart =async (req: CartRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const { productId } = req.params;

        if (!productId) {
            res.status(400).json({
                success: false,
                error: 'ProductId is required'
            });
            return;
        }

        const result = await CartService.removeFromCart(userId, productId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error removing item from cart'
        });
    }
};

export const updateCartItem = async (req: CartRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!productId || !quantity) {
            res.status(400).json({
                success: false,
                error: 'ProductId and quantity are required'
            });
            return;
        }

        const result = await CartService.updateCartItem(userId, productId, quantity);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error updating cart item'
        });
    }
};