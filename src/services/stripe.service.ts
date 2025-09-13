import Stripe from 'stripe';
import { env } from '../config/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export const createPaymentIntent = async (
  amount: number,
  sessionId: string,
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // cents
      currency: 'eur',
      metadata: { sessionId },
    });

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Payment failed',
    };
  }
};
