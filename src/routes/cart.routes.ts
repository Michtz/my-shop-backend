import { Router, Response } from 'express';
import {CartRequest} from "../models/cart.model";
import {addToCart, getCart, removeFromCart, updateCartItem} from "../controllers/cart.controller";

const router = Router();

router.route('/:userId')
    .post((req: CartRequest, res: Response) => getCart(req, res))

router.route('/:userId/items')
    .post((req: CartRequest, res: Response) => addToCart(req, res))

router.route('/:userId/items/:productId')
    .post((req: CartRequest, res: Response) => removeFromCart(req, res))

router.route('/:userId/:userId/items/:productId')
    .post((req: CartRequest, res: Response) => updateCartItem(req, res))

export default router;