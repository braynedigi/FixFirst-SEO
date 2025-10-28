import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all goals for a project
router.get('/project/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const goals = await prisma.goal.findMany({
      where: { projectId },
      orderBy: [
        { achieved: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(goals);
  } catch (error) {
    next(error);
  }
});

// Get a specific goal
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify project access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: goal.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(goal);
  } catch (error) {
    next(error);
  }
});

// Create a new goal
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId, name, targetScore, category, deadline, description } = req.body;

    // Validate required fields
    if (!projectId || !name || !targetScore) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate target score
    if (targetScore < 0 || targetScore > 100) {
      return res.status(400).json({ error: 'Target score must be between 0 and 100' });
    }

    // Verify project access and owner/admin role
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        ],
      },
      include: {
        members: {
          where: { userId: req.userId },
        },
      },
    });

    if (!project) {
      return res.status(403).json({ error: 'Access denied or insufficient permissions' });
    }

    const goal = await prisma.goal.create({
      data: {
        projectId,
        name,
        targetScore,
        category: category || 'OVERALL',
        deadline: deadline ? new Date(deadline) : null,
        description: description || null,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        projectId,
        userId: req.userId!,
        action: 'GOAL_CREATED',
        description: `Created goal: ${name}`,
        metadata: { goalId: goal.id, targetScore },
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
});

// Update a goal
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { name, targetScore, category, deadline, description } = req.body;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify project access and owner/admin role
    const hasPermission = await prisma.project.findFirst({
      where: {
        id: goal.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        ],
      },
    });

    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied or insufficient permissions' });
    }

    // Validate target score if provided
    if (targetScore !== undefined && (targetScore < 0 || targetScore > 100)) {
      return res.status(400).json({ error: 'Target score must be between 0 and 100' });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(targetScore !== undefined && { targetScore }),
        ...(category && { category }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(description !== undefined && { description }),
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        projectId: goal.projectId,
        userId: req.userId!,
        action: 'GOAL_UPDATED',
        description: `Updated goal: ${updatedGoal.name}`,
        metadata: { goalId: updatedGoal.id },
      },
    });

    res.json(updatedGoal);
  } catch (error) {
    next(error);
  }
});

// Delete a goal
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify project access and owner/admin role
    const hasPermission = await prisma.project.findFirst({
      where: {
        id: goal.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        ],
      },
    });

    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied or insufficient permissions' });
    }

    await prisma.goal.delete({
      where: { id },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        projectId: goal.projectId,
        userId: req.userId!,
        action: 'GOAL_DELETED',
        description: `Deleted goal: ${goal.name}`,
        metadata: { goalId: goal.id },
      },
    });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Check and update goal achievement status
router.post('/:id/check', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            audits: {
              where: { status: 'COMPLETED' },
              orderBy: { completedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify project access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: goal.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (goal.achieved) {
      return res.json({ achieved: true, goal });
    }

    // Get latest audit
    const latestAudit = goal.project.audits[0];
    if (!latestAudit) {
      return res.json({ achieved: false, message: 'No completed audits available' });
    }

    // Check if goal is achieved
    let currentScore = 0;
    switch (goal.category) {
      case 'OVERALL':
        currentScore = latestAudit.totalScore || 0;
        break;
      case 'PERFORMANCE':
        currentScore = latestAudit.performanceScore || 0;
        break;
      case 'TECHNICAL':
        currentScore = latestAudit.technicalScore || 0;
        break;
      case 'ON_PAGE':
        currentScore = latestAudit.onPageScore || 0;
        break;
      case 'STRUCTURED_DATA':
        currentScore = latestAudit.structuredDataScore || 0;
        break;
      case 'LOCAL_SEO':
        currentScore = latestAudit.localSeoScore || 0;
        break;
    }

    if (currentScore >= goal.targetScore) {
      // Goal achieved!
      const updatedGoal = await prisma.goal.update({
        where: { id },
        data: {
          achieved: true,
          achievedAt: new Date(),
          achievedScore: currentScore,
        },
      });

      // Create activity log
      await prisma.activity.create({
        data: {
          projectId: goal.projectId,
          userId: req.userId!,
          action: 'GOAL_ACHIEVED',
          description: `Goal achieved: ${goal.name} (${currentScore}/${goal.targetScore})`,
          metadata: { goalId: goal.id, achievedScore: currentScore },
        },
      });

      // TODO: Send notification to project members
      // This can be integrated with the notification service

      return res.json({ achieved: true, goal: updatedGoal, currentScore });
    }

    res.json({ achieved: false, currentScore, targetScore: goal.targetScore });
  } catch (error) {
    next(error);
  }
});

// Get goal progress (current vs target)
router.get('/:id/progress', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            audits: {
              where: { status: 'COMPLETED' },
              orderBy: { completedAt: 'desc' },
              take: 10, // Last 10 audits for trend
            },
          },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify project access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: goal.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate progress over time
    const progress = goal.project.audits.map((audit) => {
      let score = 0;
      switch (goal.category) {
        case 'OVERALL':
          score = audit.totalScore || 0;
          break;
        case 'PERFORMANCE':
          score = audit.performanceScore || 0;
          break;
        case 'TECHNICAL':
          score = audit.technicalScore || 0;
          break;
        case 'ON_PAGE':
          score = audit.onPageScore || 0;
          break;
        case 'STRUCTURED_DATA':
          score = audit.structuredDataScore || 0;
          break;
        case 'LOCAL_SEO':
          score = audit.localSeoScore || 0;
          break;
      }

      return {
        date: audit.completedAt,
        score,
        targetScore: goal.targetScore,
      };
    }).reverse(); // Oldest to newest

    const currentScore = progress.length > 0 ? progress[progress.length - 1].score : 0;
    const percentage = (currentScore / goal.targetScore) * 100;

    res.json({
      goal,
      currentScore,
      targetScore: goal.targetScore,
      percentage: Math.min(percentage, 100),
      progress,
      achieved: goal.achieved,
    });
  } catch (error) {
    next(error);
  }
});

export { router as goalsRoutes };

