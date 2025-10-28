import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { reinitializeOpenAI } from '../services/aiRecommendations';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const requireAdmin = async (req: AuthRequest, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Get all system settings (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        isSecret: true,
        updatedAt: true,
      },
      orderBy: { key: 'asc' },
    });

    // Mask secret values
    const maskedSettings = settings.map((setting) => ({
      ...setting,
      value: setting.isSecret && setting.value ? '••••••••' : setting.value,
    }));

    res.json(maskedSettings);
  } catch (error) {
    next(error);
  }
});

// Get specific setting by key (admin only)
router.get('/:key', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.systemSettings.findUnique({
      where: { key },
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        isSecret: true,
        updatedAt: true,
      },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Mask secret value
    if (setting.isSecret && setting.value) {
      setting.value = '••••••••';
    }

    res.json(setting);
  } catch (error) {
    next(error);
  }
});

// Update or create setting (admin only)
router.put('/:key', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { key } = req.params;
    const { value, description, isSecret } = req.body;

    // Validate required fields
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Check if setting exists
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    let setting;
    if (existingSetting) {
      // Update existing setting
      setting = await prisma.systemSettings.update({
        where: { key },
        data: {
          value,
          description: description !== undefined ? description : existingSetting.description,
          isSecret: isSecret !== undefined ? isSecret : existingSetting.isSecret,
          updatedBy: req.userId,
        },
      });
    } else {
      // Create new setting
      setting = await prisma.systemSettings.create({
        data: {
          key,
          value,
          description: description || null,
          isSecret: isSecret || false,
          updatedBy: req.userId,
        },
      });
    }

    console.log(`✅ System setting "${key}" ${existingSetting ? 'updated' : 'created'} by admin`);

    // Reinitialize services if needed
    if (key === 'OPENAI_API_KEY') {
      await reinitializeOpenAI();
    }

    // Mask secret value in response
    if (setting.isSecret && setting.value) {
      setting.value = '••••••••';
    }

    res.json({
      message: `Setting ${existingSetting ? 'updated' : 'created'} successfully`,
      setting,
    });
  } catch (error) {
    next(error);
  }
});

// Delete setting (admin only)
router.delete('/:key', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { key } = req.params;

    const setting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    await prisma.systemSettings.delete({
      where: { key },
    });

    console.log(`✅ System setting "${key}" deleted by admin`);

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Test OpenAI connection (admin only)
router.post('/test-openai', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Test the API key with a simple request
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });

    try {
      await openai.models.list();
      res.json({ success: true, message: 'OpenAI API key is valid!' });
    } catch (error: any) {
      console.error('OpenAI API key test failed:', error.message);
      res.status(400).json({
        success: false,
        message: 'Invalid API key or connection failed',
        error: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

export { router as settingsRoutes };

