import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';

const router = Router();

router.post('/create-intent/:sessionId', PaymentController.createPaymentIntent);
router.post('/confirm/:sessionId', PaymentController.confirmPayment);

export default router;
