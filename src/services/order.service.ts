import { Order, IOrder } from '../models/order.model';
import { Cart, ICart } from '../models/cart.model';
import * as ProductService from './product.service';
import mongoose from 'mongoose';

export interface OrderResponse {
  success: boolean;
  data?: IOrder | IOrder[] | null;
  error?: string;
}

interface ShippingDetails {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export const allOrders = async () => {
  try {
    const orders = await Order.find().populate('items.productId');

    if (!orders) {
      return { success: false, error: 'Order not found' };
    }

    return { success: true, data: orders };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const createOrder = async (
  userId: string,
  cartId: string,
  shippingDetails: ShippingDetails,
): Promise<OrderResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return { success: false, error: 'Invalid cart ID' };
    }

    const cart: ICart | null = await Cart.findById(cartId);
    if (!cart || cart.userId !== userId) {
      return { success: false, error: 'Invalid cart' };
    }

    for (const item of cart.items) {
      const productResponse = await ProductService.getProductById(
        item.productId.toString(),
      );
      if (!productResponse.success || !productResponse.data) {
        return {
          success: false,
          error: `Product ${item.productId} not found`,
        };
      }
      // @ts-ignore
      if (productResponse.data.stockQuantity < item.quantity) {
        return {
          success: false,
          // @ts-ignore
          error: `Not enough stock for ${productResponse.data.name}`,
        };
      }
    }

    const order = new Order({
      userId,
      items: cart.items,
      totalAmount: cart.total,
      shippingAddress: shippingDetails,
      status: 'pending',
    });

    for (const item of cart.items) {
      const product = await ProductService.getProductById(
        item.productId.toString(),
      );
      if (product.success && product.data) {
        await ProductService.updateStock(
          item.productId.toString(),
          // @ts-ignore
          product.data.stockQuantity - item.quantity,
        );
      }
    }

    await order.save();
    await Cart.findByIdAndDelete(cartId);

    return { success: true, data: order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getOrderById = async (orderId: string): Promise<OrderResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return { success: false, error: 'Invalid order ID' };
    }

    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    return { success: true, data: order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getUserOrders = async (userId: string): Promise<OrderResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'Invalid user ID' };
    }

    const orders = await Order.find({ userId })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    return { success: true, data: orders };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
): Promise<OrderResponse> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return { success: false, error: 'Invalid order ID' };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    await order.updateStatus(status);
    return { success: true, data: order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
