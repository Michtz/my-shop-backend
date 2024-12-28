const Cart = require('../models/cart.model');
const ProductService = require('./product.service');

class CartService {
    async getCart(userId) {
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
            return { success: false, error: error.message };
        }
    }

    async addToCart(userId, productId, quantity) {
        try {
            let cart = await Cart.findOne({ userId });

            const productResponse = await ProductService.getProductById(productId);
            if (!productResponse.success) {
                return { success: false, error: 'Product not found' };
            }

            const product = productResponse.data;
            if (product.stockQuantity < quantity) {
                return { success: false, error: 'Not enough stock available' };
            }

            if (!cart) {
                cart = new Cart({
                    userId,
                    items: [{
                        productId,
                        quantity,
                        price: product.price
                    }],
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
                        price: product.price
                    });
                }

                cart.total = cart.items.reduce(
                    (sum, item) => sum + (item.price * item.quantity), 0
                );
            }

            await cart.save();
            return { success: true, data: cart };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateCartItem(userId, productId, quantity) {
        try {
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

            if (productResponse.data.stockQuantity < quantity) {
                return { success: false, error: 'Not enough stock available' };
            }

            item.quantity = quantity;
            cart.calculateTotal();
            await cart.save();

            return { success: true, data: cart };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async removeFromCart(userId, productId) {
        try {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return { success: false, error: 'Cart not found' };
            }

            cart.items = cart.items.filter(item => item.productId.toString() !== productId);
            cart.calculateTotal();
            await cart.save();

            return { success: true, data: cart };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new CartService();