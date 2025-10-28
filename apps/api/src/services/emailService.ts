import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@fixfirstseo.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3005';

// Create email transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  // Check if email is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  Email service not configured. Emails will not be sent.');
    console.log('   Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables to enable emails.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('✅ Email service initialized');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    return null;
  }
}

/**
 * Send email helper
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transport = getTransporter();
  
  if (!transport) {
    console.log(`📧 [SKIPPED] Would send email to ${to}: ${subject}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
}

/**
 * Check if user has email notifications enabled for a specific type
 */
async function hasNotificationEnabled(userId: string, notificationType: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });

  if (!user || !user.notificationPreferences) {
    // Default: all notifications enabled if no preferences set
    return true;
  }

  const prefs = user.notificationPreferences as any;
  return prefs[notificationType] !== false;
}

/**
 * Send audit completion email
 */
export async function sendAuditCompletionEmail(auditId: string): Promise<void> {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!audit || !audit.project) {
      console.log('Audit or project not found');
      return;
    }

    const user = audit.project.user;

    // Check if user has audit completion notifications enabled
    const notificationsEnabled = await hasNotificationEnabled(user.id, 'auditComplete');
    if (!notificationsEnabled) {
      console.log(`User ${user.email} has audit completion notifications disabled`);
      return;
    }

    const auditUrl = `${FRONTEND_URL}/audit/${audit.id}`;
    const projectUrl = `${FRONTEND_URL}/project/${audit.project.id}`;

    const subject = `✅ SEO Audit Complete - ${audit.project.name}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .score-card { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .score { font-size: 48px; font-weight: bold; color: ${getScoreColor(audit.overallScore)}; margin: 10px 0; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; flex-wrap: wrap; }
    .stat { text-align: center; padding: 10px; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .button:hover { background: #1e3a8a; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your SEO Audit is Complete!</h1>
      <p>${audit.project.name}</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>Great news! Your SEO audit for <strong>${audit.project.domain}</strong> has been completed successfully.</p>
      
      <div class="score-card">
        <div style="text-align: center;">
          <p style="margin: 0; color: #6b7280;">Overall SEO Score</p>
          <div class="score">${audit.overallScore}/100</div>
          <p style="margin: 0; color: #6b7280;">${getScoreGrade(audit.overallScore)}</p>
        </div>
      </div>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Performance</div>
          <div class="stat-value">${audit.performanceScore}</div>
        </div>
        <div class="stat">
          <div class="stat-label">SEO</div>
          <div class="stat-value">${audit.seoScore}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Accessibility</div>
          <div class="stat-value">${audit.accessibilityScore}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Best Practices</div>
          <div class="stat-value">${audit.bestPracticesScore}</div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${auditUrl}" class="button">View Full Report</a>
        <a href="${projectUrl}" class="button" style="background: #6b7280;">View Project</a>
      </div>
      
      <p>The report includes:</p>
      <ul>
        <li>Detailed analysis of all SEO issues found</li>
        <li>AI-powered recommendations for improvement</li>
        <li>Performance metrics and trends</li>
        <li>Actionable next steps</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you requested an SEO audit.</p>
      <p>To stop receiving these emails, <a href="${FRONTEND_URL}/profile">update your notification preferences</a>.</p>
      <p>&copy; ${new Date().getFullYear()} FixFirst SEO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('Error sending audit completion email:', error);
  }
}

/**
 * Send project invitation email
 */
export async function sendInvitationEmail(invitationId: string): Promise<void> {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        project: true,
        invitedBy: true,
      },
    });

    if (!invitation || !invitation.project) {
      console.log('Invitation or project not found');
      return;
    }

    const inviteUrl = `${FRONTEND_URL}/invite/${invitation.token}`;

    const subject = `🤝 You've been invited to collaborate on ${invitation.project.name}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .invitation-box { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .role-badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #059669; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤝 Project Invitation</h1>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p><strong>${invitation.invitedBy.email}</strong> has invited you to collaborate on their SEO project:</p>
      
      <div class="invitation-box">
        <h2 style="margin: 0 0 10px 0;">${invitation.project.name}</h2>
        <p style="color: #6b7280; margin: 10px 0;">${invitation.project.domain}</p>
        <div>
          <span class="role-badge">${invitation.role}</span>
        </div>
      </div>
      
      <p>As a <strong>${invitation.role}</strong>, you'll be able to:</p>
      <ul>
        ${getRolePermissions(invitation.role)}
      </ul>
      
      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        This invitation will expire on ${new Date(invitation.expiresAt).toLocaleDateString()}.
      </p>
    </div>
    
    <div class="footer">
      <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
      <p>&copy; ${new Date().getFullYear()} FixFirst SEO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(invitation.email, subject, html);
  } catch (error) {
    console.error('Error sending invitation email:', error);
  }
}

/**
 * Send weekly digest email
 */
export async function sendWeeklyDigest(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: {
          include: {
            audits: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    // Check if user has weekly digest enabled
    const notificationsEnabled = await hasNotificationEnabled(user.id, 'weeklyDigest');
    if (!notificationsEnabled) {
      console.log(`User ${user.email} has weekly digest disabled`);
      return;
    }

    const totalAudits = user.projects.reduce((sum, p) => sum + p.audits.length, 0);
    
    if (totalAudits === 0) {
      console.log(`No audits this week for ${user.email}`);
      return;
    }

    const subject = `📊 Your Weekly SEO Summary - ${totalAudits} Audits Completed`;
    
    const projectsSummary = user.projects
      .filter(p => p.audits.length > 0)
      .map(p => {
        const latestAudit = p.audits[0];
        return `
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 10px 0;">
            <h3 style="margin: 0 0 10px 0;">${p.name}</h3>
            <p style="color: #6b7280; margin: 5px 0;">${p.domain}</p>
            <p style="margin: 5px 0;"><strong>${p.audits.length}</strong> audit${p.audits.length > 1 ? 's' : ''} this week</p>
            <p style="margin: 5px 0;">Latest Score: <strong style="color: ${getScoreColor(latestAudit.overallScore)};">${latestAudit.overallScore}/100</strong></p>
            <a href="${FRONTEND_URL}/project/${p.id}" style="color: #1e40af; text-decoration: none;">View Project →</a>
          </div>
        `;
      }).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Weekly SEO Summary</h1>
      <p>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>Here's your weekly summary of SEO activity:</p>
      
      <div style="text-align: center; margin: 20px 0; padding: 20px; background: #fef3c7; border-radius: 8px;">
        <div style="font-size: 48px; font-weight: bold; color: #92400e;">${totalAudits}</div>
        <div style="color: #78350f;">Total Audits This Week</div>
      </div>
      
      <h2>Project Updates</h2>
      ${projectsSummary}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${FRONTEND_URL}/dashboard" class="button">View Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>To stop receiving weekly digests, <a href="${FRONTEND_URL}/profile">update your notification preferences</a>.</p>
      <p>&copy; ${new Date().getFullYear()} FixFirst SEO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('Error sending weekly digest:', error);
  }
}

/**
 * Helper functions
 */
function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // green
  if (score >= 75) return '#f59e0b'; // orange
  return '#ef4444'; // red
}

function getScoreGrade(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}

function getRolePermissions(role: string): string {
  const permissions = {
    OWNER: '<li>Full project control and management</li><li>Run audits and view reports</li><li>Manage team members</li><li>Access all project data</li>',
    ADMIN: '<li>Run audits and view reports</li><li>Manage team members</li><li>Access all project data</li>',
    MEMBER: '<li>Run audits and view reports</li><li>Add comments and collaborate</li><li>View project data</li>',
    VIEWER: '<li>View audit reports</li><li>View project data</li>',
  };

  return permissions[role as keyof typeof permissions] || permissions.VIEWER;
}

