import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initializeSocketIO = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://my-shop-frontend-ten.vercel.app',
        'https://my-shop-frontend-aknp.onrender.com',
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('join_session', (sessionId: string) => {
      joinSessionRoom(socket, sessionId);
      console.log(`Client session conected: ${socket.id} ${sessionId}`);
    });
    // Auto-join shop updates room
    socket.join('shop_updates');

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.io server initialized');
};

// Call this after order creation and stock update
export const emitProductsUpdated = (updatedProductIds?: string[]): void => {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  // Emit to all clients in shop_updates room
  io.to('shop_updates').emit('products_updated', {
    productIds: updatedProductIds || [],
    timestamp: new Date().toISOString(),
  });
};

// Utility function to get io instance
export const getSocketIO = (): Server | undefined => {
  return io;
};

export const joinSessionRoom = (socket: any, sessionId: string): void => {
  const roomName = `session_${sessionId}`;
  socket.join(roomName);
  console.log(`Client ${socket.id} joined session room: ${roomName}`);
};

export const emitCartUpdated = (sessionId: string): void => {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  const roomName = `session_${sessionId}`;
  io.to(roomName).emit('cart_updated', {
    timestamp: new Date().toISOString(),
  });
};
