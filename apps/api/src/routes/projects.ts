import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { extractDomain } from '@seo-audit/shared';

const router = Router();
const prisma = new PrismaClient();

const createProjectSchema = z.object({
  name: z.string().min(1),
  domain: z.string().url(),
});

// Get all projects for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { userId: req.userId }, // Projects owned by user
          { 
            members: {
              some: {
                userId: req.userId, // Projects where user is a member
              },
            },
          },
        ],
      },
      include: {
        audits: {
          take: 1,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            status: true,
            totalScore: true,
            startedAt: true,
          },
        },
        _count: {
          select: {
            audits: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Create project
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, domain } = createProjectSchema.parse(req.body);
    const extractedDomain = extractDomain(domain);

    const project = await prisma.project.create({
      data: {
        userId: req.userId!,
        name,
        domain: extractedDomain,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Get single project
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.userId }, // User is owner
          { 
            members: {
              some: {
                userId: req.userId, // User is a member
              },
            },
          },
        ],
      },
      include: {
        audits: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            audits: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, domain } = req.body;
    
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId, // Only owner can update
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or you do not have permission to update it' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name || project.name,
        domain: domain ? extractDomain(domain) : project.domain,
      },
    });

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });

    res.json({ message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
});

export { router as projectRoutes };

