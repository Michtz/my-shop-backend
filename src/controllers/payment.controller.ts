import { Request, Response } from 'express';
import * as StripeService from '../services/stripe.service';
import * as CartService from '../services/cart.service';

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const cartResult = await CartService.getCart(sessionId);
    if (!cartResult.success || !cartResult.data) {
      res.status(404).json({ success: false, error: 'Cart not found' });
      return;
    }

    const result = await StripeService.createPaymentIntent(
      cartResult.data.total,
      sessionId,
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { paymentIntentId } = req.body;

    // Hier später: Cart → Order Logic
    console.log('Payment confirmed:', { sessionId, paymentIntentId });

    res.status(200).json({
      success: true,
      data: { paymentConfirmed: true },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
