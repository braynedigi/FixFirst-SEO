import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import PayPalService from '../services/paypalService';
import { z } from 'zod';

const router = Router();

// Get current subscription & usage (authenticated)
router.get('/subscription', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const subscription = await PayPalService.getSubscription(req.userId!);
    const usage = await PayPalService.getUsageStats(req.userId!);
    res.json({ subscription, usage });
  } catch (error) {
    next(error);
  }
});

// Create subscription
router.post('/subscribe', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { planTier } = z.object({
      planTier: z.enum(['PRO', 'ENTERPRISE']),
    }).parse(req.body);

    const result = await PayPalService.createSubscription(req.userId!, planTier);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Activate subscription (after PayPal approval)
router.post('/activate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { subscriptionId } = z.object({
      subscriptionId: z.string(),
    }).parse(req.body);

    await PayPalService.activateSubscription(subscriptionId);
    res.json({ success: true, message: 'Subscription activated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await PayPalService.cancelSubscription(req.userId!);
    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get invoices
router.get('/invoices', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const invoices = await PayPalService.getInvoices(req.userId!);
    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

// Get pricing plans
router.get('/plans', (req, res) => {
  const { PRICING_PLANS } = require('../services/paypalService');
  res.json({
    plans: Object.values(PRICING_PLANS),
  });
});

// PayPal webhook endpoint (public - no authentication)
router.post('/webhook', async (req, res) => {
  try {
    console.log('PayPal webhook received:', req.body.event_type);
    await PayPalService.handleWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export { router as billingRoutes };

