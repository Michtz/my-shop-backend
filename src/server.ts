import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { initializeSocketIO } from './services/socket.service';
import { releaseExpiredReservations } from './services/reservation.service';

dotenv.config();

import paymentRoutes from './routes/payment.routes';
import sessionRoutes from './routes/session.routes';
import orderRoutes from './routes/order.routes';
import cartRoutes from './routes/cart.routes';
import productRoutes from './routes/product.routes';
import blogRoutes from './routes/blog.routes';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';

connectDB();

const app: Express = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://my-shop-frontend-ten.vercel.app',
      'https://my-shop-frontend-aknp.onrender.com/de',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'withCredentials',
    ],
  }),
);

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

app.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'backend is working' });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to myShop',
    endpoints: {
      test: '/test',
      products: '/api/products',
      blog: '/api/blog',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/blog', blogRoutes);

initializeSocketIO(server);

// Cron Job: All 5min
cron.schedule('*/5 * * * *', async () => {
  console.log('Running reservation cleanup...');
  try {
    const result = await releaseExpiredReservations();
    if (result.expiredReservations > 0) {
      console.log(
        `Cleanup completed: ${result.expiredReservations} reservations released`,
      );
    }
    if (result.errors.length > 0) {
      console.error('Cleanup errors:', result.errors);
    }
  } catch (error) {
    console.error('Reservation cleanup failed:', error);
  }
});

console.log('Reservation cleanup cron job started (every 5 minutes)');

const PORT = process.env.PORT || 4200;

mongoose
  .connect(process.env.MONGODB_URI || '')
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on: ${PORT}`);
      console.log('MongoDB is connected');
    });
  })
  .catch((err: Error) => console.error('MongoDB error:', err));
