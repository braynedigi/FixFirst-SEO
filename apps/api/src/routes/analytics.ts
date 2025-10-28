import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get analytics trends for a project
router.get('/trends/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;
    const { days = '30' } = req.query;

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

    // Get audits from the last N days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const audits = await prisma.audit.findMany({
      where: {
        projectId,
        status: 'COMPLETED',
        completedAt: {
          gte: daysAgo,
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
      select: {
        id: true,
        url: true,
        totalScore: true,
        technicalScore: true,
        onPageScore: true,
        structuredDataScore: true,
        performanceScore: true,
        localSeoScore: true,
        completedAt: true,
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    // Calculate trend statistics
    const scores = audits.map((a) => a.totalScore).filter((s) => s !== null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a! + b!, 0)! / scores.length) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores.map((s) => s!)) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores.map((s) => s!)) : 0;

    // Calculate score change (first vs last audit)
    const scoreChange =
      scores.length >= 2 ? scores[scores.length - 1]! - scores[0]! : 0;
    const scoreChangePercent =
      scores.length >= 2 && scores[0] !== 0
        ? Math.round(((scores[scores.length - 1]! - scores[0]!) / scores[0]!) * 100)
        : 0;

    res.json({
      trends: audits,
      statistics: {
        avgScore,
        minScore,
        maxScore,
        scoreChange,
        scoreChangePercent,
        totalAudits: audits.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get issue distribution analytics
router.get('/issues/:projectId', authenticate, async (req: AuthRequest, res, next) => {
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

    // Get latest completed audit
    const latestAudit = await prisma.audit.findFirst({
      where: {
        projectId,
        status: 'COMPLETED',
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    if (!latestAudit) {
      return res.json({
        bySeverity: [],
        byCategory: [],
        topIssues: [],
      });
    }

    // Get issues grouped by severity
    const bySeverity = await prisma.issue.groupBy({
      by: ['severity'],
      where: {
        auditId: latestAudit.id,
      },
      _count: true,
    });

    // Get issues grouped by category (via rule)
    const byCategory = await prisma.issue.groupBy({
      by: ['ruleId'],
      where: {
        auditId: latestAudit.id,
      },
      _count: true,
    });

    // Get rule categories
    const ruleIds = byCategory.map((b) => b.ruleId);
    const rules = await prisma.rule.findMany({
      where: {
        id: {
          in: ruleIds,
        },
      },
      select: {
        id: true,
        category: true,
      },
    });

    // Map to categories
    const categoryMap = new Map<string, number>();
    byCategory.forEach((item) => {
      const rule = rules.find((r) => r.id === item.ruleId);
      if (rule) {
        const currentCount = categoryMap.get(rule.category) || 0;
        categoryMap.set(rule.category, currentCount + item._count);
      }
    });

    const byCategoryArray = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    // Get top issues by severity
    const topIssues = await prisma.issue.findMany({
      where: {
        auditId: latestAudit.id,
        severity: 'CRITICAL',
      },
      include: {
        rule: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    res.json({
      bySeverity: bySeverity.map((item) => ({
        severity: item.severity,
        count: item._count,
      })),
      byCategory: byCategoryArray,
      topIssues,
    });
  } catch (error) {
    next(error);
  }
});

// Get performance metrics over time
router.get('/performance/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = '10' } = req.query;

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

    // Get recent completed audits
    const audits = await prisma.audit.findMany({
      where: {
        projectId,
        status: 'COMPLETED',
        performanceScore: {
          not: null,
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: parseInt(limit as string),
      select: {
        id: true,
        url: true,
        performanceScore: true,
        psiData: true,
        completedAt: true,
      },
    });

    // Extract PSI metrics from psiData
    const performanceMetrics = audits.map((audit) => {
      const psiData = audit.psiData as any;
      return {
        auditId: audit.id,
        url: audit.url,
        performanceScore: audit.performanceScore,
        completedAt: audit.completedAt,
        metrics: {
          fcp: psiData?.lighthouseResult?.audits?.['first-contentful-paint']?.numericValue,
          lcp: psiData?.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue,
          cls: psiData?.lighthouseResult?.audits?.['cumulative-layout-shift']?.numericValue,
          tti: psiData?.lighthouseResult?.audits?.['interactive']?.numericValue,
          tbt: psiData?.lighthouseResult?.audits?.['total-blocking-time']?.numericValue,
        },
      };
    });

    res.json({
      performance: performanceMetrics.reverse(), // Oldest to newest
    });
  } catch (error) {
    next(error);
  }
});

// Create audit snapshot (for historical tracking)
router.post('/snapshot/:auditId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { auditId } = req.params;

    // Get the audit with issues
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
        issues: true,
      },
    });

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Verify project access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: audit.projectId,
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

    // Count issues by severity
    const criticalIssues = audit.issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningIssues = audit.issues.filter((i) => i.severity === 'WARNING').length;
    const infoIssues = audit.issues.filter((i) => i.severity === 'INFO').length;

    // Create snapshot
    const snapshot = await prisma.auditSnapshot.create({
      data: {
        auditId: audit.id,
        projectId: audit.projectId,
        totalScore: audit.totalScore || 0,
        technicalScore: audit.technicalScore || 0,
        onPageScore: audit.onPageScore || 0,
        structuredDataScore: audit.structuredDataScore || 0,
        performanceScore: audit.performanceScore || 0,
        localSeoScore: audit.localSeoScore || 0,
        issueCount: audit.issues.length,
        criticalIssues,
        warningIssues,
        infoIssues,
      },
    });

    res.status(201).json(snapshot);
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };

