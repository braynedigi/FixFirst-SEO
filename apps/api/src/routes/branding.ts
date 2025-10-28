import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Get branding settings (public - no auth required)
router.get('/', async (req, res, next) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'branding' },
    });

    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'branding',
          appName: 'FixFirst SEO',
          primaryColor: '#06b6d4',
          accentColor: '#10b981',
          footerText: '© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.',
        },
      });
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Update branding settings (admin only)
const updateBrandingSchema = z.object({
  appName: z.string().min(1).max(50).optional(),
  logoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  faviconUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  footerText: z.string().max(200).optional(),
});

router.patch('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = updateBrandingSchema.parse(req.body);

    const settings = await prisma.settings.upsert({
      where: { id: 'branding' },
      update: {
        ...data,
      },
      create: {
        id: 'branding',
        appName: data.appName || 'FixFirst SEO',
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        primaryColor: data.primaryColor || '#06b6d4',
        accentColor: data.accentColor || '#10b981',
        footerText: data.footerText || '© 2025 FixFirst SEO',
      },
    });

    res.json(settings);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map((e: any) => e.message).join(', ')
      });
    }
    next(error);
  }
});

// Upload logo
router.post('/upload/logo', authenticate, requireAdmin, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get base URL from environment or request
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Update branding settings with new logo URL
    const settings = await prisma.settings.upsert({
      where: { id: 'branding' },
      update: { logoUrl },
      create: {
        id: 'branding',
        logoUrl,
        appName: 'FixFirst SEO',
        primaryColor: '#06b6d4',
        accentColor: '#10b981',
        footerText: '© 2025 FixFirst SEO',
      },
    });

    res.json({ 
      success: true, 
      logoUrl,
      filename: req.file.filename,
      settings 
    });
  } catch (error) {
    // Delete uploaded file if database update fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// Upload favicon
router.post('/upload/favicon', authenticate, requireAdmin, upload.single('favicon'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get base URL from environment or request
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    const faviconUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Update branding settings with new favicon URL
    const settings = await prisma.settings.upsert({
      where: { id: 'branding' },
      update: { faviconUrl },
      create: {
        id: 'branding',
        faviconUrl,
        appName: 'FixFirst SEO',
        primaryColor: '#06b6d4',
        accentColor: '#10b981',
        footerText: '© 2025 FixFirst SEO',
      },
    });

    res.json({ 
      success: true, 
      faviconUrl,
      filename: req.file.filename,
      settings 
    });
  } catch (error) {
    // Delete uploaded file if database update fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// Delete uploaded file
router.delete('/upload/:filename', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    next(error);
  }
});

export { router as brandingRoutes };

