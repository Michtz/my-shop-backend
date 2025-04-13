import { Router, Response } from 'express';
import { CartRequest } from '../models/cart.model';
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCartItem,
  updateCartUserInfo,
  updateCartAddress,
  updateCartPayment,
  updateCartGuestInfo,
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
  .route('/:sessionId')
  .delete((req: CartRequest, res: Response) => removeFromCart(req, res));

router
  .route('/:sessionId/:productId')
  .put((req: CartRequest, res: Response) => updateCartItem(req, res));

// Benutzerinformationen Todo: move => in separat file
router
  .route('/:sessionId/user')
  .put((req: CartRequest, res: Response) => updateCartUserInfo(req, res));

router
  .route('/:sessionId/address')
  .put((req: CartRequest, res: Response) => updateCartAddress(req, res));

router
  .route('/:sessionId/payment/:paymentId')
  .put((req: CartRequest, res: Response) => updateCartPayment(req, res));

router
  .route('/:sessionId/guestInfo')
  .put((req: CartRequest, res: Response) => updateCartGuestInfo(req, res));

export default router;
