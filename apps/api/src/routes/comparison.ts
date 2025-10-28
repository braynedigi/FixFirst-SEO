import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get audit history for a specific URL/domain
router.get('/history/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get all completed audits for this project, ordered by date
    const audits = await prisma.audit.findMany({
      where: {
        projectId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
      take: 10, // Last 10 audits
      select: {
        id: true,
        url: true,
        totalScore: true,
        technicalScore: true,
        onPageScore: true,
        structuredDataScore: true,
        performanceScore: true,
        localSeoScore: true,
        startedAt: true,
        completedAt: true,
        issues: {
          select: {
            severity: true,
          },
        },
      },
    });

    // Calculate issue counts for each audit
    const auditHistory = audits.map(audit => ({
      ...audit,
      criticalIssues: audit.issues.filter(i => i.severity === 'CRITICAL').length,
      warningIssues: audit.issues.filter(i => i.severity === 'WARNING').length,
      infoIssues: audit.issues.filter(i => i.severity === 'INFO').length,
    }));

    res.json(auditHistory);
  } catch (error) {
    next(error);
  }
});

// Compare two specific audits
router.get('/compare/:auditId1/:auditId2', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { auditId1, auditId2 } = req.params;

    // Fetch both audits with full details
    const [audit1, audit2] = await Promise.all([
      prisma.audit.findFirst({
        where: {
          id: auditId1,
          project: { userId: req.userId },
        },
        include: {
          issues: {
            include: {
              rule: true,
            },
          },
          pages: true,
        },
      }),
      prisma.audit.findFirst({
        where: {
          id: auditId2,
          project: { userId: req.userId },
        },
        include: {
          issues: {
            include: {
              rule: true,
            },
          },
          pages: true,
        },
      }),
    ]);

    if (!audit1 || !audit2) {
      return res.status(404).json({ error: 'One or both audits not found' });
    }

    // Calculate differences
    const comparison = {
      audit1: {
        id: audit1.id,
        url: audit1.url,
        date: audit1.completedAt || audit1.startedAt,
        scores: {
          total: audit1.totalScore,
          technical: audit1.technicalScore,
          onPage: audit1.onPageScore,
          structuredData: audit1.structuredDataScore,
          performance: audit1.performanceScore,
          localSeo: audit1.localSeoScore,
        },
        issueCount: {
          critical: audit1.issues.filter(i => i.severity === 'CRITICAL').length,
          warning: audit1.issues.filter(i => i.severity === 'WARNING').length,
          info: audit1.issues.filter(i => i.severity === 'INFO').length,
        },
        pageCount: audit1.pages.length,
      },
      audit2: {
        id: audit2.id,
        url: audit2.url,
        date: audit2.completedAt || audit2.startedAt,
        scores: {
          total: audit2.totalScore,
          technical: audit2.technicalScore,
          onPage: audit2.onPageScore,
          structuredData: audit2.structuredDataScore,
          performance: audit2.performanceScore,
          localSeo: audit2.localSeoScore,
        },
        issueCount: {
          critical: audit2.issues.filter(i => i.severity === 'CRITICAL').length,
          warning: audit2.issues.filter(i => i.severity === 'WARNING').length,
          info: audit2.issues.filter(i => i.severity === 'INFO').length,
        },
        pageCount: audit2.pages.length,
      },
      changes: {
        totalScore: (audit2.totalScore || 0) - (audit1.totalScore || 0),
        technicalScore: (audit2.technicalScore || 0) - (audit1.technicalScore || 0),
        onPageScore: (audit2.onPageScore || 0) - (audit1.onPageScore || 0),
        structuredDataScore: (audit2.structuredDataScore || 0) - (audit1.structuredDataScore || 0),
        performanceScore: (audit2.performanceScore || 0) - (audit1.performanceScore || 0),
        localSeoScore: (audit2.localSeoScore || 0) - (audit1.localSeoScore || 0),
        criticalIssues:
          audit2.issues.filter(i => i.severity === 'CRITICAL').length -
          audit1.issues.filter(i => i.severity === 'CRITICAL').length,
        warningIssues:
          audit2.issues.filter(i => i.severity === 'WARNING').length -
          audit1.issues.filter(i => i.severity === 'WARNING').length,
      },
      newIssues: audit2.issues.filter(
        issue2 =>
          !audit1.issues.some(
            issue1 => issue1.ruleId === issue2.ruleId && issue1.pageUrl === issue2.pageUrl
          )
      ),
      resolvedIssues: audit1.issues.filter(
        issue1 =>
          !audit2.issues.some(
            issue2 => issue2.ruleId === issue1.ruleId && issue2.pageUrl === issue1.pageUrl
          )
      ),
    };

    res.json(comparison);
  } catch (error) {
    next(error);
  }
});

// Get trend data for a project
router.get('/trends/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = '30' } = req.query; // Last 30 audits by default

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get audit trend data
    const audits = await prisma.audit.findMany({
      where: {
        projectId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'asc' },
      take: parseInt(limit as string),
      select: {
        id: true,
        totalScore: true,
        technicalScore: true,
        onPageScore: true,
        structuredDataScore: true,
        performanceScore: true,
        localSeoScore: true,
        completedAt: true,
      },
    });

    // Format for chart
    const trendData = audits.map(audit => ({
      date: audit.completedAt?.toISOString() || '',
      totalScore: audit.totalScore || 0,
      technical: audit.technicalScore || 0,
      onPage: audit.onPageScore || 0,
      structuredData: audit.structuredDataScore || 0,
      performance: audit.performanceScore || 0,
      localSeo: audit.localSeoScore || 0,
    }));

    res.json(trendData);
  } catch (error) {
    next(error);
  }
});

export { router as comparisonRoutes };

