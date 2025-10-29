import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import RuleEngine from '../services/ruleEngine';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/custom-rules
 * Get all custom rules (global + user's own)
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const rules = await prisma.customRule.findMany({
      where: {
        OR: [
          { global: true },
          { createdById: req.userId! },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            violations: true,
            projectRules: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rules);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/custom-rules/:id
 * Get a specific rule
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const rule = await prisma.customRule.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
        violations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json(rule);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/custom-rules
 * Create a new custom rule
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      category: z.enum(['TECHNICAL', 'ONPAGE', 'STRUCTURED_DATA', 'PERFORMANCE', 'LOCAL_SEO', 'CONTENT', 'LINKS']),
      severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
      condition: z.any(), // JSON condition
      message: z.string().min(1),
      enabled: z.boolean().default(true),
      global: z.boolean().default(false),
    });

    const data = schema.parse(req.body);

    // Only admins can create global rules
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (data.global && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create global rules' });
    }

    const rule = await prisma.customRule.create({
      data: {
        ...data,
        createdById: req.userId!,
      },
    });

    res.json(rule);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    next(error);
  }
});

/**
 * PATCH /api/custom-rules/:id
 * Update a custom rule
 */
router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const rule = await prisma.customRule.findUnique({
      where: { id: req.params.id },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Check ownership
    if (rule.createdById !== req.userId!) {
      return res.status(403).json({ error: 'Not authorized to update this rule' });
    }

    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      category: z.enum(['TECHNICAL', 'ONPAGE', 'STRUCTURED_DATA', 'PERFORMANCE', 'LOCAL_SEO', 'CONTENT', 'LINKS']).optional(),
      severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
      condition: z.any().optional(),
      message: z.string().min(1).optional(),
      enabled: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const updated = await prisma.customRule.update({
      where: { id: req.params.id },
      data,
    });

    res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    next(error);
  }
});

/**
 * DELETE /api/custom-rules/:id
 * Delete a custom rule
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const rule = await prisma.customRule.findUnique({
      where: { id: req.params.id },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Check ownership
    if (rule.createdById !== req.userId!) {
      return res.status(403).json({ error: 'Not authorized to delete this rule' });
    }

    await prisma.customRule.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/custom-rules/test
 * Test a rule condition against sample data
 */
router.post('/test', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      condition: z.any(),
      sampleData: z.any(),
    });

    const { condition, sampleData } = schema.parse(req.body);

    const result = await RuleEngine.testRule(condition, sampleData);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    next(error);
  }
});

/**
 * GET /api/custom-rules/available-fields
 * Get available fields for rule building
 */
router.get('/meta/available-fields', async (req: AuthRequest, res, next) => {
  try {
    const fields = RuleEngine.getAvailableFields();
    res.json(fields);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/custom-rules/project/:projectId
 * Get rules assigned to a project
 */
router.get('/project/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const projectRules = await prisma.projectRule.findMany({
      where: { projectId: req.params.projectId },
      include: {
        rule: {
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json(projectRules);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/custom-rules/project/:projectId/assign
 * Assign a rule to a project
 */
router.post('/project/:projectId/assign', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      ruleId: z.string(),
      enabled: z.boolean().default(true),
    });

    const { ruleId, enabled } = schema.parse(req.body);

    // Check if already assigned
    const existing = await prisma.projectRule.findUnique({
      where: {
        projectId_ruleId: {
          projectId: req.params.projectId,
          ruleId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Rule already assigned to this project' });
    }

    const projectRule = await prisma.projectRule.create({
      data: {
        projectId: req.params.projectId,
        ruleId,
        enabled,
      },
      include: {
        rule: true,
      },
    });

    res.json(projectRule);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    next(error);
  }
});

/**
 * DELETE /api/custom-rules/project/:projectId/unassign/:ruleId
 * Unassign a rule from a project
 */
router.delete('/project/:projectId/unassign/:ruleId', async (req: AuthRequest, res, next) => {
  try {
    await prisma.projectRule.delete({
      where: {
        projectId_ruleId: {
          projectId: req.params.projectId,
          ruleId: req.params.ruleId,
        },
      },
    });

    res.json({ success: true, message: 'Rule unassigned' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/custom-rules/violations/audit/:auditId
 * Get rule violations for an audit
 */
router.get('/violations/audit/:auditId', async (req: AuthRequest, res, next) => {
  try {
    const violations = await prisma.ruleViolation.findMany({
      where: { auditId: req.params.auditId },
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            category: true,
            severity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(violations);
  } catch (error) {
    next(error);
  }
});

export { router as customRulesRoutes };

