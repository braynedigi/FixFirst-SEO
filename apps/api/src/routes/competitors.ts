import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createCompetitorSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
});

// Get all competitors for a project
router.get('/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project access
    const project = await prisma.project.findFirst({
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

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const competitors = await prisma.competitor.findMany({
      where: { projectId },
      include: {
        snapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            snapshots: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(competitors);
  } catch (error) {
    next(error);
  }
});

// Add a competitor to a project
router.post('/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, domain } = createCompetitorSchema.parse(req.body);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
                role: {
                  in: ['OWNER', 'ADMIN'],
                },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Check if competitor already exists
    const existing = await prisma.competitor.findUnique({
      where: {
        projectId_domain: {
          projectId,
          domain,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Competitor already exists for this project' });
    }

    const competitor = await prisma.competitor.create({
      data: {
        projectId,
        name,
        domain,
      },
    });

    res.status(201).json(competitor);
  } catch (error) {
    next(error);
  }
});

// Delete a competitor
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Get competitor with project
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    // Verify project access (only owners/admins can delete)
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: competitor.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
                role: {
                  in: ['OWNER', 'ADMIN'],
                },
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.competitor.delete({ where: { id } });

    res.json({ message: 'Competitor deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get competitor snapshots (historical data)
router.get('/:id/snapshots', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { limit = '30' } = req.query;

    // Get competitor with project
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    // Verify project access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: competitor.projectId,
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

    const snapshots = await prisma.competitorSnapshot.findMany({
      where: { competitorId: id },
      orderBy: { capturedAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ snapshots: snapshots.reverse() }); // Oldest to newest
  } catch (error) {
    next(error);
  }
});

// Create a competitor snapshot (manual audit)
router.post('/:id/snapshot', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { totalScore, technicalScore, onPageScore, structuredDataScore, performanceScore, localSeoScore, metadata } =
      req.body;

    // Get competitor with project
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    // Verify project access (only owners/admins/members can create snapshots)
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: competitor.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId,
                role: {
                  in: ['OWNER', 'ADMIN', 'MEMBER'],
                },
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snapshot = await prisma.competitorSnapshot.create({
      data: {
        competitorId: id,
        totalScore,
        technicalScore,
        onPageScore,
        structuredDataScore,
        performanceScore,
        localSeoScore,
        metadata: metadata || {},
      },
    });

    // Update competitor's lastAuditedAt
    await prisma.competitor.update({
      where: { id },
      data: { lastAuditedAt: new Date() },
    });

    res.status(201).json(snapshot);
  } catch (error) {
    next(error);
  }
});

// Compare project with competitors
router.get('/:projectId/compare', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project access
    const project = await prisma.project.findFirst({
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

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get latest audit for the project
    const latestAudit = await prisma.audit.findFirst({
      where: {
        projectId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
    });

    if (!latestAudit) {
      return res.json({
        project: null,
        competitors: [],
        message: 'No completed audits found for this project',
      });
    }

    // Get all competitors with their latest snapshots
    const competitors = await prisma.competitor.findMany({
      where: {
        projectId,
        isActive: true,
      },
      include: {
        snapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Format comparison data
    const competitorData = competitors.map((comp) => ({
      id: comp.id,
      name: comp.name,
      domain: comp.domain,
      scores: comp.snapshots[0]
        ? {
            total: comp.snapshots[0].totalScore,
            technical: comp.snapshots[0].technicalScore,
            onPage: comp.snapshots[0].onPageScore,
            structuredData: comp.snapshots[0].structuredDataScore,
            performance: comp.snapshots[0].performanceScore,
            localSeo: comp.snapshots[0].localSeoScore,
          }
        : null,
      lastUpdated: comp.snapshots[0]?.capturedAt || null,
    }));

    const projectData = {
      name: project.name,
      domain: project.domain,
      scores: {
        total: latestAudit.totalScore,
        technical: latestAudit.technicalScore,
        onPage: latestAudit.onPageScore,
        structuredData: latestAudit.structuredDataScore,
        performance: latestAudit.performanceScore,
        localSeo: latestAudit.localSeoScore,
      },
      lastUpdated: latestAudit.completedAt,
    };

    // Calculate rankings
    const allSites = [projectData, ...competitorData.filter((c) => c.scores !== null)];
    const rankings = allSites
      .sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0))
      .map((site, index) => ({
        rank: index + 1,
        name: site.name,
        totalScore: site.scores?.total,
      }));

    res.json({
      project: projectData,
      competitors: competitorData,
      rankings,
    });
  } catch (error) {
    next(error);
  }
});

export { router as competitorsRoutes };

