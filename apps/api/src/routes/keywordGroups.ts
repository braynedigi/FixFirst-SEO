import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

const createGroupSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional(),
});

// Get all groups for a project
router.get('/project/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId!,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const groups = await prisma.keywordGroup.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { keywords: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(groups);
  } catch (error) {
    next(error);
  }
});

// Create keyword group
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createGroupSchema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId!,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const group = await prisma.keywordGroup.create({
      data,
      include: {
        _count: {
          select: { keywords: true },
        },
      },
    });

    res.status(201).json(group);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e: any) => e.message).join(', '),
      });
    }
    next(error);
  }
});

// Update keyword group
router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = z.object({
      name: z.string().min(1).optional(),
      color: z.string().optional(),
      description: z.string().optional(),
    }).parse(req.body);

    const group = await prisma.keywordGroup.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId: req.userId },
            {
              members: {
                some: {
                  userId: req.userId!,
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                },
              },
            },
          ],
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const updated = await prisma.keywordGroup.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { keywords: true },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e: any) => e.message).join(', '),
      });
    }
    next(error);
  }
});

// Delete keyword group
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const group = await prisma.keywordGroup.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId: req.userId },
            {
              members: {
                some: {
                  userId: req.userId!,
                  role: { in: ['OWNER', 'ADMIN'] },
                },
              },
            },
          ],
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await prisma.keywordGroup.delete({
      where: { id },
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as keywordGroupsRoutes };

