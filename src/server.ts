import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initializeSocketIO } from './services/socket.service';

import sessionRoutes from './routes/session.routes';
import orderRoutes from './routes/order.routes';
import cartRoutes from './routes/cart.routes';
import productRoutes from './routes/product.routes';

/* ToDo: add joi as validation "maybe": https://joi.dev/ */
dotenv.config();

const app: Express = express();

app.use(cors());
app.use(express.json());
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
