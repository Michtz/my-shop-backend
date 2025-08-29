import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { IProductDocument } from '../models/product.model';
import { ICartDocument } from '../models/cart.model';

let io: Server;

export interface CartReservationData {
  productId: string;
  productName: string;
  reservedQuantity: number;
  availableStock: number;
  cartCount: number;
  sessionId: string;
  userId?: string;
}

export interface CartUpdateData {
  cartId: string;
  sessionId: string;
  userId?: string;
  totalItems: number;
  total: number;
  updatedAt: Date;
}

export interface StockConflictData {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  conflictType:
    | 'insufficient_stock'
    | 'product_unavailable'
    | 'reservation_expired';
}

export const initializeSocketIO = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Session Room
    socket.on('join_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      console.log(`Client ${socket.id} joined session room: ${sessionId}`);
    });

    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      console.log(`Client ${socket.id} left session room: ${sessionId}`);
    });

    // User Room - NUR wenn eingeloggt
    // socket.on('join_user', (userId: string) => {
    //   socket.join(`user:${userId}`);
    //   console.log(`Client ${socket.id} joined user room: ${userId}`);
    // });
    //
    // socket.on('leave_user', (userId: string) => {
    //   socket.leave(`user:${userId}`);
    //   console.log(`Client ${socket.id} left user room: ${userId}`);
    // });

    // Produkt Room - für Live Stock Updates
    socket.on('watch_product', (productId: string) => {
      socket.join(`product:${productId}`);
      console.log(`Client ${socket.id} watching product: ${productId}`);
    });

    socket.on('unwatch_product', (productId: string) => {
      socket.leave(`product:${productId}`);
      console.log(`Client ${socket.id} stopped watching product: ${productId}`);
    });

    // // Category Room - für Category Updates
    // socket.on('watch_category', (category: string) => {
    //   socket.join(`category:${category}`);
    //   console.log(`Client ${socket.id} watching category: ${category}`);
    // });
    //
    // socket.on('unwatch_category', (category: string) => {
    //   socket.leave(`category:${category}`);
    //   console.log(`Client ${socket.id} stopped watching category: ${category}`);
    // });

    // // Shop Updates - Allgemeine Updates
    // socket.join('shop_updates');

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.io server initialized');
};

// Cart Item reserviert
export const emitCartItemReserved = (data: CartReservationData): void => {
  if (!io) {
    console.warn('Socket.io is not initialized. Cart reservation not emitted.');
    return;
  }

  // An Session senden
  io.to(`session:${data.sessionId}`).emit('cart_item_reserved', data);

  // // An User senden (Multi-Device)
  // if (data.userId) {
  //   io.to(`user:${data.userId}`).emit('cart_synced', {
  //     type: 'item_reserved',
  //     data,
  //   });
  // }

  // to all Product Watchers - product is reserved now
  io.to(`product:${data.productId}`).emit('product_reserved', {
    productId: data.productId,
    cartCount: data.cartCount,
    availableStock: data.availableStock,
  });
};

// Cart Item freigegeben
export const emitCartItemReleased = (data: CartReservationData): void => {
  if (!io) {
    console.warn('Socket.io is not initialized. Cart release not emitted.');
    return;
  }

  // An Session senden
  io.to(`session:${data.sessionId}`).emit('cart_item_released', data);
  //
  // // An User senden (Multi-Device)
  // if (data.userId) {
  //   io.to(`user:${data.userId}`).emit('cart_synced', {
  //     type: 'item_released',
  //     data,
  //   });
  // }

  // An Product Watchers - wieder verfügbar
  io.to(`product:${data.productId}`).emit('product_released', {
    productId: data.productId,
    cartCount: data.cartCount,
    availableStock: data.availableStock,
  });
};

export const emitCartUpdated = (cart: ICartDocument): void => {
  if (!io) {
    console.warn('Socket.io is not initialized. Cart update not emitted.');
    return;
  }

  const updateData: CartUpdateData = {
    cartId: String(cart._id),
    sessionId: cart.sessionId,
    userId: cart.userId,
    totalItems: cart.items.length,
    total: cart.total,
    updatedAt: new Date(),
  };

  io.to(`session:${cart.sessionId}`).emit('cart_updated', updateData);

  // // An User senden (Multi-Device)
  // if (cart.userId) {
  //   io.to(`user:${cart.userId}`).emit('cart_synced', {
  //     type: 'cart_updated',
  //     data: updateData,
  //   });
  // }
};

export const emitStockConflict = (
  sessionId: string,
  conflictData: StockConflictData,
): void => {
  if (!io) {
    console.warn('Socket.io is not initialized. Stock conflict not emitted.');
    return;
  }

  io.to(`session:${sessionId}`).emit('cart_stock_conflict', conflictData);
};

export const emitProductStockUpdated = (product: IProductDocument): void => {
  if (!io) {
    console.warn(
      'Socket.io is not initialized. Product stock update not emitted.',
    );
    return;
  }

  const stockData = {
    productId: String(product._id),
    name: product.name,
    stockQuantity: product.stockQuantity,
    reservedQuantity: product.reservedQuantity,
    availableQuantity: product.availableQuantity,
    lastUpdated: product.lastUpdated,
  };

  io.to(`product:${product._id}`).emit('product_stock_updated', stockData);

  // // An Category Watchers
  // io.to(`category:${product.category}`).emit(
  //   'category_stock_updated',
  //   stockData,
  // );

  // // An alle Shop Updates
  // io.to('shop_updates').emit('stock_updated', stockData);

  // Low Stock Warning
  if (stockData.availableQuantity <= 5 && stockData.availableQuantity > 0) {
    io.to('shop_updates').emit('low_stock_alert', {
      productId: String(product._id),
      name: product.name,
      availableQuantity: stockData.availableQuantity,
    });
  }

  // Out of Stock
  if (stockData.availableQuantity <= 0) {
    io.to('shop_updates').emit('out_of_stock_alert', {
      productId: String(product._id),
      name: product.name,
    });
  }
};

// cleanup
export const emitReservationExpired = (
  productId: string,
  sessionId: string,
): void => {
  if (!io) {
    console.warn(
      'Socket.io is not initialized. Reservation expiry not emitted.',
    );
    return;
  }

  const expiredData = {
    productId,
    message: 'Your reservation has expired',
    timestamp: new Date(),
  };

  // An betroffene Session
  io.to(`session:${sessionId}`).emit('reservation_expired', expiredData);

  // // An User (Multi-Device)
  // if (userId) {
  //   io.to(`user:${userId}`).emit('cart_synced', {
  //     type: 'reservation_expired',
  //     data: expiredData,
  //   });
  // }
};

// Utility
export const getSocketIO = (): Server | undefined => {
  return io;
};
