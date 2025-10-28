import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import GSCService from '../services/gscService';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createKeywordSchema = z.object({
  projectId: z.string(),
  groupId: z.string().optional(),
  keyword: z.string().min(1),
  targetUrl: z.string().url().optional(),
  device: z.enum(['DESKTOP', 'MOBILE', 'TABLET']).default('DESKTOP'),
  location: z.string().default('US'),
  language: z.string().default('en'),
});

const bulkCreateKeywordsSchema = z.object({
  projectId: z.string(),
  groupId: z.string().optional(),
  keywords: z.array(z.string().min(1)),
  device: z.enum(['DESKTOP', 'MOBILE', 'TABLET']).default('DESKTOP'),
  location: z.string().default('US'),
});

// Get all keywords for a project
router.get('/project/:projectId', async (req: AuthRequest, res, next) => {
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
                userId: req.userId!,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const keywords = await prisma.keyword.findMany({
      where: { projectId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        rankings: {
          orderBy: { capturedAt: 'desc' },
          take: 30, // Last 30 rankings
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(keywords);
  } catch (error) {
    next(error);
  }
});

// Get single keyword with full history
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const keyword = await prisma.keyword.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId: req.userId },
            {
              members: {
                some: {
                  userId: req.userId!,
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] },
                },
              },
            },
          ],
        },
      },
      include: {
        group: true,
        rankings: {
          orderBy: { capturedAt: 'desc' },
          take: 100,
        },
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    res.json(keyword);
  } catch (error) {
    next(error);
  }
});

// Create new keyword
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createKeywordSchema.parse(req.body);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId!,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check for duplicate
    const existing = await prisma.keyword.findUnique({
      where: {
        projectId_keyword_device_location: {
          projectId: data.projectId,
          keyword: data.keyword,
          device: data.device,
          location: data.location,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Keyword already exists for this project/device/location combination' });
    }

    const keyword = await prisma.keyword.create({
      data,
      include: {
        group: true,
        rankings: true,
      },
    });

    res.status(201).json(keyword);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e: any) => e.message).join(', '),
      });
    }
    next(error);
  }
});

// Bulk create keywords
router.post('/bulk', async (req: AuthRequest, res, next) => {
  try {
    const data = bulkCreateKeywordsSchema.parse(req.body);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId!,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get existing keywords to avoid duplicates
    const existingKeywords = await prisma.keyword.findMany({
      where: {
        projectId: data.projectId,
        keyword: { in: data.keywords },
        device: data.device,
        location: data.location,
      },
      select: { keyword: true },
    });

    const existingSet = new Set(existingKeywords.map(k => k.keyword));
    const newKeywords = data.keywords.filter(k => !existingSet.has(k));

    if (newKeywords.length === 0) {
      return res.status(400).json({ error: 'All keywords already exist' });
    }

    // Create keywords
    const keywords = await prisma.$transaction(
      newKeywords.map(keyword =>
        prisma.keyword.create({
          data: {
            projectId: data.projectId,
            groupId: data.groupId,
            keyword,
            device: data.device,
            location: data.location,
          },
        })
      )
    );

    res.status(201).json({
      created: keywords.length,
      skipped: data.keywords.length - keywords.length,
      keywords,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e: any) => e.message).join(', '),
      });
    }
    next(error);
  }
});

// Update keyword
router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = z.object({
      groupId: z.string().nullable().optional(),
      targetUrl: z.string().url().nullable().optional(),
      isTracking: z.boolean().optional(),
    }).parse(req.body);

    // Verify keyword access
    const keyword = await prisma.keyword.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId: req.userId },
            {
              members: {
                some: {
                  userId: req.userId!,
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                },
              },
            },
          ],
        },
      },
    });

    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    const updated = await prisma.keyword.update({
      where: { id },
      data: updateData,
      include: {
        group: true,
        rankings: {
          orderBy: { capturedAt: 'desc' },
          take: 10,
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e: any) => e.message).join(', '),
      });
    }
    next(error);
  }
});

// Delete keyword
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Verify keyword access
    const keyword = await prisma.keyword.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId: req.userId },
            {
              members: {
                some: {
                  userId: req.userId!,
                  role: { in: ['OWNER', 'ADMIN'] },
                },
              },
            },
          ],
        },
      },
    });

    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    await prisma.keyword.delete({
      where: { id },
    });

    res.json({ message: 'Keyword deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Toggle keyword tracking
router.post('/:id/toggle', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const keyword = await prisma.keyword.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId: req.userId },
            {
              members: {
                some: {
                  userId: req.userId!,
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                },
              },
            },
          ],
        },
      },
    });

    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    const updated = await prisma.keyword.update({
      where: { id },
      data: { isTracking: !keyword.isTracking },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Fetch rankings from GSC for keywords
router.post('/sync-gsc', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = z.object({
      projectId: z.string(),
    }).parse(req.body);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          {
            members: {
              some: {
                userId: req.userId!,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get keywords to sync
    const keywords = await prisma.keyword.findMany({
      where: {
        projectId,
        isTracking: true,
      },
    });

    if (keywords.length === 0) {
      return res.status(400).json({ error: 'No keywords to sync' });
    }

    // Fetch data from GSC
    const siteUrl = `https://${project.domain}/`;
    const keywordTerms = keywords.map(k => k.keyword);

    const rankings = await GSCService.getKeywordRankings(
      req.userId!,
      siteUrl,
      keywordTerms
    );

    // Update keywords and create ranking records
    const updates = [];
    for (const ranking of rankings) {
      const keyword = keywords.find(k => k.keyword === ranking.keyword);
      if (!keyword) continue;

      // Update keyword stats
      updates.push(
        prisma.keyword.update({
          where: { id: keyword.id },
          data: {
            previousPosition: keyword.currentPosition,
            currentPosition: ranking.position,
            bestPosition: !keyword.bestPosition || (ranking.position && ranking.position < keyword.bestPosition)
              ? ranking.position
              : keyword.bestPosition,
            worstPosition: !keyword.worstPosition || (ranking.position && ranking.position > keyword.worstPosition)
              ? ranking.position
              : keyword.worstPosition,
            searchVolume: ranking.impressions, // Use impressions as search volume proxy
          },
        })
      );

      // Create ranking record
      updates.push(
        prisma.keywordRanking.create({
          data: {
            keywordId: keyword.id,
            position: ranking.position,
            url: ranking.url,
            impressions: ranking.impressions,
            clicks: ranking.clicks,
            ctr: ranking.ctr,
          },
        })
      );
    }

    await prisma.$transaction(updates);

    res.json({
      success: true,
      synced: rankings.length,
      message: `Successfully synced ${rankings.length} keywords from Google Search Console`,
    });
  } catch (error: any) {
    if (error.message?.includes('not authenticated')) {
      return res.status(401).json({ error: 'Google Search Console not connected. Please connect your account first.' });
    }
    next(error);
  }
});

export { router as keywordsRoutes };

