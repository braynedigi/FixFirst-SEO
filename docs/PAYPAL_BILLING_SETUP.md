# 💰 PayPal Billing System - Complete Implementation Guide

## 🎉 **What's Been Implemented**

### ✅ Phase 3 Progress (2/3 Complete)

1. **Database Schema** ✅
   - Subscription management tables
   - Invoice tracking
   - User subscription fields
   - Status enums

2. **PayPal Service** ✅
   - Complete PayPal API integration
   - Subscription lifecycle management
   - Usage limit enforcement
   - Webhook handling

3. **Frontend UI** ⏳ (Next step)
   - Pricing page
   - Subscription management
   - Usage dashboard
   - Payment flow

---

## 📋 **Pricing Tiers**

| Feature | FREE | PRO ($29/mo) | ENTERPRISE ($99/mo) |
|---------|------|--------------|---------------------|
| Projects | 1 | 10 | Unlimited |
| Audits/Month | 10 | 100 | Unlimited |
| Team Members | 1 | 5 | Unlimited |
| Keywords | 10 | 100 | Unlimited |
| Analytics | ✅ | ✅ | ✅ |
| 2FA | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| White Label | ❌ | ❌ | ✅ |

---

## 🔧 **Setup Instructions**

### 1. Create PayPal Business Account

1. Go to https://www.paypal.com/businessmanage
2. Sign up for a Business account
3. Complete verification

### 2. Create Subscription Plans in PayPal

1. Log into PayPal Business
2. Go to Products & Services → Subscription Plans
3. Create two plans:
   - **PRO Plan**: $29/month
   - **ENTERPRISE Plan**: $99/month
4. Copy the Plan IDs

### 3. Get API Credentials

1. Go to https://developer.paypal.com/
2. Log in with your PayPal account
3. Go to **My Apps & Credentials**
4. Create a new app or use existing
5. Copy **Client ID** and **Secret**

### 4. Configure Environment Variables

Add to your API `.env` file:

```bash
# PayPal Configuration
PAYPAL_MODE=sandbox  # Use 'live' for production
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_PRO_PLAN_ID=P-XXXXXXXXXXXX  # From step 2
PAYPAL_ENTERPRISE_PLAN_ID=P-YYYYYYYYYYYY  # From step 2
```

### 5. Set Up Webhooks

1. In PayPal Developer Dashboard, go to your app
2. Add Webhook URL: `https://yourdomain.com/api/billing/webhook`
3. Subscribe to these events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `PAYMENT.SALE.COMPLETED`

---

## 🚀 **Next Steps to Complete Phase 3**

### API Routes Needed (15 min)

Create `apps/api/src/routes/billing.ts`:

```typescript
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import PayPalService from '../services/paypalService';

const router = Router();
router.use(authenticate);

// Get current subscription & usage
router.get('/subscription', async (req: AuthRequest, res, next) => {
  try {
    const subscription = await PayPalService.getSubscription(req.userId!);
    const usage = await PayPalService.getUsageStats(req.userId!);
    res.json({ subscription, usage });
  } catch (error) {
    next(error);
  }
});

// Create subscription
router.post('/subscribe', async (req: AuthRequest, res, next) => {
  try {
    const { planTier } = req.body;
    const result = await PayPalService.createSubscription(req.userId!, planTier);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Activate subscription (after PayPal approval)
router.post('/activate', async (req: AuthRequest, res, next) => {
  try {
    const { subscriptionId } = req.body;
    await PayPalService.activateSubscription(subscriptionId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
router.post('/cancel', async (req: AuthRequest, res, next) => {
  try {
    await PayPalService.cancelSubscription(req.userId!);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get invoices
router.get('/invoices', async (req: AuthRequest, res, next) => {
  try {
    const invoices = await PayPalService.getInvoices(req.userId!);
    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

// PayPal webhook endpoint (public)
router.post('/webhook', async (req, res) => {
  try {
    await PayPalService.handleWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export { router as billingRoutes };
```

Add to `server.ts`:
```typescript
import { billingRoutes } from './routes/billing';
app.use('/api/billing', billingRoutes);
```

### Frontend Components Needed (30-45 min)

1. **Pricing Page** (`apps/web/app/pricing/page.tsx`)
   - Display 3 pricing tiers
   - "Subscribe" buttons
   - Feature comparison table

2. **Billing Dashboard** (`apps/web/app/billing/page.tsx`)
   - Current plan display
   - Usage statistics with progress bars
   - Upgrade/downgrade buttons
   - Cancel subscription
   - Invoice history

3. **API Client** (`apps/web/lib/api.ts`)
```typescript
export const billingApi = {
  getSubscription: () => api.get('/api/billing/subscription'),
  subscribe: (planTier: 'PRO' | 'ENTERPRISE') => 
    api.post('/api/billing/subscribe', { planTier }),
  activate: (subscriptionId: string) => 
    api.post('/api/billing/activate', { subscriptionId }),
  cancel: () => api.post('/api/billing/cancel'),
  getInvoices: () => api.get('/api/billing/invoices'),
};
```

---

## 🔐 **Usage Limit Enforcement**

The system automatically enforces limits. Example usage:

```typescript
// Before creating a project
const canCreate = await PayPalService.canPerformAction(userId, 'create_project');
if (!canCreate) {
  return res.status(403).json({ 
    error: 'Project limit reached. Upgrade to PRO or ENTERPRISE.' 
  });
}
```

Apply this check in:
- Project creation route
- Audit creation route
- Team member invitation route
- Keyword creation route

---

## 📊 **Testing PayPal Integration**

### Sandbox Testing

1. Use PayPal Sandbox accounts
2. Test subscription flow:
   - Click "Subscribe to PRO"
   - Complete PayPal checkout
   - Return to app
   - Verify plan activated

3. Test cancellation:
   - Click "Cancel Subscription"
   - Verify downgrade to FREE

### Production Checklist

- [ ] Switch `PAYPAL_MODE` to `live`
- [ ] Use production PayPal credentials
- [ ] Update webhook URL to production domain
- [ ] Test with real PayPal account
- [ ] Monitor webhook logs

---

## 🎨 **UI Design Recommendations**

### Pricing Page
- Clean, modern cards
- Highlight "MOST POPULAR" plan
- Clear feature comparisons
- Trust badges (SSL, Money-back guarantee)

### Billing Dashboard
- Usage progress bars with colors:
  - Green: < 70% used
  - Orange: 70-90% used
  - Red: > 90% used
- "Upgrade Now" CTA when limits approached
- Invoice table with download links

---

## 🐛 **Common Issues & Solutions**

### Issue: "PayPal credentials not configured"
**Solution:** Add `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` to `.env`

### Issue: Subscription not activating
**Solution:** 
1. Check webhook is configured
2. Verify webhook URL is accessible
3. Check API server logs for webhook events

### Issue: "Plan ID not found"
**Solution:** Add `PAYPAL_PRO_PLAN_ID` and `PAYPAL_ENTERPRISE_PLAN_ID` to `.env`

---

## 📈 **Future Enhancements**

- [ ] Annual billing (20% discount)
- [ ] Promo codes & discounts
- [ ] Free trial (7 or 14 days)
- [ ] Pay-as-you-go for overages
- [ ] Team billing (seat-based pricing)
- [ ] Usage alerts (email when 80% used)
- [ ] Referral program
- [ ] Multi-currency support

---

## 🎯 **Estimated Completion Time**

- **API Routes**: 15 minutes
- **Frontend UI**: 45 minutes
- **Testing**: 30 minutes
- **Total**: ~90 minutes

---

## 📞 **Support**

For PayPal integration issues:
- PayPal Developer Docs: https://developer.paypal.com/docs/
- PayPal Support: https://www.paypal.com/us/smarthelp/contact-us

---

**Status**: Backend Complete ✅ | Frontend Pending ⏳  
**Last Updated**: October 29, 2025  
**Version**: 1.0.0

