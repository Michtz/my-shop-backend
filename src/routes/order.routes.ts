import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { OrderRequest } from '../models/order.model';
import { Response } from 'express';

const router = Router();

// Create order from cart (public - session based)
router.post('/create/:sessionId', (req: OrderRequest, res: Response) =>
  OrderController.createOrder(req, res),
);

// Get single order (public - by order number)
router.get('/:orderNumber', (req: OrderRequest, res: Response) =>
  OrderController.getOrder(req, res),
);

// Update order status (admin only - add later)
router.put('/:orderNumber/status', (req: OrderRequest, res: Response) =>
  OrderController.updateOrderStatus(req, res),
);

// Get all orders (admin only - add later)
router.get('/', (req: OrderRequest, res: Response) =>
  OrderController.getAllOrders(req, res),
);

// Get user orders (auth required)
// router.get('/user/:userId', authenticate, (req: OrderRequest, res: Response) =>
//   OrderController.getUserOrders(req, res),
// );

export default router;
