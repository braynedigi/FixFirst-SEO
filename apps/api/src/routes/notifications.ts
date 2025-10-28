import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { notificationService } from '../services/notificationService';

const router = Router();
const prisma = new PrismaClient();

const createRuleSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().min(1),
  event: z.string().min(1),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains']),
    value: z.any(),
  })),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'SLACK', 'WEBHOOK'])),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains']),
    value: z.any(),
  })).optional(),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'SLACK', 'WEBHOOK'])).optional(),
  enabled: z.boolean().optional(),
});

// Get all notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status, limit, offset } = req.query;

    const notifications = await notificationService.getNotifications(req.userId!, {
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.userId!);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/mark-all-read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Archive notification
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await notificationService.archiveNotification(req.params.id, req.userId!);
    res.json({ message: 'Notification archived' });
  } catch (error) {
    next(error);
  }
});

// ===== NOTIFICATION RULES =====

// Get all notification rules for current user
router.get('/rules', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query;

    const rules = await prisma.notificationRule.findMany({
      where: {
        userId: req.userId!,
        ...(projectId && { projectId: projectId as string }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rules);
  } catch (error) {
    next(error);
  }
});

// Create notification rule
router.post('/rules', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId, name, event, conditions, channels } = createRuleSchema.parse(req.body);

    // Verify project access if projectId is provided
    if (projectId) {
      const hasAccess = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { userId: req.userId },
            { members: { some: { userId: req.userId } } },
          ],
        },
      });

      if (!hasAccess) {
        return res.status(404).json({ error: 'Project not found or insufficient permissions' });
      }
    }

    const rule = await prisma.notificationRule.create({
      data: {
        userId: req.userId!,
        projectId,
        name,
        event,
        conditions,
        channels,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

// Update notification rule
router.put('/rules/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, conditions, channels, enabled } = updateRuleSchema.parse(req.body);

    // Verify rule ownership
    const rule = await prisma.notificationRule.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Notification rule not found' });
    }

    const updatedRule = await prisma.notificationRule.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(conditions && { conditions }),
        ...(channels && { channels }),
        ...(enabled !== undefined && { enabled }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    res.json(updatedRule);
  } catch (error) {
    next(error);
  }
});

// Delete notification rule
router.delete('/rules/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Verify rule ownership
    const rule = await prisma.notificationRule.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Notification rule not found' });
    }

    await prisma.notificationRule.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Notification rule deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

