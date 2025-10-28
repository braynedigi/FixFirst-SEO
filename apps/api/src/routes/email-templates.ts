import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const isAdmin = async (req: AuthRequest, res: any, next: any) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Default templates with better formatting
const DEFAULT_TEMPLATES = {
  'audit-complete': {
    name: 'Audit Complete',
    subject: '✅ SEO Audit Complete - {{project.name}}',
    description: 'Sent when audits finish. Shows score, grade, and link to full report.',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .score-card { background: #f9fafb; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .score { font-size: 56px; font-weight: bold; margin: 15px 0; }
    .score-label { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; }
    .stat { text-align: center; padding: 15px; background: #f9fafb; border-radius: 6px; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .button { display: inline-block; background: #1e40af; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 10px; font-weight: 600; }
    .button:hover { background: #1e3a8a; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    .success { color: #10b981; }
    .warning { color: #f59e0b; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your SEO Audit is Complete!</h1>
      <p>{{project.name}}</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>Great news! Your SEO audit for <strong>{{project.domain}}</strong> has been completed successfully.</p>
      
      <div class="score-card">
        <div class="score-label">Overall SEO Score</div>
        <div class="score">{{audit.overallScore}}/100</div>
        <div class="score-label">{{audit.grade}}</div>
      </div>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Performance</div>
          <div class="stat-value">{{audit.performanceScore}}</div>
        </div>
        <div class="stat">
          <div class="stat-label">SEO</div>
          <div class="stat-value">{{audit.seoScore}}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Accessibility</div>
          <div class="stat-value">{{audit.accessibilityScore}}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Best Practices</div>
          <div class="stat-value">{{audit.bestPracticesScore}}</div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{auditUrl}}" class="button">View Full Report</a>
        <a href="{{projectUrl}}" class="button" style="background: #6b7280;">View Project</a>
      </div>
      
      <p><strong>The report includes:</strong></p>
      <ul>
        <li>Detailed analysis of all SEO issues found</li>
        <li>AI-powered recommendations for improvement</li>
        <li>Performance metrics and trends</li>
        <li>Actionable next steps</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you requested an SEO audit.</p>
      <p>To stop receiving these emails, <a href="{{frontendUrl}}/profile">update your notification preferences</a>.</p>
      <p>&copy; {{year}} FixFirst SEO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  },
  'invitation': {
    name: 'Project Invitation',
    subject: '🤝 You\'ve been invited to collaborate on {{project.name}}',
    description: 'Sent when users are invited to collaborate on projects.',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .invitation-box { background: #f0fdf4; border: 2px solid #10b981; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .invitation-box h2 { margin: 0 0 10px 0; color: #1e40af; font-size: 24px; }
    .role-badge { display: inline-block; background: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; font-size: 16px; }
    .button:hover { background: #059669; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    ul { margin: 15px 0; padding-left: 25px; }
    ul li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤝 Project Invitation</h1>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p><strong>{{invitedBy.email}}</strong> has invited you to collaborate on their SEO project:</p>
      
      <div class="invitation-box">
        <h2>{{project.name}}</h2>
        <p style="color: #6b7280; margin: 10px 0;">{{project.domain}}</p>
        <div>
          <span class="role-badge">{{invitation.role}}</span>
        </div>
      </div>
      
      <p>As a <strong>{{invitation.role}}</strong>, you'll be able to:</p>
      <ul>
        {{rolePermissions}}
      </ul>
      
      <div style="text-align: center;">
        <a href="{{inviteUrl}}" class="button">Accept Invitation</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
        This invitation will expire on {{invitation.expiresAt}}.
      </p>
    </div>
    
    <div class="footer">
      <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
      <p>&copy; {{year}} FixFirst SEO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  },
  'weekly-digest': {
    name: 'Weekly Digest',
    subject: '📊 Your Weekly SEO Summary - {{totalAudits}} Audits Completed',
    description: 'Weekly summary of all audits and activity across projects.',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: white; padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .summary-box { background: #fef3c7; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .summary-number { font-size: 56px; font-weight: bold; color: #92400e; margin: 10px 0; }
    .summary-label { color: #78350f; font-size: 16px; }
    .project-card { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .project-card h3 { margin: 0 0 8px 0; color: #1e40af; }
    .project-stats { display: flex; justify-content: space-between; margin-top: 15px; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 20px; font-weight: bold; color: #1e40af; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .button:hover { background: #7c3aed; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Weekly SEO Summary</h1>
      <p>{{currentDate}}</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>Here's your weekly summary of SEO activity:</p>
      
      <div class="summary-box">
        <div class="summary-number">{{totalAudits}}</div>
        <div class="summary-label">Total Audits This Week</div>
      </div>
      
      <h2 style="color: #1e40af; margin-top: 30px;">Project Updates</h2>
      {{projectsSummary}}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{frontendUrl}}/dashboard" class="button">View Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>To stop receiving weekly digests, <a href="{{frontendUrl}}/profile">update your notification preferences</a>.</p>
      <p>&copy; {{year}} FixFirst SEO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  },
};

// Get all email templates
router.get('/', authenticate, isAdmin, async (req: AuthRequest, res, next) => {
  try {
    let templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // If no templates exist, create defaults
    if (templates.length === 0) {
      console.log('📧 No email templates found, creating defaults...');
      
      for (const [key, template] of Object.entries(DEFAULT_TEMPLATES)) {
        await prisma.emailTemplate.create({
          data: {
            key,
            name: template.name,
            subject: template.subject,
            htmlContent: template.htmlContent,
            description: template.description,
            isActive: true,
          },
        });
      }

      templates = await prisma.emailTemplate.findMany({
        orderBy: { createdAt: 'asc' },
      });
      
      console.log(`✅ Created ${templates.length} default email templates`);
    }

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get single template
router.get('/:key', authenticate, isAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { key } = req.params;
    
    let template = await prisma.emailTemplate.findUnique({
      where: { key },
    });

    // If template doesn't exist, create from default
    if (!template && DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES]) {
      const defaultTemplate = DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES];
      template = await prisma.emailTemplate.create({
        data: {
          key,
          name: defaultTemplate.name,
          subject: defaultTemplate.subject,
          htmlContent: defaultTemplate.htmlContent,
          description: defaultTemplate.description,
          isActive: true,
        },
      });
      console.log(`✅ Created default template: ${key}`);
    }

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Update template
const updateTemplateSchema = z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  htmlContent: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.put('/:key', authenticate, isAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { key } = req.params;
    const data = updateTemplateSchema.parse(req.body);

    const template = await prisma.emailTemplate.update({
      where: { key },
      data: {
        ...data,
        updatedBy: req.userId,
      },
    });

    console.log(`✅ Updated email template: ${key}`);
    res.json(template);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    next(error);
  }
});

// Reset template to default
router.post('/:key/reset', authenticate, isAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { key } = req.params;
    
    const defaultTemplate = DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES];
    if (!defaultTemplate) {
      return res.status(404).json({ error: 'Default template not found' });
    }

    const template = await prisma.emailTemplate.update({
      where: { key },
      data: {
        name: defaultTemplate.name,
        subject: defaultTemplate.subject,
        htmlContent: defaultTemplate.htmlContent,
        description: defaultTemplate.description,
        updatedBy: req.userId,
      },
    });

    console.log(`🔄 Reset email template to default: ${key}`);
    res.json({ message: 'Template reset to default', template });
  } catch (error) {
    next(error);
  }
});

export { router as emailTemplatesRoutes };

