import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  generatePDFReport,
  generateIssuesCSV,
  generateRecommendationsCSV,
  generateAnalyticsCSV,
} from '../services/reportGenerator';

const router = Router();
const prisma = new PrismaClient();

// Generate PDF report for an audit
router.get('/pdf/:auditId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { auditId } = req.params;

    // Get the audit
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
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

    console.log(`📄 Generating PDF report for audit: ${auditId}`);

    const pdfBuffer = await generatePDFReport(auditId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="SEO-Audit-Report-${audit.project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    next(error);
  }
});

// Export issues as CSV
router.get('/csv/issues/:auditId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { auditId } = req.params;

    // Get the audit
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
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

    console.log(`📊 Generating issues CSV for audit: ${auditId}`);

    const csvData = await generateIssuesCSV(auditId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Issues-${audit.project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csvData);
  } catch (error) {
    console.error('Error generating issues CSV:', error);
    next(error);
  }
});

// Export recommendations as CSV
router.get('/csv/recommendations/:auditId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { auditId } = req.params;

    // Get the audit
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
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

    console.log(`💡 Generating recommendations CSV for audit: ${auditId}`);

    const csvData = await generateRecommendationsCSV(auditId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Recommendations-${audit.project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csvData);
  } catch (error) {
    console.error('Error generating recommendations CSV:', error);
    next(error);
  }
});

// Export project analytics as CSV
router.get('/csv/analytics/:projectId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

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

    console.log(`📈 Generating analytics CSV for project: ${projectId}`);

    const csvData = await generateAnalyticsCSV(projectId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Analytics-${project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csvData);
  } catch (error) {
    console.error('Error generating analytics CSV:', error);
    next(error);
  }
});

export { router as reportsRoutes };

