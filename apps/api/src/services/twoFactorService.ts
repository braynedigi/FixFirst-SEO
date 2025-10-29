/**
 * Two-Factor Authentication Service
 * 
 * Handles TOTP (Time-based One-Time Password) generation and verification
 * using the TOTP algorithm (RFC 6238) compatible with Google Authenticator, Authy, etc.
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   */
  static generateSecret(userEmail: string): { secret: string; otpauth_url: string } {
    const secret = speakeasy.generateSecret({
      name: `FixFirst SEO (${userEmail})`,
      issuer: 'FixFirst SEO',
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url || '',
    };
  }

  /**
   * Generate QR code data URL for setup
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token
   */
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before and after (±60 seconds tolerance)
    });
  }

  /**
   * Enable 2FA for a user
   */
  static async enable2FA(userId: string, secret: string, verificationToken: string) {
    // Verify the token first
    const isValid = this.verifyToken(secret, verificationToken);
    if (!isValid) {
      throw new Error('Invalid verification token');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    return { backupCodes };
  }

  /**
   * Disable 2FA for a user
   */
  static async disable2FA(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });
  }

  /**
   * Verify 2FA token during login
   */
  static async verify2FALogin(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA not enabled for this user');
    }

    // Try TOTP token first
    const isValidTOTP = this.verifyToken(user.twoFactorSecret, token);
    if (isValidTOTP) {
      return true;
    }

    // Try backup codes if TOTP failed
    if (user.twoFactorBackupCodes) {
      const hashedCodes = JSON.parse(user.twoFactorBackupCodes as string);
      
      for (let i = 0; i < hashedCodes.length; i++) {
        const isValidBackupCode = await bcrypt.compare(token, hashedCodes[i]);
        
        if (isValidBackupCode) {
          // Remove the used backup code
          hashedCodes.splice(i, 1);
          await prisma.user.update({
            where: { id: userId },
            data: {
              twoFactorBackupCodes: JSON.stringify(hashedCodes),
            },
          });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate backup codes (10 codes of 8 characters each)
   */
  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateRandomCode());
    }
    return codes;
  }

  /**
   * Generate a single random backup code
   */
  private static generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous characters
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code.match(/.{1,4}/g)?.join('-') || code; // Format as XXXX-XXXX
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    return backupCodes;
  }

  /**
   * Check if user has 2FA enabled
   */
  static async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    return user?.twoFactorEnabled || false;
  }

  /**
   * Get remaining backup codes count
   */
  static async getRemainingBackupCodesCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorBackupCodes: true },
    });

    if (!user || !user.twoFactorBackupCodes) {
      return 0;
    }

    const hashedCodes = JSON.parse(user.twoFactorBackupCodes as string);
    return hashedCodes.length;
  }
}

export default TwoFactorService;

