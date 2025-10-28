import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateAIRecommendations } from '../services/aiRecommendations';

const router = Router();
const prisma = new PrismaClient();

// Generate recommendations for an audit
router.post('/generate/:auditId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { auditId } = req.params;

    // Get the audit with issues
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
        issues: {
          include: {
            rule: true,
          },
        },
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

    // Check if recommendations already exist (optionally force regenerate)
    const forceRegenerate = req.body?.forceRegenerate === true;
    
    if (!forceRegenerate) {
      const existingRecommendations = await prisma.recommendation.findMany({
        where: { auditId },
        orderBy: [{ priority: 'asc' }, { estimatedValue: 'desc' }],
      });

      if (existingRecommendations.length > 0) {
        return res.json({ recommendations: existingRecommendations, generated: false });
      }
    } else {
      // Clear existing recommendations if regenerating
      await prisma.recommendation.deleteMany({
        where: { auditId },
      });
    }

    console.log(`🤖 Generating AI recommendations for audit: ${auditId}`);

    // Use AI service to generate recommendations
    const aiRecommendations = await generateAIRecommendations(
      audit.issues as any,
      audit.project.domain
    );

    // Map AI recommendations to database format
    const recommendationsToCreate = aiRecommendations.map((aiRec) => ({
      auditId,
      category: inferCategory(aiRec.title),
      priority: inferPriority(aiRec.effort, aiRec.estimatedValue),
      title: aiRec.title,
      description: aiRec.description,
      impact: aiRec.impactExplanation,
      effort: aiRec.effort,
      estimatedValue: aiRec.estimatedValue,
      metadata: {
        detailedAnalysis: aiRec.detailedAnalysis,
        stepByStepSolution: aiRec.stepByStepSolution,
        codeExamples: aiRec.codeExamples,
      },
    }));

    // Create all recommendations in the database
    const createdRecommendations = await Promise.all(
      recommendationsToCreate.map((rec) => prisma.recommendation.create({ data: rec }))
    );

    console.log(`✅ Created ${createdRecommendations.length} AI recommendations`);

    res.status(201).json({
      recommendations: createdRecommendations,
      generated: true,
      aiPowered: process.env.OPENAI_API_KEY ? true : false,
    });
  } catch (error) {
    next(error);
  }
});

// Get recommendations for an audit
router.get('/:auditId', authenticate, async (req: AuthRequest, res, next) => {
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

    const recommendations = await prisma.recommendation.findMany({
      where: { auditId },
      orderBy: [{ priority: 'asc' }, { estimatedValue: 'desc' }],
    });

    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
});

// Mark recommendation as implemented
router.patch('/:id/implement', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Get the recommendation with audit
    const recommendation = await prisma.recommendation.findUnique({
      where: { id },
      include: {
        audit: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    // Verify project access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: recommendation.audit.projectId,
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

    // Toggle implementation status
    const updated = await prisma.recommendation.update({
      where: { id },
      data: {
        isImplemented: !recommendation.isImplemented,
        implementedAt: !recommendation.isImplemented ? new Date() : null,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Helper function to infer category from title
function inferCategory(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('performance') || titleLower.includes('speed') || titleLower.includes('load')) {
    return 'PERFORMANCE_BOOST';
  }
  if (titleLower.includes('meta') || titleLower.includes('title') || titleLower.includes('content')) {
    return 'CONTENT_OPTIMIZATION';
  }
  if (titleLower.includes('technical') || titleLower.includes('security') || titleLower.includes('header')) {
    return 'TECHNICAL_IMPROVEMENT';
  }
  if (titleLower.includes('schema') || titleLower.includes('structured')) {
    return 'STRUCTURED_DATA';
  }
  if (titleLower.includes('mobile') || titleLower.includes('responsive')) {
    return 'MOBILE_OPTIMIZATION';
  }
  
  // Default: if high value and low effort, it's a quick win
  return 'QUICK_WIN';
}

// Helper function to infer priority from effort and value
function inferPriority(effort: string, estimatedValue: number): string {
  if (estimatedValue >= 90) return 'CRITICAL';
  if (estimatedValue >= 75 && effort !== 'HIGH') return 'HIGH';
  if (estimatedValue >= 60) return 'MEDIUM';
  return 'LOW';
}

export { router as recommendationsRoutes };

