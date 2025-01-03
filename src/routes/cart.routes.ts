import { Router, Response } from 'express';
import { CartRequest } from '../models/cart.model';
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from '../controllers/cart.controller';

const router = Router();

router
  .route('/:sessionId')
  .post((req: CartRequest, res: Response) => createCart(req, res));

router
  .route('/:sessionId')
  .get((req: CartRequest, res: Response) => getCart(req, res));

router
  .route('/:sessionId')
  .put((req: CartRequest, res: Response) => addToCart(req, res));

router
  .route('/:sessionId/:productId')
  .delete((req: CartRequest, res: Response) => removeFromCart(req, res));

router
  .route('/:sessionId/:productId')
  .put((req: CartRequest, res: Response) => updateCartItem(req, res));

export default router;
