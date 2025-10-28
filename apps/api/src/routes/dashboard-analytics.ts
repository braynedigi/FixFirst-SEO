import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/dashboard-analytics/overview
 * Get portfolio-wide overview statistics
 */
router.get('/overview', async (req: AuthRequest, res, next) => {
  try {
    const { days = 30 } = z.object({
      days: z.coerce.number().optional(),
    }).parse(req.query);

    const userId = req.userId!;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all user's projects
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        audits: {
          where: {
            status: 'COMPLETED',
            completedAt: { gte: startDate },
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    // Calculate portfolio metrics
    const totalProjects = projects.length;
    const totalAudits = projects.reduce((sum, p) => sum + p.audits.length, 0);

    // Get latest scores for each project
    const latestScores = projects
      .map(p => {
        const latestAudit = p.audits[0];
        return latestAudit ? {
          projectId: p.id,
          projectName: p.name,
          domain: p.domain,
          totalScore: latestAudit.totalScore,
          performanceScore: latestAudit.performanceScore,
          technicalScore: latestAudit.technicalScore,
          onPageScore: latestAudit.onPageScore,
          completedAt: latestAudit.completedAt,
        } : null;
      })
      .filter(Boolean);

    // Calculate average scores
    const avgTotalScore = latestScores.length > 0
      ? Math.round(latestScores.reduce((sum, s) => sum + (s!.totalScore || 0), 0) / latestScores.length)
      : 0;

    const avgPerformanceScore = latestScores.length > 0
      ? Math.round(latestScores.reduce((sum, s) => sum + (s!.performanceScore || 0), 0) / latestScores.length)
      : 0;

    const avgTechnicalScore = latestScores.length > 0
      ? Math.round(latestScores.reduce((sum, s) => sum + (s!.technicalScore || 0), 0) / latestScores.length)
      : 0;

    const avgOnPageScore = latestScores.length > 0
      ? Math.round(latestScores.reduce((sum, s) => sum + (s!.onPageScore || 0), 0) / latestScores.length)
      : 0;

    // Top performing projects (by total score)
    const topPerforming = [...latestScores]
      .sort((a, b) => (b!.totalScore || 0) - (a!.totalScore || 0))
      .slice(0, 5);

    // Bottom performing projects
    const bottomPerforming = [...latestScores]
      .sort((a, b) => (a!.totalScore || 0) - (b!.totalScore || 0))
      .slice(0, 5);

    // Calculate score trends
    const allAudits = projects.flatMap(p => p.audits);
    const recentAudits = allAudits.filter(a => a.completedAt && a.completedAt >= startDate);
    
    const avgRecentScore = recentAudits.length > 0
      ? Math.round(recentAudits.reduce((sum, a) => sum + (a.totalScore || 0), 0) / recentAudits.length)
      : 0;

    // Compare with older audits for trend
    const olderStartDate = new Date(startDate);
    olderStartDate.setDate(olderStartDate.getDate() - days);
    const olderAudits = allAudits.filter(a => 
      a.completedAt && a.completedAt >= olderStartDate && a.completedAt < startDate
    );
    const avgOlderScore = olderAudits.length > 0
      ? Math.round(olderAudits.reduce((sum, a) => sum + (a.totalScore || 0), 0) / olderAudits.length)
      : avgRecentScore;

    const scoreTrend = avgRecentScore - avgOlderScore;

    res.json({
      overview: {
        totalProjects,
        totalAudits,
        avgTotalScore,
        avgPerformanceScore,
        avgTechnicalScore,
        avgOnPageScore,
        scoreTrend,
      },
      topPerforming,
      bottomPerforming,
      latestScores,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard-analytics/trends
 * Get score trends over time
 */
router.get('/trends', async (req: AuthRequest, res, next) => {
  try {
    const { days = 30, projectId } = z.object({
      days: z.coerce.number().optional(),
      projectId: z.string().optional(),
    }).parse(req.query);

    const userId = req.userId!;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const whereClause: any = {
      status: 'COMPLETED',
      completedAt: { gte: startDate },
      project: { userId },
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Get audits grouped by day
    const audits = await prisma.audit.findMany({
      where: whereClause,
      orderBy: { completedAt: 'asc' },
      select: {
        id: true,
        totalScore: true,
        performanceScore: true,
        technicalScore: true,
        onPageScore: true,
        completedAt: true,
      },
    });

    // Group by day and calculate averages
    const dailyData: Record<string, any[]> = {};
    audits.forEach(audit => {
      if (!audit.completedAt) return;
      const day = audit.completedAt.toISOString().split('T')[0];
      if (!dailyData[day]) {
        dailyData[day] = [];
      }
      dailyData[day].push(audit);
    });

    const trends = Object.keys(dailyData).map(day => {
      const dayAudits = dailyData[day];
      return {
        date: day,
        avgTotalScore: Math.round(
          dayAudits.reduce((sum, a) => sum + (a.totalScore || 0), 0) / dayAudits.length
        ),
        avgPerformanceScore: Math.round(
          dayAudits.reduce((sum, a) => sum + (a.performanceScore || 0), 0) / dayAudits.length
        ),
        avgTechnicalScore: Math.round(
          dayAudits.reduce((sum, a) => sum + (a.technicalScore || 0), 0) / dayAudits.length
        ),
        avgOnPageScore: Math.round(
          dayAudits.reduce((sum, a) => sum + (a.onPageScore || 0), 0) / dayAudits.length
        ),
        count: dayAudits.length,
      };
    });

    res.json({ trends });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard-analytics/project-comparison
 * Compare all projects side-by-side
 */
router.get('/project-comparison', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        audits: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { audits: true },
        },
      },
    });

    const comparison = projects.map(project => {
      const latestAudit = project.audits[0];
      return {
        id: project.id,
        name: project.name,
        domain: project.domain,
        totalAudits: project._count.audits,
        latestAudit: latestAudit ? {
          totalScore: latestAudit.totalScore,
          performanceScore: latestAudit.performanceScore,
          technicalScore: latestAudit.technicalScore,
          onPageScore: latestAudit.onPageScore,
          structuredDataScore: latestAudit.structuredDataScore,
          localSeoScore: latestAudit.localSeoScore,
          completedAt: latestAudit.completedAt,
        } : null,
      };
    });

    res.json({ projects: comparison });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard-analytics/score-distribution
 * Get score distribution across all projects
 */
router.get('/score-distribution', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    // Get latest audit for each project
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        audits: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    const scores = projects
      .filter(p => p.audits[0])
      .map(p => p.audits[0].totalScore || 0);

    // Create distribution buckets
    const distribution = {
      excellent: scores.filter(s => s >= 90).length, // 90-100
      good: scores.filter(s => s >= 70 && s < 90).length, // 70-89
      needsWork: scores.filter(s => s >= 50 && s < 70).length, // 50-69
      poor: scores.filter(s => s < 50).length, // 0-49
    };

    res.json({ distribution, totalProjects: scores.length });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard-analytics/activity-summary
 * Get audit activity summary
 */
router.get('/activity-summary', async (req: AuthRequest, res, next) => {
  try {
    const { days = 7 } = z.object({
      days: z.coerce.number().optional(),
    }).parse(req.query);

    const userId = req.userId!;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const audits = await prisma.audit.findMany({
      where: {
        project: { userId },
        startedAt: { gte: startDate },
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
      },
    });

    // Group by day
    const dailyActivity: Record<string, any> = {};
    audits.forEach(audit => {
      const day = audit.startedAt.toISOString().split('T')[0];
      if (!dailyActivity[day]) {
        dailyActivity[day] = { total: 0, completed: 0, failed: 0, inProgress: 0 };
      }
      dailyActivity[day].total++;
      if (audit.status === 'COMPLETED') dailyActivity[day].completed++;
      if (audit.status === 'FAILED') dailyActivity[day].failed++;
      if (audit.status === 'IN_PROGRESS' || audit.status === 'QUEUED') dailyActivity[day].inProgress++;
    });

    const activity = Object.keys(dailyActivity)
      .sort()
      .map(day => ({
        date: day,
        ...dailyActivity[day],
      }));

    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardAnalyticsRoutes };

