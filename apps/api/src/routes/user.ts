import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Change password
router.post('/password', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Get usage statistics
router.get('/usage', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current period (month for PRO/AGENCY, day for FREE)
    const now = new Date();
    const isFreePlan = user.planTier === 'FREE';
    
    let periodStart: Date;
    if (isFreePlan) {
      // Start of today
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      // Start of current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Count audits in current period
    const auditsUsed = await prisma.audit.count({
      where: {
        project: { userId: req.userId },
        startedAt: { gte: periodStart },
      },
    });

    // Get limits
    const limits = {
      FREE: 1,
      PRO: 25,
      AGENCY: 200,
    };

    const limit = limits[user.planTier as keyof typeof limits] || 1;
    const remaining = Math.max(0, limit - auditsUsed);

    // Calculate reset date
    let resetDate: Date;
    if (isFreePlan) {
      // Tomorrow at midnight
      resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else {
      // First day of next month
      resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      auditsUsed,
      auditsLimit: limit,
      auditsRemaining: remaining,
      resetDate: resetDate.toISOString(),
      daysUntilReset,
      periodType: isFreePlan ? 'daily' : 'monthly',
    });
  } catch (error) {
    next(error);
  }
});

// Generate API key
router.post('/api-key', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.planTier !== 'AGENCY') {
      return res.status(403).json({ 
        error: 'API key generation is only available for Agency plan members',
        upgrade: true,
      });
    }

    // Generate random API key
    const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Store hashed version
    await prisma.user.update({
      where: { id: req.userId },
      data: { 
        apiKeyHash,
        apiKeyCreatedAt: new Date(),
      },
    });

    // Return unhashed key (only time user sees it)
    res.json({ 
      apiKey,
      message: 'API key generated successfully. Save it now - you won\'t see it again!',
    });
  } catch (error) {
    next(error);
  }
});

// Revoke API key
router.delete('/api-key', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { 
        apiKeyHash: null,
        apiKeyCreatedAt: null,
      },
    });

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    next(error);
  }
});

// Get API key status
router.get('/api-key/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { 
        apiKeyHash: true, 
        apiKeyCreatedAt: true,
        planTier: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      hasApiKey: !!user.apiKeyHash,
      createdAt: user.apiKeyCreatedAt,
      canGenerate: user.planTier === 'AGENCY',
    });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/account', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { password } = z.object({ password: z.string() }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Delete user (cascade will delete all related data)
    await prisma.user.delete({
      where: { id: req.userId },
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Update notification preferences
router.patch('/notifications', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const preferences = z.object({
      emailNotifications: z.boolean().optional(),
      auditComplete: z.boolean().optional(),
      weeklyReport: z.boolean().optional(),
    }).parse(req.body);

    await prisma.user.update({
      where: { id: req.userId },
      data: { 
        notificationPreferences: preferences,
      },
    });

    res.json({ message: 'Notification preferences updated' });
  } catch (error) {
    next(error);
  }
});

// Get notification preferences
router.get('/notifications', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { notificationPreferences: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Default preferences if not set
    const defaultPreferences = {
      emailNotifications: true,
      auditComplete: true,
      weeklyReport: false,
    };

    res.json(user.notificationPreferences || defaultPreferences);
  } catch (error) {
    next(error);
  }
});

// Update Slack webhook URL
const slackWebhookSchema = z.object({
  webhookUrl: z.string().url().or(z.literal('')).optional(),
});

router.patch('/slack', async (req: AuthRequest, res, next) => {
  try {
    const data = slackWebhookSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { slackWebhookUrl: data.webhookUrl || null },
      select: { slackWebhookUrl: true },
    });

    res.json(user);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid webhook URL' });
    }
    next(error);
  }
});

// Get Slack webhook status
router.get('/slack', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { slackWebhookUrl: true },
    });

    res.json({ 
      webhookUrl: user?.slackWebhookUrl || null,
      configured: !!user?.slackWebhookUrl 
    });
  } catch (error) {
    next(error);
  }
});

// Test Slack webhook
router.post('/slack/test', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { slackWebhookUrl: true, email: true },
    });

    if (!user?.slackWebhookUrl) {
      return res.status(400).json({ error: 'No Slack webhook configured' });
    }

    // Send test notification
    const axios = require('axios');
    await axios.post(user.slackWebhookUrl, {
      text: '✅ Slack integration test successful!',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 FixFirst SEO - Test Notification',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Your Slack webhook is configured correctly! You'll receive notifications here when audits complete.\n\n*User:* ${user.email}`,
          },
        },
      ],
    });

    res.json({ success: true, message: 'Test notification sent' });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(400).json({ error: 'Invalid Slack webhook URL' });
    }
    next(error);
  }
});

export { router as userRoutes };

