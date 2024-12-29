import { Router, Response } from 'express';
import {createOrder, getOrderById, getUserOrders, updateOrderStatus} from "../controllers/order.controller";
import { OrderRequest} from "../models/order.model";

const router = Router();

router.route('/:userId')
    .post((req: OrderRequest, res: Response) => createOrder(req, res))

router.route('/user/:userId')
    .post((req: OrderRequest, res: Response) => getUserOrders(req, res))

router.route('/:orderId')
    .post((req: OrderRequest, res: Response) => getOrderById(req, res))

router.route('/:orderId/status')
    .post((req: OrderRequest, res: Response) => updateOrderStatus(req, res))

export default router;