const express = require('express');
const router = express.Router();
const OrderService = require('../services/order.service');

const orderController = {
    createOrder: async (req, res) => {
        try {
            const userId = req.params.userId;
            const { cartId, shippingDetails } = req.body;
            const result = await OrderService.createOrder(userId, cartId, shippingDetails);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error creating order'
            });
        }
    },

    getOrderById: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await OrderService.getOrderById(orderId);
            res.status(200).json(order);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching order'
            });
        }
    },

    getUserOrders: async (req, res) => {
        try {
            const userId = req.params.userId;
            const orders = await OrderService.getUserOrders(userId);
            res.status(200).json(orders);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching user orders'
            });
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            const result = await OrderService.updateOrderStatus(orderId, status);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error updating order status'
            });
        }
    }
};

router.post('/:userId', orderController.createOrder);
router.get('/user/:userId', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderById);
router.patch('/:orderId/status', orderController.updateOrderStatus);

module.exports = router;