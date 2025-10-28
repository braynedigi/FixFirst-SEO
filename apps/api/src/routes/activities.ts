import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper function to check if user has access to project
async function checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
  // Check if user is project owner
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: userId },
  });

  if (project) {
    return true;
  }

  // Check if user is a member
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return !!member;
}

// Get activities for a project
router.get('/project/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check access
    const hasAccess = await checkProjectAccess(projectId, req.userId!);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const totalCount = await prisma.activity.count({
      where: { projectId },
    });

    res.json({
      activities,
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get recent activities for user across all their projects
router.get('/recent', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Get all projects user has access to
    const ownedProjects = await prisma.project.findMany({
      where: { userId: req.userId! },
      select: { id: true },
    });

    const memberProjects = await prisma.projectMember.findMany({
      where: { userId: req.userId! },
      select: { projectId: true },
    });

    const projectIds = [
      ...ownedProjects.map((p) => p.id),
      ...memberProjects.map((m) => m.projectId),
    ];

    const activities = await prisma.activity.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json(activities);
  } catch (error) {
    next(error);
  }
});

// Get activity statistics for a project
router.get('/project/:projectId/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;
    const { days = 30 } = req.query;

    // Check access
    const hasAccess = await checkProjectAccess(projectId, req.userId!);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Get activity counts by action
    const activities = await prisma.activity.findMany({
      where: {
        projectId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        action: true,
        createdAt: true,
      },
    });

    // Group by action
    const actionCounts = activities.reduce((acc: any, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {});

    // Group by day
    const dailyActivities = activities.reduce((acc: any, activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Get most active users
    const userActivities = await prisma.activity.groupBy({
      by: ['userId'],
      where: {
        projectId,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    const userDetails = await prisma.user.findMany({
      where: {
        id: {
          in: userActivities.map((u) => u.userId),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const mostActiveUsers = userActivities.map((ua) => ({
      user: userDetails.find((u) => u.id === ua.userId),
      count: ua._count.id,
    }));

    res.json({
      actionCounts,
      dailyActivities,
      mostActiveUsers,
      totalActivities: activities.length,
    });
  } catch (error) {
    next(error);
  }
});

export { router as activitiesRoutes };

