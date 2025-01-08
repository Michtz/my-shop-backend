import { Router, Response } from 'express';
import {
  allOrders,
  createOrder,
  getOrderDetails,
} from '../controllers/order.controller';
import { OrderRequest } from '../models/order.model';

const router = Router();

router
  .route('/')
  .get((req: OrderRequest, res: Response) => allOrders(req, res));

router
  .route('/:sessionId')
  .post((req: OrderRequest, res: Response) => createOrder(req, res));

router
  .route('/details/:orderId')
  .get((req: OrderRequest, res: Response) => getOrderDetails(req, res));

/*

router
  .route('/user/:sessionId')
  .get((req: OrderRequest, res: Response) => getUserOrders(req, res));

router
  .route('/:orderId')
  .get((req: OrderRequest, res: Response) => getOrderById(req, res));

router
  .route('/:orderId/status')
  .patch((req: OrderRequest, res: Response) => updateOrderStatus(req, res));
*/

export default router;
