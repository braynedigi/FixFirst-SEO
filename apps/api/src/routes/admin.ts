import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { emailService } from '../services/email-service';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware to all admin routes
router.use(authenticate);
router.use(requireAdmin);

// Get all rules
router.get('/rules', async (req, res, next) => {
  try {
    const rules = await prisma.rule.findMany({
      orderBy: [{ category: 'asc' }, { weight: 'desc' }],
    });
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

// Update rule
router.patch('/rules/:id', async (req, res, next) => {
  try {
    const { weight, isActive, description } = req.body;
    
    const rule = await prisma.rule.update({
      where: { id: req.params.id },
      data: {
        ...(weight !== undefined && { weight }),
        ...(isActive !== undefined && { isActive }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(rule);
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        planTier: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user details by ID
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        role: true,
        planTier: true,
        createdAt: true,
        notificationPreferences: true,
        apiKeyHash: true,
        apiKeyCreatedAt: true,
        projects: {
          select: {
            id: true,
            domain: true,
            createdAt: true,
            _count: {
              select: {
                audits: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Create new user
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  planTier: z.enum(['FREE', 'PRO', 'AGENCY']).default('FREE'),
});

router.post('/users', async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        planTier: data.planTier,
      },
      select: {
        id: true,
        email: true,
        role: true,
        planTier: true,
        createdAt: true,
      },
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.email.split('@')[0]);

    res.status(201).json(user);
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

// Update user details (comprehensive)
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  planTier: z.enum(['FREE', 'PRO', 'AGENCY']).optional(),
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const data = updateUserSchema.parse(req.body);

    // If email is being changed, check for duplicates
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email already in use by another user' });
      }
    }

    // Build update object
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.planTier) updateData.planTier = data.planTier;
    
    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        planTier: true,
        createdAt: true,
      },
    });

    res.json(user);
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

// Update user plan (kept for backward compatibility with table inline edit)
router.patch('/users/:id/plan', async (req, res, next) => {
  try {
    const { planTier } = req.body;
    
    if (!['FREE', 'PRO', 'AGENCY'].includes(planTier)) {
      return res.status(400).json({ error: 'Invalid plan tier' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { planTier },
      select: {
        id: true,
        email: true,
        role: true,
        planTier: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Delete user (this will cascade delete projects, audits, etc.)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get system stats
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalAudits,
      completedAudits,
      failedAudits,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.audit.count(),
      prisma.audit.count({ where: { status: 'COMPLETED' } }),
      prisma.audit.count({ where: { status: 'FAILED' } }),
    ]);

    res.json({
      totalUsers,
      totalProjects,
      totalAudits,
      completedAudits,
      failedAudits,
    });
  } catch (error) {
    next(error);
  }
});

// Send test email
router.post('/test-email', async (req, res, next) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Send a welcome email as a test
    const success = await emailService.sendWelcomeEmail(to, 'Admin Test');

    if (success) {
      res.json({ 
        success: true, 
        message: `Test email sent to ${to}`,
      });
    } else {
      res.status(500).json({ 
        error: 'Email service is not configured. Check API server logs and configure SMTP settings in .env file.',
      });
    }
  } catch (error) {
    next(error);
  }
});

export { router as adminRoutes };

