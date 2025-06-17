import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from 'cookie-parser';
import { initializeSocketIO } from './services/socket.service';

import sessionRoutes from './routes/session.routes';
import orderRoutes from './routes/order.routes';
import cartRoutes from './routes/cart.routes';
import productRoutes from './routes/product.routes';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';

connectDB();
dotenv.config();

const app: Express = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
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
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/sessions', sessionRoutes);

initializeSocketIO(server);

const PORT = process.env.PORT || 4200;

mongoose
  .connect(process.env.MONGODB_URI || '')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
      console.log('MongoDB is connected');
    });
  })
  .catch((err: Error) => console.error('MongoDB error:', err));
