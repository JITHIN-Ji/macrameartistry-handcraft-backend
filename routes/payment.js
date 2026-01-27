import express from 'express';
import Stripe from 'stripe';
import { supabase, supabaseAdmin } from '../supabase.js';
import { verifyToken } from './auth.js';

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// CREATE PAYMENT INTENT
router.post('/create-intent', verifyToken, async (req, res) => {
  try {
    if (!stripe) return res.status(400).json({ message: 'Payment gateway not configured' });
    const { orderId } = req.body;

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error || !order) return res.status(404).json({ message: 'Order not found' });
    if (order.user_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    const paymentIntent = await stripe.paymentIntents.create({ amount: Math.round(order.total_amount * 100), currency: 'usd', metadata: { orderId: order.id, userId: req.user.id } });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error('Payment intent error:', err);
    res.status(500).json({ message: 'Failed to create payment intent', error: err.message });
  }
});

// CONFIRM PAYMENT
router.post('/confirm', verifyToken, async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    if (!stripe) return res.status(400).json({ message: 'Payment gateway not configured' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') return res.status(400).json({ message: 'Payment not successful' });

    const { data: order, error } = await (supabaseAdmin || supabase).from('orders').update({ payment_status: 'completed', stripe_payment_id: paymentIntentId, order_status: 'processing' }).eq('id', orderId).select().single();
    if (error) throw error;

    await (supabaseAdmin || supabase).from('cart_items').delete().eq('cart_id', order.cart_id || '');

    res.json({ message: 'Payment successful', order });
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ message: 'Failed to confirm payment', error: err.message });
  }
});

// HANDLE WEBHOOK
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(400).json({ message: 'Stripe not configured' });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object);
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// GET STRIPE PUBLIC KEY
router.get('/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

export default router;
