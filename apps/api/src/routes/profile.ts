import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        role: true,
        planTier: true,
        createdAt: true,
        updatedAt: true,
        notificationPreferences: true,
        slackWebhookUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile (email only for now)
const updateProfileSchema = z.object({
  email: z.string().email().optional(),
});

router.put('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    // Check if email is already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: {
            id: req.userId,
          },
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        planTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`✅ User profile updated: ${req.userId}`);
    res.json(updatedUser);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    next(error);
  }
});

// Change password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/change-password', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    console.log(`✅ Password changed for user: ${req.userId}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    next(error);
  }
});

// Update notification preferences
const notificationPreferencesSchema = z.object({
  auditComplete: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  teamInvitations: z.boolean().optional(),
  projectActivity: z.boolean().optional(),
});

router.put('/notifications', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const preferences = notificationPreferencesSchema.parse(req.body);

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { notificationPreferences: true },
    });

    const currentPrefs = (user?.notificationPreferences || {}) as any;

    // Merge with new preferences
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
    };

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        notificationPreferences: updatedPrefs,
      },
    });

    console.log(`✅ Notification preferences updated for user: ${req.userId}`);
    res.json({ preferences: updatedPrefs });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
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

    const preferences = (user?.notificationPreferences || {
      auditComplete: true,
      weeklyDigest: true,
      teamInvitations: true,
      projectActivity: true,
    }) as any;

    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

// Update Slack webhook
const slackWebhookSchema = z.object({
  webhookUrl: z.string().url().optional().nullable(),
});

router.put('/slack', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = slackWebhookSchema.parse(req.body);

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        slackWebhookUrl: data.webhookUrl,
      },
    });

    console.log(`✅ Slack webhook updated for user: ${req.userId}`);
    res.json({ message: 'Slack webhook updated successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    next(error);
  }
});

export { router as profileRoutes };

