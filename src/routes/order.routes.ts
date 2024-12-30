import { Router, Response } from 'express';
import {
  allOrders,
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
} from '../controllers/order.controller';
import { OrderRequest } from '../models/order.model';

const router = Router();

router
  .route('/')
  .get((req: OrderRequest, res: Response) => allOrders(req, res));

router
  .route('/:userId')
  .post((req: OrderRequest, res: Response) => createOrder(req, res));

router
  .route('/user/:userId')
  .get((req: OrderRequest, res: Response) => getUserOrders(req, res));

router
  .route('/:orderId')
  .get((req: OrderRequest, res: Response) => getOrderById(req, res));

router
  .route('/:orderId/status')
  .patch((req: OrderRequest, res: Response) => updateOrderStatus(req, res));

export default router;
