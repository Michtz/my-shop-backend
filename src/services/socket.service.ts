// src/services/socket.service.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { IProductDocument } from '../models/product.model';

let io: Server;

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

    // Benutzer können einem "Raum" für Produktaktualisierungen beitreten
    socket.on('join_product', (productId) => {
      socket.join(`product:${productId}`);
      console.log(`Client ${socket.id} joined product room: ${productId}`);
    });

    // Benutzer können den "Raum" für Produktaktualisierungen verlassen
    socket.on('leave_product', (productId) => {
      socket.leave(`product:${productId}`);
      console.log(`Client ${socket.id} left product room: ${productId}`);
    });

    // Benutzer treten einem allgemeinen Raum für Shop-Aktualisierungen bei
    socket.join('shop_updates');

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.io server initialized');
};

// Event für Produktaktualisierungen
export const emitProductUpdate = (product: IProductDocument): void => {
  if (!io) {
    console.warn('Socket.io is not initialized. Update not emitted.');
    return;
  }

  // Sende an den spezifischen Produktraum
  io.to(`product:${product._id}`).emit('product_updated', {
    id: product._id,
    name: product.name,
    stockQuantity: product.stockQuantity,
    price: product.price,
    lastUpdated: product.lastUpdated,
  });

  // Sende Bestandsaktualisierung an alle Benutzer im Shop
  io.to('shop_updates').emit('stock_updated', {
    id: product._id,
    name: product.name,
    stockQuantity: product.stockQuantity,
    lastUpdated: product.lastUpdated,
  });
};

// Event für niedrigen Lagerbestand (optional)
export const emitLowStockAlert = (
  product: IProductDocument,
  threshold = 5,
): void => {
  if (!io) {
    console.warn('Socket.io is not initialized. Alert not emitted.');
    return;
  }

  if (product.stockQuantity <= threshold) {
    io.to('shop_updates').emit('low_stock_alert', {
      id: product._id,
      name: product.name,
      stockQuantity: product.stockQuantity,
    });
  }
};
