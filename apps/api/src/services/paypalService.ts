/**
 * PayPal Billing Service
 * 
 * Handles PayPal subscription management, payments, and webhooks
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Plan pricing configuration
export const PRICING_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    limits: {
      projects: 1,
      auditsPerMonth: 10,
      teamMembers: 1,
      keywords: 10,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Professional',
    price: 29,
    currency: 'USD',
    paypalPlanId: process.env.PAYPAL_PRO_PLAN_ID,
    limits: {
      projects: 10,
      auditsPerMonth: 100,
      teamMembers: 5,
      keywords: 100,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    currency: 'USD',
    paypalPlanId: process.env.PAYPAL_ENTERPRISE_PLAN_ID,
    limits: {
      projects: -1, // Unlimited
      auditsPerMonth: -1, // Unlimited
      teamMembers: -1, // Unlimited
      keywords: -1, // Unlimited
    },
  },
};

export class PayPalService {
  /**
   * Get PayPal access token
   */
  static async getAccessToken(): Promise<string> {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  }

  /**
   * Create a PayPal subscription
   */
  static async createSubscription(userId: string, planTier: 'PRO' | 'ENTERPRISE') {
    const accessToken = await this.getAccessToken();
    const plan = PRICING_PLANS[planTier];

    if (!plan.paypalPlanId) {
      throw new Error(`PayPal plan ID not configured for ${planTier}`);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Create PayPal subscription
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions`,
      {
        plan_id: plan.paypalPlanId,
        subscriber: {
          email_address: user.email,
        },
        application_context: {
          brand_name: 'FixFirst SEO',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.FRONTEND_URL}/billing/success`,
          cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paypalSubscriptionId = response.data.id;
    const approvalUrl = response.data.links.find((link: any) => link.rel === 'approve')?.href;

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId,
        planTier,
        status: 'INACTIVE', // Will be ACTIVE after approval
        paypalSubscriptionId,
        paypalPlanId: plan.paypalPlanId,
        amount: plan.price,
        currency: plan.currency,
        billingCycle: 'MONTHLY',
        startDate: new Date(),
      },
    });

    return {
      subscriptionId: paypalSubscriptionId,
      approvalUrl,
    };
  }

  /**
   * Activate subscription after PayPal approval
   */
  static async activateSubscription(paypalSubscriptionId: string) {
    const accessToken = await this.getAccessToken();

    // Get subscription details from PayPal
    const response = await axios.get(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${paypalSubscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const status = response.data.status;
    
    // Update database
    const subscription = await prisma.subscription.findFirst({
      where: { paypalSubscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      },
    });

    // Update user plan
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        planTier: subscription.planTier,
        paypalSubscriptionId,
        subscriptionStatus: status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      },
    });

    return { status };
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.paypalSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const accessToken = await this.getAccessToken();

    // Cancel in PayPal
    await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}/cancel`,
      {
        reason: 'Customer requested cancellation',
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update database
    await prisma.subscription.updateMany({
      where: {
        userId,
        paypalSubscriptionId: user.paypalSubscriptionId,
      },
      data: {
        status: 'CANCELLED',
        canceledAt: new Date(),
        endDate: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        planTier: 'FREE',
        subscriptionStatus: 'CANCELLED',
        subscriptionEndsAt: new Date(),
      },
    });
  }

  /**
   * Get subscription details
   */
  static async getSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscription;
  }

  /**
   * Get usage statistics for a user
   */
  static async getUsageStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [projectCount, auditCount, teamMemberCount, keywordCount] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.audit.count({
        where: {
          project: { userId },
          startedAt: { gte: startOfMonth },
        },
      }),
      prisma.projectMember.count({
        where: { project: { userId } },
      }),
      prisma.keyword.count({
        where: { project: { userId } },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true },
    });

    const plan = PRICING_PLANS[user?.planTier || 'FREE'];

    return {
      current: {
        projects: projectCount,
        audits: auditCount,
        teamMembers: teamMemberCount,
        keywords: keywordCount,
      },
      limits: plan.limits,
      plan: {
        tier: user?.planTier,
        name: plan.name,
        price: plan.price,
      },
    };
  }

  /**
   * Check if user can perform action based on plan limits
   */
  static async canPerformAction(userId: string, action: 'create_project' | 'run_audit' | 'add_member' | 'add_keyword'): Promise<boolean> {
    const stats = await this.getUsageStats(userId);
    const { current, limits } = stats;

    switch (action) {
      case 'create_project':
        return limits.projects === -1 || current.projects < limits.projects;
      case 'run_audit':
        return limits.auditsPerMonth === -1 || current.audits < limits.auditsPerMonth;
      case 'add_member':
        return limits.teamMembers === -1 || current.teamMembers < limits.teamMembers;
      case 'add_keyword':
        return limits.keywords === -1 || current.keywords < limits.keywords;
      default:
        return false;
    }
  }

  /**
   * Get invoices for a user
   */
  static async getInvoices(userId: string) {
    return await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Handle PayPal webhook events
   */
  static async handleWebhook(event: any) {
    const eventType = event.event_type;
    const resource = event.resource;

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await this.handleSubscriptionActivated(resource);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await this.handleSubscriptionCancelled(resource);
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await this.handleSubscriptionSuspended(resource);
        break;
      case 'PAYMENT.SALE.COMPLETED':
        await this.handlePaymentCompleted(resource);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }
  }

  private static async handleSubscriptionActivated(resource: any) {
    const paypalSubscriptionId = resource.id;
    
    await prisma.subscription.updateMany({
      where: { paypalSubscriptionId },
      data: { status: 'ACTIVE' },
    });

    const subscription = await prisma.subscription.findFirst({
      where: { paypalSubscriptionId },
    });

    if (subscription) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: {
          subscriptionStatus: 'ACTIVE',
          planTier: subscription.planTier,
        },
      });
    }
  }

  private static async handleSubscriptionCancelled(resource: any) {
    const paypalSubscriptionId = resource.id;
    
    await prisma.subscription.updateMany({
      where: { paypalSubscriptionId },
      data: {
        status: 'CANCELLED',
        canceledAt: new Date(),
      },
    });

    const subscription = await prisma.subscription.findFirst({
      where: { paypalSubscriptionId },
    });

    if (subscription) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: {
          subscriptionStatus: 'CANCELLED',
          planTier: 'FREE',
        },
      });
    }
  }

  private static async handleSubscriptionSuspended(resource: any) {
    const paypalSubscriptionId = resource.id;
    
    await prisma.subscription.updateMany({
      where: { paypalSubscriptionId },
      data: { status: 'SUSPENDED' },
    });

    const subscription = await prisma.subscription.findFirst({
      where: { paypalSubscriptionId },
    });

    if (subscription) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: {
          subscriptionStatus: 'SUSPENDED',
        },
      });
    }
  }

  private static async handlePaymentCompleted(resource: any) {
    const amount = parseFloat(resource.amount.total);
    const subscriptionId = resource.billing_agreement_id;

    const subscription = await prisma.subscription.findFirst({
      where: { paypalSubscriptionId: subscriptionId },
    });

    if (subscription) {
      await prisma.invoice.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          paypalInvoiceId: resource.id,
          amount,
          currency: resource.amount.currency,
          status: 'PAID',
          description: `Payment for ${subscription.planTier} plan`,
          paidAt: new Date(resource.create_time),
        },
      });
    }
  }
}

export default PayPalService;

