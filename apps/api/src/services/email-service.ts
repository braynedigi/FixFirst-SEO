import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // Check if email is configured
    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️  Email service not configured. Emails will not be sent.');
      console.warn('   Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables to enable emails.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log(`📧 [MOCK] Email would be sent to ${options.to}: ${options.subject}`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"FixFirst SEO" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Audit completion notification
  async sendAuditCompleteEmail(
    to: string,
    audit: {
      id: string;
      url: string;
      totalScore: number;
      completedAt: Date;
    }
  ): Promise<boolean> {
    const grade = this.getScoreGrade(audit.totalScore);
    const html = this.generateAuditCompleteTemplate(audit, grade);
    
    return this.sendEmail({
      to,
      subject: `✅ Your SEO Audit is Complete - ${audit.url} (Score: ${audit.totalScore})`,
      html,
    });
  }

  // Audit failed notification
  async sendAuditFailedEmail(
    to: string,
    audit: {
      id: string;
      url: string;
      error?: string;
    }
  ): Promise<boolean> {
    const html = this.generateAuditFailedTemplate(audit);
    
    return this.sendEmail({
      to,
      subject: `❌ SEO Audit Failed - ${audit.url}`,
      html,
    });
  }

  // Welcome email
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const html = this.generateWelcomeTemplate(name);
    
    return this.sendEmail({
      to,
      subject: '🎉 Welcome to FixFirst SEO!',
      html,
    });
  }

  private getScoreGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private generateAuditCompleteTemplate(
    audit: { id: string; url: string; totalScore: number; completedAt: Date },
    grade: string
  ): string {
    const scoreColor = audit.totalScore >= 80 ? '#10b981' : audit.totalScore >= 60 ? '#f59e0b' : '#ef4444';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/audit/${audit.id}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Complete</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0e1a; color: #e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1f2e; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">✅ Audit Complete!</h1>
                        </td>
                    </tr>

                    <!-- Score Badge -->
                    <tr>
                        <td align="center" style="padding: 30px 40px;">
                            <div style="display: inline-block; background-color: #0f172a; padding: 30px; border-radius: 12px; border: 2px solid ${scoreColor};">
                                <div style="font-size: 64px; font-weight: bold; color: ${scoreColor}; margin-bottom: 10px;">${audit.totalScore}</div>
                                <div style="font-size: 18px; color: #94a3b8;">Grade ${grade}</div>
                            </div>
                        </td>
                    </tr>

                    <!-- Audit Details -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 15px; background-color: #0f172a; border-radius: 8px;">
                                        <div style="color: #94a3b8; font-size: 14px; margin-bottom: 5px;">Website</div>
                                        <div style="color: #e2e8f0; font-size: 16px; font-weight: 600;">${audit.url}</div>
                                    </td>
                                </tr>
                                <tr><td style="height: 15px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0f172a; border-radius: 8px;">
                                        <div style="color: #94a3b8; font-size: 14px; margin-bottom: 5px;">Completed</div>
                                        <div style="color: #e2e8f0; font-size: 16px; font-weight: 600;">${new Date(audit.completedAt).toLocaleString()}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Full Report</a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #334155; color: #64748b; font-size: 14px;">
                            <p style="margin: 0 0 10px;">© 2025 FixFirst SEO</p>
                            <p style="margin: 0;">Powered By Brayne Smart Solutions Corp.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }

  private generateAuditFailedTemplate(audit: { id: string; url: string; error?: string }): string {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/dashboard`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0e1a; color: #e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1f2e; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">❌ Audit Failed</h1>
                        </td>
                    </tr>

                    <!-- Message -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <div style="font-size: 18px; color: #e2e8f0; margin-bottom: 20px;">
                                We encountered an issue while auditing your website.
                            </div>
                        </td>
                    </tr>

                    <!-- Audit Details -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 15px; background-color: #0f172a; border-radius: 8px;">
                                        <div style="color: #94a3b8; font-size: 14px; margin-bottom: 5px;">Website</div>
                                        <div style="color: #e2e8f0; font-size: 16px; font-weight: 600;">${audit.url}</div>
                                    </td>
                                </tr>
                                ${audit.error ? `
                                <tr><td style="height: 15px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #450a0a; border-radius: 8px; border: 1px solid #991b1b;">
                                        <div style="color: #fca5a5; font-size: 14px; margin-bottom: 5px;">Error Details</div>
                                        <div style="color: #fecaca; font-size: 14px;">${audit.error}</div>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Try Again</a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #334155; color: #64748b; font-size: 14px;">
                            <p style="margin: 0 0 10px;">Need help? Contact our support team</p>
                            <p style="margin: 0 0 10px;">© 2025 FixFirst SEO</p>
                            <p style="margin: 0;">Powered By Brayne Smart Solutions Corp.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }

  private generateWelcomeTemplate(name: string): string {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/dashboard`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FixFirst SEO</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0e1a; color: #e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1f2e; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">🎉 Welcome to FixFirst SEO!</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="font-size: 18px; color: #e2e8f0; margin: 0 0 20px;">Hi ${name},</p>
                            
                            <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px;">
                                Thank you for joining FixFirst SEO! We're excited to help you improve your website's search engine performance.
                            </p>

                            <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 30px;">
                                With our comprehensive audit tool, you'll get actionable insights on:
                            </p>

                            <ul style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                                <li>🔍 Technical SEO & Indexability</li>
                                <li>📝 On-Page Optimization</li>
                                <li>⚡ Performance & Core Web Vitals</li>
                                <li>🏷️ Structured Data & Schema Markup</li>
                                <li>📍 Local SEO</li>
                            </ul>

                            <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 30px;">
                                Ready to get started? Run your first audit now!
                            </p>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #334155; color: #64748b; font-size: 14px;">
                            <p style="margin: 0 0 10px;">Questions? We're here to help!</p>
                            <p style="margin: 0 0 10px;">© 2025 FixFirst SEO</p>
                            <p style="margin: 0;">Powered By Brayne Smart Solutions Corp.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }
}

// Singleton instance
export const emailService = new EmailService();

