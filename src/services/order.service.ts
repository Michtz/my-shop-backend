import { IShippingAddress, Order, OrderResponse } from '../models/order.model';
import { Cart, ICart } from '../models/cart.model';
import * as ProductService from './product.service';
import mongoose from 'mongoose';

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

// Todo: control
export const createOrder = async (
  sessionId: string,
  shippingDetails: IShippingAddress,
): Promise<OrderResponse> => {
  try {
    const cart: ICart | null = await Cart.findOne({ sessionId });

    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    const adresse = cart.userInfo?.selectedAddress;
    if (!adresse) {
      return { success: false, error: 'Adresse is required' };
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
      if (
        'stockQuantity' in productResponse.data &&
        productResponse.data.stockQuantity < item.quantity
      ) {
        return {
          success: false,
          error: `Not enough stock for ${productResponse.data.name} only ${productResponse.data.stockQuantity}`,
        };
      }
    }

    const order = new Order({
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
        if ('stockQuantity' in product.data) {
          await ProductService.updateStock(
            item.productId.toString(),
            product.data.stockQuantity - item.quantity,
          );
        }
      }
    }

    await order.save();
    await Cart.findOneAndDelete({ sessionId });

    return { success: true, data: order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getOrderDetails = async (
  orderId: string,
): Promise<OrderResponse> => {
  try {
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
