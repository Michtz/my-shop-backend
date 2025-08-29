import { Router, Response, Request } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
} from '../controllers/payment.controller';
const router = Router();

router
  .route('/create-intent/:sessionId')
  .post((req: Request, res: Response) => createPaymentIntent(req, res));

router
  .route('/confirm/:sessionId')
  .post((req: Request, res: Response) => confirmPayment(req, res));

export default router;
