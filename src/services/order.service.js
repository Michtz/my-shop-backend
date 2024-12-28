const Order = require('../models/order.model');
const CartService = require('./cart.service');
const ProductService = require('./product.service');

class OrderService {
    async createOrder(userId, cartId, shippingDetails) {
        try {
            // Get cart and validate
            const cart = await Cart.findById(cartId);
            if (!cart || cart.userId.toString() !== userId) {
                return { success: false, error: 'Invalid cart' };
            }

            // Check stock availability for all items
            for (const item of cart.items) {
                const productResponse = await ProductService.getProductById(
                    item.productId
                );
                if (!productResponse.success) {
                    return { success: false, error: `Product ${item.productId} not found` };
                }
                const product = productResponse.data;
                if (product.stockQuantity < item.quantity) {
                    return {
                        success: false,
                        error: `Not enough stock for ${product.name}`
                    };
                }
            }

            // Create order
            const order = new Order({
                userId,
                items: cart.items,
                totalAmount: cart.total,
                shippingAddress: shippingDetails,
                status: 'pending'
            });

            // Update stock quantities
            for (const item of cart.items) {
                const product = await Product.findById(item.productId);
                product.stockQuantity -= item.quantity;
                await product.save();
            }

            await order.save();
            await Cart.findByIdAndDelete(cartId);

            return { success: true, data: order };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new OrderService();