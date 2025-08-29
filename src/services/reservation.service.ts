import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import {
  emitReservationExpired,
  emitProductStockUpdated,
} from './socket.service';

export interface ReservationCleanupResult {
  expiredReservations: number;
  releasedProducts: string[];
  errors: string[];
}

export const releaseExpiredReservations =
  async (): Promise<ReservationCleanupResult> => {
    const result: ReservationCleanupResult = {
      expiredReservations: 0,
      releasedProducts: [],
      errors: [],
    };

    try {
      const now = new Date();
      const cartsWithExpiredItems = await Cart.find({
        'items.reservedUntil': { $lt: now },
      });

      for (const cart of cartsWithExpiredItems) {
        try {
          let cartModified = false;
          const expiredItems: { productId: string; quantity: number }[] = [];

          // find expired items in cart
          for (let i = cart.items.length - 1; i >= 0; i--) {
            const item = cart.items[i];

            if (item.reservedUntil && item.reservedUntil < now) {
              expiredItems.push({
                productId: item.productId.toString(),
                quantity: item.quantity,
              });

              cart.items.splice(i, 1);
              cartModified = true;
              result.expiredReservations++;
            }
          }

          if (cartModified) {
            cart.calculateTotal();
            await cart.save();
          }

          // update product reservedQuantity
          for (const expiredItem of expiredItems) {
            try {
              const product = await Product.findById(expiredItem.productId);
              if (product) {
                product.reservedQuantity = Math.max(
                  0,
                  product.reservedQuantity - expiredItem.quantity,
                );

                await product.save();
                result.releasedProducts.push(String(product._id));

                // releases product for room
                emitProductStockUpdated(product);
                emitReservationExpired(String(product._id), cart.sessionId);
              }
            } catch (productError) {
              const errorMsg = `Error updating product ${expiredItem.productId}: ${productError}`;
              console.error(errorMsg);
              result.errors.push(errorMsg);
            }
          }
        } catch (cartError) {
          const errorMsg = `Error processing cart ${cart._id}: ${cartError}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error in reservation cleanup: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  };

export const releaseCartItemReservation = async (
  sessionId: string,
  productId: string,
  quantity: number,
): Promise<boolean> => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      console.error(`Product ${productId} not found for reservation release`);
      return false;
    }

    // update reserved quantity
    product.reservedQuantity = Math.max(0, product.reservedQuantity - quantity);
    await product.save();
    emitProductStockUpdated(product);

    return true;
  } catch (error) {
    console.error(
      `Error releasing reservation for product ${productId}:`,
      error,
    );
    return false;
  }
};

export const createCartItemReservation = async (
  productId: string,
  quantity: number,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Check quantity
    const availableQuantity = product.stockQuantity - product.reservedQuantity;
    if (availableQuantity < quantity) {
      return {
        success: false,
        error: `Not enough stock available. Available: ${availableQuantity}, Requested: ${quantity}`,
      };
    }

    product.reservedQuantity += quantity;
    await product.save();

    emitProductStockUpdated(product);

    return { success: true };
  } catch (error) {
    console.error(
      `Error creating reservation for product ${productId}:`,
      error,
    );
    return { success: false, error: 'Error creating reservation' };
  }
};
