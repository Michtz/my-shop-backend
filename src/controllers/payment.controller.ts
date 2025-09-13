import { Request, Response } from 'express';
import * as StripeService from '../services/stripe.service';
import * as CartService from '../services/cart.service';
import * as OrderService from '../services/order.service';
import { env } from '../config/env';
import Stripe from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

const validateSessionId = (sessionId: unknown): string => {
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new Error('Invalid session ID');
  }
  return sessionId.trim();
};

const validatePaymentData = (
  data: any,
): { paymentIntentId: string; paymentMethodId?: string } => {
  const { paymentIntentId, paymentMethodId } = data;

  if (typeof paymentIntentId !== 'string' || !paymentIntentId.trim()) {
    throw new Error('Payment Intent ID is required and must be a valid string');
  }

  if (paymentMethodId && typeof paymentMethodId !== 'string') {
    throw new Error('Payment Method ID must be a string if provided');
  }

  return {
    paymentIntentId: paymentIntentId.trim(),
    paymentMethodId: paymentMethodId?.trim(),
  };
};

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const sessionId = validateSessionId(req.params.sessionId);

    const cartResult = await CartService.getCart(sessionId);
    if (!cartResult.success || !cartResult.data) {
      res.status(404).json({ success: false, error: 'Cart not found' });
      return;
    }

    // Validate cart total
    if (cartResult.data.total <= 0) {
      res
        .status(400)
        .json({ success: false, error: 'Cart total must be greater than 0' });
      return;
    }

    // Validate cart has items
    if (!cartResult.data.items || cartResult.data.items.length === 0) {
      res.status(400).json({ success: false, error: 'Cart is empty' });
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
export const getPaymentInfo = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Payment Intent ID is required',
      });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const paymentInfo = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: paymentIntent.created,
      clientSecret: paymentIntent.client_secret,
      paymentMethod: paymentIntent.payment_method,
      metadata: paymentIntent.metadata,
    };

    res.status(200).json({
      success: true,
      data: paymentInfo,
    });
  } catch (error) {
    console.error('Error retrieving payment info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment information',
    });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const sessionId = validateSessionId(req.params.sessionId);
    const { paymentIntentId, paymentMethodId } = validatePaymentData(req.body);

    // Get payment method details from Stripe
    let paymentMethodDetails: {
      last4: string;
      brand: string;
      paymentMethodId: string;
    } | null = null;
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

    const order = orderResult.data as any;
    const orderNumber = order?.orderNumber;

    res.status(200).json({
      success: true,
      data: {
        paymentConfirmed: true,
        orderNumber: orderNumber,
        order: orderResult.data,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error during payment confirmation',
    });
  }
};
