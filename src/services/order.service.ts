import {
  Order,
  IOrder,
  OrderCreateData,
  OrderResponse,
} from '../models/order.model';
import * as CartService from './cart.service';

export const createOrderFromCart = async (
  sessionId: string,
  paymentIntentId: string,
  paymentMethodDetails: any,
): Promise<OrderResponse> => {
  try {
    // Get cart data
    const cartResult = await CartService.getCart(sessionId);
    if (!cartResult.success || !cartResult.data) {
      return {
        success: false,
        error: 'Cart not found',
      };
    }

    const cart = cartResult.data;

    // Check if order already exists for this payment intent
    const existingOrder = await Order.findOne({ paymentIntentId });
    if (existingOrder) {
      return {
        success: true,
        data: existingOrder,
      };
    }

    // Generate order number manually
    const generateOrderNumber = (): string => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const uuid = require('uuid').v4().slice(0, 8).toUpperCase();
      return `ORD-${date}-${uuid}`;
    };

    // Create new order
    const order = new Order({
      orderNumber: generateOrderNumber(), // <- Explizit setzen!
      sessionId: cart.sessionId,
      userId: cart.userId,
      customerInfo: cart.userInfo,
      items: cart.items,
      total: cart.total,
      paymentIntentId: paymentIntentId,
      paymentMethodDetails: paymentMethodDetails,
      status: 'paid',
    });

    await order.save();

    // Populate product details
    await order.populate('items.productId');

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error('Order creation error:', error);
    return {
      success: false,
      error: 'Failed to create order',
    };
  }
};

export const getOrder = async (orderNumber: string): Promise<OrderResponse> => {
  try {
    const order = await Order.findOne({ orderNumber }).populate(
      'items.productId',
    );

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch order',
    };
  }
};

export const getOrderByPaymentIntent = async (
  paymentIntentId: string,
): Promise<OrderResponse> => {
  try {
    const order = await Order.findOne({ paymentIntentId }).populate(
      'items.productId',
    );

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch order',
    };
  }
};

export const updateOrderStatus = async (
  orderNumber: string,
  status: 'paid' | 'completed',
): Promise<OrderResponse> => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderNumber },
      { status },
      { new: true },
    ).populate('items.productId');

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update order status',
    };
  }
};

export const getAllOrders = async (): Promise<OrderResponse> => {
  try {
    const orders = await Order.find()
      .populate('items.productId')
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch orders',
    };
  }
};

export const getUserOrders = async (userId: string): Promise<OrderResponse> => {
  try {
    const orders = await Order.find({ userId })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch user orders',
    };
  }
};
