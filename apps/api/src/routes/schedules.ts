import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

// Get all schedules for current user
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { userId: req.userId },
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

    res.json(schedules);
  } catch (error) {
    next(error);
  }
});

// Get single schedule
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        project: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    next(error);
  }
});

// Create schedule validation schema
const createScheduleSchema = z.object({
  projectId: z.string(),
  url: z.string().url(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  nextRunAt: z.string().datetime().optional(), // ISO datetime
  isActive: z.boolean().default(true),
});

// Create new schedule
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createScheduleSchema.parse(req.body);

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId: req.userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate next run time if not provided
    let nextRunAt = data.nextRunAt ? new Date(data.nextRunAt) : new Date();
    
    if (!data.nextRunAt) {
      // Default: run tomorrow at midnight
      nextRunAt.setDate(nextRunAt.getDate() + 1);
      nextRunAt.setHours(0, 0, 0, 0);
    }

    const schedule = await prisma.schedule.create({
      data: {
        userId: req.userId!,
        projectId: data.projectId,
        url: data.url,
        frequency: data.frequency,
        nextRunAt,
        isActive: data.isActive,
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

    res.status(201).json(schedule);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map((e: any) => e.message).join(', ')
      });
    }
    next(error);
  }
});

// Update schedule
const updateScheduleSchema = z.object({
  url: z.string().url().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  nextRunAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const scheduleId = req.params.id;
    const data = updateScheduleSchema.parse(req.body);

    // Verify schedule belongs to user
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        userId: req.userId,
      },
    });

    if (!existingSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const updateData: any = {};
    if (data.url) updateData.url = data.url;
    if (data.frequency) updateData.frequency = data.frequency;
    if (data.nextRunAt) updateData.nextRunAt = new Date(data.nextRunAt);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
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

    res.json(schedule);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map((e: any) => e.message).join(', ')
      });
    }
    next(error);
  }
});

// Delete schedule
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const scheduleId = req.params.id;

    // Verify schedule belongs to user
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        userId: req.userId,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Toggle schedule active status
router.post('/:id/toggle', async (req: AuthRequest, res, next) => {
  try {
    const scheduleId = req.params.id;

    // Verify schedule belongs to user
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        userId: req.userId,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { isActive: !schedule.isActive },
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

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export { router as schedulesRoutes };

