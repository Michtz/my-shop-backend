import { Response } from 'express';
import * as OrderService from '../services/order.service';
import { OrderRequest } from '../models/order.model';

export const allOrders = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await OrderService.allOrders();
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creating order',
    });
  }
};
export const createOrder = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    const { shippingDetails } = req.body;

    if (!sessionId || !shippingDetails) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const result = await OrderService.createOrder(sessionId, shippingDetails);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creating order',
    });
  }
};

export const getOrderDetails = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'Order ID is required',
      });
      return;
    }

    const result = await OrderService.getOrderDetails(orderId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching order details',
    });
  }
};

/*

export const getUserOrders = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
      return;
    }

    const result = await OrderService.getUserOrders(userId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching user orders',
    });
  }
};

export const updateOrderStatus = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
      res.status(400).json({
        success: false,
        error: 'Order ID and status are required',
      });
      return;
    }

    const result = await OrderService.updateOrderStatus(orderId, status);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating order status',
    });
  }
};*/
