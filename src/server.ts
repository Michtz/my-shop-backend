import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { initializeSocketIO } from './services/socket.service';

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
    message: 'Welcome to Barista Accessoire',
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

const PORT = process.env.PORT || 4200;

mongoose
  .connect(env.MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Port: ${PORT}`);
      console.log('MongoDB is connected');
    });
  })
  .catch((err: Error) => console.error('MongoDB error:', err));
