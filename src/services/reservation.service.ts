// src/services/reservation.service.ts
// NEUE DATEI ERSTELLEN

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

      // Finde alle Carts mit expired Items
      const cartsWithExpiredItems = await Cart.find({
        'items.reservedUntil': { $lt: now },
      });

      console.log(
        `🔍 Found ${cartsWithExpiredItems.length} carts with expired reservations`,
      );

      for (const cart of cartsWithExpiredItems) {
        try {
          let cartModified = false;
          const expiredItems: { productId: string; quantity: number }[] = [];

          // Finde expired items in diesem Cart
          for (let i = cart.items.length - 1; i >= 0; i--) {
            const item = cart.items[i];

            if (item.reservedUntil && item.reservedUntil < now) {
              expiredItems.push({
                productId: item.productId.toString(),
                quantity: item.quantity,
              });

              // Entferne expired item aus Cart
              cart.items.splice(i, 1);
              cartModified = true;
              result.expiredReservations++;
            }
          }

          // Cart speichern wenn geändert
          if (cartModified) {
            cart.calculateTotal();
            await cart.save();
            console.log(
              `🗑️  Removed ${expiredItems.length} expired items from cart ${cart.sessionId}`,
            );
          }

          // Product reservedQuantity aktualisieren
          for (const expiredItem of expiredItems) {
            try {
              const product = await Product.findById(expiredItem.productId);
              if (product) {
                // Reservierte Menge reduzieren
                product.reservedQuantity = Math.max(
                  0,
                  product.reservedQuantity - expiredItem.quantity,
                );

                await product.save();
                result.releasedProducts.push(String(product._id));

                // Socket Event - Produkt wieder verfügbar
                emitProductStockUpdated(product);

                // Socket Event - User über Expiry informieren
                emitReservationExpired(
                  String(product._id),
                  cart.sessionId,
                  cart.userId,
                );

                console.log(
                  `✅ Released ${expiredItem.quantity} units of product ${product.name}`,
                );
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

      console.log(
        `🧹 Cleanup completed: ${result.expiredReservations} expired, ${result.releasedProducts.length} products released`,
      );
    } catch (error) {
      const errorMsg = `Error in reservation cleanup: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  };

// Hilfsfunktion: Reservierung für spezifisches Product/Cart freigeben
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

    // Reservierte Menge reduzieren
    product.reservedQuantity = Math.max(0, product.reservedQuantity - quantity);
    await product.save();

    // Socket Event
    emitProductStockUpdated(product);

    console.log(
      `🔓 Released ${quantity} units of ${product.name} for session ${sessionId}`,
    );
    return true;
  } catch (error) {
    console.error(
      `Error releasing reservation for product ${productId}:`,
      error,
    );
    return false;
  }
};

// Hilfsfunktion: Reservierung erstellen
export const createCartItemReservation = async (
  productId: string,
  quantity: number,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Check verfügbare Menge
    const availableQuantity = product.stockQuantity - product.reservedQuantity;
    if (availableQuantity < quantity) {
      return {
        success: false,
        error: `Not enough stock available. Available: ${availableQuantity}, Requested: ${quantity}`,
      };
    }

    // Reservierung erstellen
    product.reservedQuantity += quantity;
    await product.save();

    // Socket Event
    emitProductStockUpdated(product);

    console.log(`🔒 Reserved ${quantity} units of ${product.name}`);
    return { success: true };
  } catch (error) {
    console.error(
      `Error creating reservation for product ${productId}:`,
      error,
    );
    return { success: false, error: 'Error creating reservation' };
  }
};
