const Product = require('../models/product.model');

class ProductService {
    async getAllProducts(filters = {}) {
        try {
            const query = { isActive: true, ...filters };
            const products = await Product.find(query);
            return { success: true, data: products };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getProductById(productId) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return { success: false, error: 'Product not found' };
            }
            return { success: true, data: product };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateProductStock(productId, quantity) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return { success: false, error: 'Product not found' };
            }
            if (quantity < 0) {
                return { success: false, error: 'Quantity cannot be negative' };
            }

            product.stockQuantity = quantity;
            await product.save();
            return { success: true, data: product };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ProductService();