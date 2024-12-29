import { Router, Request, Response } from 'express';
import * as OrderService from '../services/order.service';
import mongoose from 'mongoose';

const router = Router();

interface OrderRequest extends Request {
    params: {
        userId?: string;
        orderId?: string;
    };
    body: {
        cartId?: string;
        status?: string;
        shippingDetails?: {
            street: string;
            city: string;
            zipCode: string;
            country: string;
        };
    };
}

export const createOrder = async (req: OrderRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { cartId, shippingDetails } = req.body;

        if (!userId || !cartId || !shippingDetails) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
            return;
        }

        const result = await OrderService.createOrder(userId, cartId, shippingDetails);
        res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error creating order'
        });
    }
};

export const getOrderById = async (req: OrderRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid order ID'
            });
            return;
        }

        const result = await OrderService.getOrderById(orderId);
        res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching order'
        });
    }
};

export const getUserOrders = async (req: OrderRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid user ID'
            });
            return;
        }

        const result = await OrderService.getUserOrders(userId);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching user orders'
        });
    }
};

export const updateOrderStatus = async (req: OrderRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!orderId || !status) {
            res.status(400).json({
                success: false,
                error: 'Order ID and status are required'
            });
            return;
        }

        const result = await OrderService.updateOrderStatus(orderId, status);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error updating order status'
        });
    }
};

// Route-Definitionen
router.post('/:userId', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', updateOrderStatus);

export default router;