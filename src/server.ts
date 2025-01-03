import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

import productRoutes from './routes/product.routes';
app.use('/api/products', productRoutes);

import cartRoutes from './routes/cart.routes';
app.use('/api/cart', cartRoutes);

import orderRoutes from './routes/order.routes';
app.use('/api/order', orderRoutes);

import sessionRoutes from './routes/session.routes';
app.use('/api/sessions', sessionRoutes);

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
