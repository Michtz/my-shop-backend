import { Request, Response } from 'express';
import * as StripeService from '../services/stripe.service';
import * as CartService from '../services/cart.service';
import * as OrderService from '../services/order.service';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

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
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!sessionId || !paymentIntentId) {
      res.status(400).json({
        success: false,
        error: 'Session ID and Payment Intent ID are required',
      });
      return;
    }

    // Get payment method details from Stripe
    let paymentMethodDetails: { last4: string; brand: string; paymentMethodId: string } | null = null;
    if (paymentMethodId) {
      try {
        const paymentMethod =
          await stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod.card) {
          paymentMethodDetails = {
            last4: paymentMethod.card.last4,
            brand: paymentMethod.card.brand,
            paymentMethodId: paymentMethodId,
          };
        }
      } catch (error) {
        console.error('Failed to retrieve payment method:', error);
      }
    }

    // Create order from cart with payment details
    const orderResult = await OrderService.createOrderFromCart(
      sessionId,
      paymentIntentId,
      paymentMethodDetails,
    );

    if (!orderResult.success) {
      res.status(400).json({
        success: false,
        error: orderResult.error || 'Order creation failed',
      });
      return;
    }

    console.log('Payment confirmed and order created:', {
      sessionId,
      paymentIntentId,
      orderNumber: orderResult?.orderNumber,
    });

    res.status(200).json({
      success: true,
      data: {
        paymentConfirmed: true,
        orderNumber: orderResult?.orderNumber,
        order: orderResult.data,
      },
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during payment confirmation',
    });
  }
};
