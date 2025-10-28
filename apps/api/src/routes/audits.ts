import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { addAuditJob, getJobStatus } from '../queue/audit-queue';
import { z } from 'zod';
import { normalizeUrl, extractDomain } from '@seo-audit/shared';
import Redis from 'ioredis';
import { PdfGenerator } from '../services/pdf-generator';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const createAuditSchema = z.object({
  url: z.string().url(),
  projectId: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

// Rate limit check
async function checkRateLimit(userId: string, planTier: string): Promise<boolean> {
  const limits = {
    FREE: { max: 1, window: 24 * 60 * 60 }, // 1 per day
    PRO: { max: 25, window: 30 * 24 * 60 * 60 }, // 25 per month
    AGENCY: { max: 200, window: 30 * 24 * 60 * 60 }, // 200 per month
  };

  const limit = limits[planTier as keyof typeof limits] || limits.FREE;
  const key = `rate-limit:${userId}:${planTier}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, limit.window);
  }

  return count <= limit.max;
}

// Create audit
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { url, projectId, keywords } = createAuditSchema.parse(req.body);
    const normalizedUrl = normalizeUrl(url);
    const domain = extractDomain(normalizedUrl);

    // Check rate limit
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allowed = await checkRateLimit(user.id, user.planTier);
    if (!allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded for your plan tier' });
    }

    // Create or get project
    let project;
    if (projectId) {
      project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.userId },
      });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    } else {
      // Auto-create project for this domain
      project = await prisma.project.upsert({
        where: {
          userId_domain: {
            userId: req.userId!,
            domain,
          },
        },
        create: {
          userId: req.userId!,
          name: domain,
          domain,
        },
        update: {},
      });
    }

    // Create audit record
    const audit = await prisma.audit.create({
      data: {
        projectId: project.id,
        url: normalizedUrl,
        status: 'QUEUED',
        metadata: { keywords: keywords || [] },
      },
    });

    // Queue audit job
    await addAuditJob({
      auditId: audit.id,
      url: normalizedUrl,
      projectId: project.id,
      userId: req.userId!,
    });

    res.status(201).json({
      auditId: audit.id,
      status: audit.status,
      message: 'Audit queued successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get audit by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const audit = await prisma.audit.findFirst({
      where: {
        id: req.params.id,
        project: { userId: req.userId },
      },
      include: {
        project: true,
        pages: {
          select: {
            id: true,
            url: true,
            statusCode: true,
            loadTime: true,
            pageSize: true,
          },
        },
        issues: {
          include: {
            rule: true,
          },
          orderBy: { severity: 'asc' },
        },
      },
    });

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Get job status if still running
    if (audit.status === 'QUEUED' || audit.status === 'RUNNING') {
      const jobStatus = await getJobStatus(audit.id);
      if (jobStatus) {
        return res.json({
          ...audit,
          jobProgress: jobStatus.progress,
        });
      }
    }

    res.json(audit);
  } catch (error) {
    next(error);
  }
});

// Get all audits for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const audits = await prisma.audit.findMany({
      where: {
        project: { userId: req.userId },
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
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    res.json(audits);
  } catch (error) {
    next(error);
  }
});

// Delete all failed audits
router.delete('/failed', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await prisma.audit.deleteMany({
      where: {
        status: 'FAILED',
        project: { userId: req.userId },
      },
    });

    res.json({ 
      message: 'Failed audits deleted', 
      count: result.count 
    });
  } catch (error) {
    next(error);
  }
});

// Delete audit
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const audit = await prisma.audit.findFirst({
      where: {
        id: req.params.id,
        project: { userId: req.userId },
      },
    });

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    await prisma.audit.delete({ where: { id: req.params.id } });

    res.json({ message: 'Audit deleted' });
  } catch (error) {
    next(error);
  }
});

// Export audit as CSV
router.get('/:id/export/csv', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const audit = await prisma.audit.findFirst({
      where: {
        id: req.params.id,
        project: { userId: req.userId },
      },
      include: {
        issues: {
          include: {
            rule: true,
          },
        },
        pages: true,
        project: true,
      },
    });

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (audit.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Audit not completed yet' });
    }

    // Prepare CSV data
    const csvData = audit.issues.map((issue) => ({
      'Rule': issue.rule.name,
      'Category': issue.rule.category,
      'Severity': issue.severity,
      'Page URL': issue.pageUrl,
      'Message': issue.message,
      'Recommendation': issue.recommendation || '',
      'Selector': issue.selector || '',
    }));

    // Generate CSV
    const { Parser } = require('json2csv');
    const parser = new Parser();
    const csv = parser.parse(csvData);

    const filename = `seo-audit-${audit.url.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csv);
  } catch (error) {
    console.error('CSV generation error:', error);
    next(error);
  }
});

// Export audit as PDF
router.get('/:id/export/pdf', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const audit = await prisma.audit.findFirst({
      where: {
        id: req.params.id,
        project: { userId: req.userId },
      },
    });

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (audit.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Audit not completed yet' });
    }

    // Check if user has access to PDF export (Pro or Agency plan)
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.planTier === 'FREE') {
      return res.status(403).json({ 
        error: 'PDF export is available for Pro and Agency plans only',
        upgrade: true,
      });
    }

    const pdfGenerator = new PdfGenerator();
    const pdfBuffer = await pdfGenerator.generateAuditReport(req.params.id);

    const filename = `seo-audit-${audit.url.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    next(error);
  }
});

export { router as auditRoutes };

