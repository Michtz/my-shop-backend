import { Router, Response, Request } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentInfo,
} from '../controllers/payment.controller';
const router = Router();

router
  .route('/create-intent/:sessionId')
  .post((req: Request, res: Response) => createPaymentIntent(req, res));

router
  .route('/confirm/:sessionId')
  .post((req: Request, res: Response) => confirmPayment(req, res));
router
  .route('/payment-info/:paymentIntentId')
  .get((req: Request, res: Response) => getPaymentInfo(req, res));

export default router;
