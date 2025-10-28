import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import GSCService from '../services/gscService';
import { z } from 'zod';

const router = Router();

// Handle OAuth callback (must be BEFORE router.use(authenticate))
// This route is public because Google's OAuth redirect doesn't include our JWT token
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    await GSCService.handleCallback(code as string, userId as string);

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?gsc=connected`);
  } catch (error: any) {
    console.error('GSC callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?gsc=error`);
  }
});

// Apply authentication to all routes below
router.use(authenticate);

// Get GSC connection status
router.get('/status', async (req: AuthRequest, res, next) => {
  try {
    const isConnected = await GSCService.isConnected(req.userId!);
    res.json({ connected: isConnected });
  } catch (error) {
    next(error);
  }
});

// Get authorization URL
router.get('/auth-url', async (req: AuthRequest, res, next) => {
  try {
    const authUrl = GSCService.getAuthUrl(req.userId!);
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List available GSC properties
router.get('/sites', async (req: AuthRequest, res, next) => {
  try {
    const sites = await GSCService.listSites(req.userId!);
    res.json(sites);
  } catch (error: any) {
    if (error.message?.includes('not authenticated')) {
      return res.status(401).json({ error: 'Google Search Console not connected' });
    }
    next(error);
  }
});

// Get top keywords from GSC
router.get('/top-keywords', async (req: AuthRequest, res, next) => {
  try {
    const { siteUrl, limit } = z.object({
      siteUrl: z.string().url(),
      limit: z.coerce.number().default(100),
    }).parse(req.query);

    const keywords = await GSCService.getTopKeywords(req.userId!, siteUrl, limit);
    res.json(keywords);
  } catch (error: any) {
    if (error.message?.includes('not authenticated')) {
      return res.status(401).json({ error: 'Google Search Console not connected' });
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e: any) => e.message).join(', '),
      });
    }
    next(error);
  }
});

// Disconnect GSC
router.post('/disconnect', async (req: AuthRequest, res, next) => {
  try {
    await GSCService.disconnect(req.userId!);
    res.json({ message: 'Google Search Console disconnected successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as gscRoutes };

