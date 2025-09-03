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
  replaceCartItems,
} from '../controllers/cart.controller';

// works as intended
const router = Router();

router
  .route('/:sessionId/guestInfo')
  .put((req: CartRequest, res: Response) => updateCartGuestInfo(req, res));

router
  .route('/:sessionId/user')
  .put((req: CartRequest, res: Response) => updateCartUserInfo(req, res));

router
  .route('/:sessionId/address')
  .put((req: CartRequest, res: Response) => updateCartAddress(req, res));

router
  .route('/:sessionId/items')
  .put((req: CartRequest, res: Response) => replaceCartItems(req, res));

router
  .route('/:sessionId/payment/:paymentId')
  .put((req: CartRequest, res: Response) => updateCartPayment(req, res));

router
  .route('/:sessionId/product/:productId')
  .put((req: CartRequest, res: Response) => updateCartItem(req, res));

router
  .route('/:sessionId')
  .post((req: CartRequest, res: Response) => createCart(req, res));

router
  .route('/:sessionId/:userId')
  .get((req: CartRequest, res: Response) => getCart(req, res))
  .put((req: CartRequest, res: Response) => addToCart(req, res))
  .delete((req: CartRequest, res: Response) => removeFromCart(req, res)); // Todo: fix routing and pass props in body to simplefy if time

router // remove old
  .route('/:sessionId')
  .get((req: CartRequest, res: Response) => getCart(req, res))
  .put((req: CartRequest, res: Response) => addToCart(req, res))
  .delete((req: CartRequest, res: Response) => removeFromCart(req, res));

export default router;
