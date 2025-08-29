import { Response } from 'express';
import { OrderRequest } from '../models/order.model';
import * as OrderService from '../services/order.service';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export const createOrder = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!sessionId || !paymentIntentId) {
      res.status(400).json({
        success: false,
        error: 'Session ID and Payment Intent ID are required',
      });
      return;
    }

    let paymentMethodDetails: {
      last4: string;
      brand: string;
      paymentMethodId: string;
    } | null = null;
    if (paymentMethodId) {
      try {
        const paymentMethod =
          await stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod.card) {
          paymentMethodDetails = {
            last4: paymentMethod.card.last4,
            brand: paymentMethod.card.brand,
            paymentMethodId: paymentMethodId,
          };
        }
      } catch (error) {
        console.error('Failed to retrieve payment method:', error);
      }
    }

    const result = await OrderService.createOrderFromCart(
      sessionId,
      paymentIntentId,
      paymentMethodDetails,
    );

    const status = result.success ? 201 : 400;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while creating order',
    });
  }
};

export const getOrder = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const { orderNumber } = req.params;

    if (!orderNumber) {
      res.status(400).json({
        success: false,
        error: 'Order number is required',
      });
      return;
    }

    const result = await OrderService.getOrder(orderNumber);

    const status = result.success
      ? 200
      : result.error === 'Order not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching order',
    });
  }
};

export const updateOrderStatus = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    if (!orderNumber || !status) {
      res.status(400).json({
        success: false,
        error: 'Order number and status are required',
      });
      return;
    }

    if (!['paid', 'completed'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
      return;
    }

    const result = await OrderService.updateOrderStatus(orderNumber, status);

    const status_code = result.success
      ? 200
      : result.error === 'Order not found'
        ? 404
        : 500;
    res.status(status_code).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating order status',
    });
  }
};

export const getAllOrders = async (
  req: OrderRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await OrderService.getAllOrders();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching orders',
    });
  }
};
