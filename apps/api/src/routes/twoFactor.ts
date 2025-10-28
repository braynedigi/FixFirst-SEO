import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import TwoFactorService from '../services/twoFactorService';
import { z } from 'zod';

const router = Router();

// All 2FA routes require authentication
router.use(authenticate);

/**
 * GET /api/2fa/status
 * Check if 2FA is enabled for the current user
 */
router.get('/status', async (req: AuthRequest, res, next) => {
  try {
    const isEnabled = await TwoFactorService.is2FAEnabled(req.userId!);
    const remainingCodes = await TwoFactorService.getRemainingBackupCodesCount(req.userId!);

    res.json({
      enabled: isEnabled,
      remainingBackupCodes: remainingCodes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/2fa/setup
 * Generate a new 2FA secret and QR code for setup
 */
router.post('/setup', async (req: AuthRequest, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate secret
    const { secret, otpauth_url } = TwoFactorService.generateSecret(email);

    // Generate QR code
    const qrCodeDataUrl = await TwoFactorService.generateQRCode(otpauth_url);

    res.json({
      secret,
      qrCodeDataUrl,
      otpauthUrl: otpauth_url,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/2fa/enable
 * Enable 2FA for the user after verifying the setup token
 */
router.post('/enable', async (req: AuthRequest, res, next) => {
  try {
    const { secret, token } = z.object({
      secret: z.string().min(1),
      token: z.string().length(6),
    }).parse(req.body);

    const { backupCodes } = await TwoFactorService.enable2FA(
      req.userId!,
      secret,
      token
    );

    res.json({
      message: '2FA enabled successfully',
      backupCodes,
    });
  } catch (error: any) {
    if (error.message === 'Invalid verification token') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA for the user
 */
router.post('/disable', async (req: AuthRequest, res, next) => {
  try {
    const { token } = z.object({
      token: z.string().min(1),
    }).parse(req.body);

    // Verify the token before disabling
    const isValid = await TwoFactorService.verify2FALogin(req.userId!, token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await TwoFactorService.disable2FA(req.userId!);

    res.json({ message: '2FA disabled successfully' });
  } catch (error: any) {
    if (error.message === 'Invalid token' || error.message?.includes('2FA not enabled')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/2fa/verify
 * Verify a 2FA token (for testing or additional verification flows)
 */
router.post('/verify', async (req: AuthRequest, res, next) => {
  try {
    const { token } = z.object({
      token: z.string().min(1),
    }).parse(req.body);

    const isValid = await TwoFactorService.verify2FALogin(req.userId!, token);

    res.json({ valid: isValid });
  } catch (error: any) {
    if (error.message?.includes('2FA not enabled')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/2fa/backup-codes/regenerate
 * Regenerate backup codes
 */
router.post('/backup-codes/regenerate', async (req: AuthRequest, res, next) => {
  try {
    const { token } = z.object({
      token: z.string().min(1),
    }).parse(req.body);

    // Verify user's identity before regenerating codes
    const isValid = await TwoFactorService.verify2FALogin(req.userId!, token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const backupCodes = await TwoFactorService.regenerateBackupCodes(req.userId!);

    res.json({
      message: 'Backup codes regenerated successfully',
      backupCodes,
    });
  } catch (error: any) {
    if (error.message === 'Invalid token') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

export { router as twoFactorRoutes };

