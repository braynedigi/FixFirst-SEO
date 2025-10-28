import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { webhookService } from '../services/webhookService';

const router = Router();
const prisma = new PrismaClient();

const createWebhookSchema = z.object({
  projectId: z.string().optional(),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
});

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  enabled: z.boolean().optional(),
  secret: z.string().optional(),
});

// Get all webhooks for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query;

    const where: any = {};

    if (projectId) {
      // Get webhooks for specific project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId as string,
          OR: [
            { userId: req.userId },
            { members: { some: { userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } } } },
          ],
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      where.projectId = projectId;
    } else {
      // Get all webhooks for user's projects
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { userId: req.userId },
            { members: { some: { userId: req.userId } } },
          ],
        },
        select: { id: true },
      });

      where.projectId = { in: userProjects.map((p) => p.id) };
    }

    const webhooks = await prisma.webhook.findMany({
      where,
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

    res.json(webhooks);
  } catch (error) {
    next(error);
  }
});

// Create webhook
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId, url, events, secret } = createWebhookSchema.parse(req.body);

    // Verify project access
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { userId: req.userId },
            { members: { some: { userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } } } },
          ],
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found or insufficient permissions' });
      }
    }

    const webhook = await prisma.webhook.create({
      data: {
        projectId,
        url,
        events,
        secret,
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

    res.status(201).json(webhook);
  } catch (error) {
    next(error);
  }
});

// Update webhook
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { url, events, enabled, secret } = updateWebhookSchema.parse(req.body);

    // Verify webhook ownership
    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Check if user has access to the project
    if (webhook.projectId) {
      const hasAccess = await prisma.project.findFirst({
        where: {
          id: webhook.projectId,
          OR: [
            { userId: req.userId },
            { members: { some: { userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } } } },
          ],
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id: req.params.id },
      data: {
        ...(url && { url }),
        ...(events && { events }),
        ...(enabled !== undefined && { enabled }),
        ...(secret !== undefined && { secret }),
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

    res.json(updatedWebhook);
  } catch (error) {
    next(error);
  }
});

// Delete webhook
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Verify webhook ownership
    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Check if user has access to the project
    if (webhook.projectId) {
      const hasAccess = await prisma.project.findFirst({
        where: {
          id: webhook.projectId,
          OR: [
            { userId: req.userId },
            { members: { some: { userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } } } },
          ],
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    await prisma.webhook.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Test webhook
router.post('/:id/test', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Check if user has access
    if (webhook.projectId) {
      const hasAccess = await prisma.project.findFirst({
        where: {
          id: webhook.projectId,
          OR: [
            { userId: req.userId },
            { members: { some: { userId: req.userId } } },
          ],
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    // Send test webhook
    const success = await webhookService.sendWebhook(
      webhook.url,
      {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from FixFirst SEO',
          webhookId: webhook.id,
          project: webhook.project
            ? {
                id: webhook.project.id,
                name: webhook.project.name,
                domain: webhook.project.domain,
              }
            : null,
        },
      },
      webhook.secret || undefined
    );

    res.json({
      success,
      message: success ? 'Test webhook sent successfully' : 'Test webhook failed to send',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

