const express = require('express');
const router = express.Router();
const CartService = require('../services/cart.service');

const cartController = {
    getCart: async (req, res) => {
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
    },

    addToCart: async (req, res) => {
        try {
            const userId = req.params.userId;
            const { productId, quantity } = req.body;
            const result = await CartService.addToCart(userId, productId, quantity);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error adding item to cart'
            });
        }
    },

    removeFromCart: async (req, res) => {
        try {
            const userId = req.params.userId;
            const { productId } = req.params;
            const result = await CartService.removeFromCart(userId, productId);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error removing item from cart'
            });
        }
    },

    updateCartItem: async (req, res) => {
        try {
            const userId = req.params.userId;
            const { productId } = req.params;
            const { quantity } = req.body;
            const result = await CartService.updateCartItem(userId, productId, quantity);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error updating cart item'
            });
        }
    }
};

router.route('/:userId')
    .get(cartController.getCart);

router.route('/:userId/items')
    .post(cartController.addToCart);

router.route('/:userId/items/:productId')
    .delete(cartController.removeFromCart)
    .patch(cartController.updateCartItem);

module.exports = router;
