import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import BacklinkService from '../services/backlinkService';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

/**
 * GET /api/backlinks/project/:projectId
 * Get all backlinks for a project with optional filters
 */
router.get('/project/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;
    const filters = {
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      minDA: req.query.minDA ? Number(req.query.minDA) : undefined,
      maxSpamScore: req.query.maxSpamScore ? Number(req.query.maxSpamScore) : undefined,
    };

    const backlinks = await BacklinkService.getBacklinks(projectId, filters);
    res.json(backlinks);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/backlinks/project/:projectId/stats
 * Get backlink statistics for a project
 */
router.get('/project/:projectId/stats', async (req: AuthRequest, res, next) => {
  try {
    const stats = await BacklinkService.getBacklinkStats(req.params.projectId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/backlinks/project/:projectId/trends
 * Get backlink trends over time
 */
router.get('/project/:projectId/trends', async (req: AuthRequest, res, next) => {
  try {
    const { days = 30 } = req.query;
    const trends = await BacklinkService.getBacklinkTrends(
      req.params.projectId,
      Number(days)
    );
    res.json(trends);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/backlinks/project/:projectId/quality
 * Analyze backlink quality
 */
router.get('/project/:projectId/quality', async (req: AuthRequest, res, next) => {
  try {
    const quality = await BacklinkService.analyzeBacklinkQuality(req.params.projectId);
    res.json(quality);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/backlinks/check
 * Check backlinks for a URL
 */
router.post('/check', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, targetUrl } = z.object({
      projectId: z.string(),
      targetUrl: z.string().url(),
    }).parse(req.body);

    const backlinks = await BacklinkService.checkBacklinks(projectId, targetUrl);
    res.json({ success: true, backlinks });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    next(error);
  }
});

/**
 * GET /api/backlinks/monitors/project/:projectId
 * Get all monitors for a project
 */
router.get('/monitors/project/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const monitors = await BacklinkService.getMonitors(req.params.projectId);
    res.json(monitors);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/backlinks/monitors
 * Create a new backlink monitor
 */
router.post('/monitors', async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      projectId: z.string(),
      name: z.string().min(1),
      targetUrl: z.string().url(),
      checkFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    }).parse(req.body);

    const monitor = await BacklinkService.createMonitor(data.projectId, data);
    res.json(monitor);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    next(error);
  }
});

/**
 * PATCH /api/backlinks/monitors/:id
 * Update a backlink monitor
 */
router.patch('/monitors/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1).optional(),
      enabled: z.boolean().optional(),
      checkFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    }).parse(req.body);

    const monitor = await BacklinkService.updateMonitor(req.params.id, data);
    res.json(monitor);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    next(error);
  }
});

/**
 * DELETE /api/backlinks/monitors/:id
 * Delete a backlink monitor
 */
router.delete('/monitors/:id', async (req: AuthRequest, res, next) => {
  try {
    await BacklinkService.deleteMonitor(req.params.id);
    res.json({ success: true, message: 'Monitor deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/backlinks/monitors/:id/check
 * Run a monitor check manually
 */
router.post('/monitors/:id/check', async (req: AuthRequest, res, next) => {
  try {
    const result = await BacklinkService.runMonitorCheck(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as backlinksRoutes };

