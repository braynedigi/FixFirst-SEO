import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PdfGenerator {
  async generateAuditReport(auditId: string): Promise<Buffer> {
    // Fetch audit data
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
        issues: {
          include: {
            rule: true,
          },
          orderBy: [
            { severity: 'asc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    if (!audit) {
      throw new Error('Audit not found');
    }

    // Group issues by category
    const issuesByCategory = audit.issues.reduce((acc: any, issue) => {
      const category = issue.rule.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(issue);
      return acc;
    }, {});

    // Generate HTML content
    const html = this.generateHtml(audit, issuesByCategory);

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateHtml(audit: any, issuesByCategory: any): string {
    const categoryNames: Record<string, string> = {
      TECHNICAL: 'Technical & Indexing',
      ONPAGE: 'On-Page Optimization',
      STRUCTURED_DATA: 'Structured Data',
      PERFORMANCE: 'Performance',
      LOCAL_SEO: 'Local SEO',
    };

    const severityColors: Record<string, string> = {
      critical: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    };

    const scoreColor = this.getScoreColor(audit.totalScore);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Audit Report - ${audit.url}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 3px solid #06b6d4;
      margin-bottom: 40px;
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      background: linear-gradient(135deg, #06b6d4, #0891b2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    
    .company {
      font-size: 12px;
      color: #6b7280;
      margin-top: 5px;
    }
    
    h1 {
      font-size: 32px;
      color: #111827;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 16px;
      color: #6b7280;
    }
    
    .url {
      font-size: 14px;
      color: #06b6d4;
      margin-top: 10px;
      word-break: break-all;
    }
    
    .metadata {
      display: flex;
      justify-content: space-between;
      padding: 20px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 30px;
    }
    
    .metadata-item {
      text-align: center;
    }
    
    .metadata-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metadata-value {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-top: 5px;
    }
    
    .score-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      border: 8px solid ${scoreColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: bold;
      color: ${scoreColor};
      margin: 0 auto 30px;
    }
    
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 24px;
      color: #111827;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .score-breakdown {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .score-card {
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #06b6d4;
    }
    
    .score-card-title {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    
    .score-card-value {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
    }
    
    .issue {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    
    .issue-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-right: 10px;
    }
    
    .severity-critical {
      background: #fef2f2;
      color: #991b1b;
    }
    
    .severity-warning {
      background: #fffbeb;
      color: #92400e;
    }
    
    .severity-info {
      background: #eff6ff;
      color: #1e3a8a;
    }
    
    .issue-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      flex: 1;
    }
    
    .issue-message {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 10px;
    }
    
    .recommendation {
      background: #f0f9ff;
      border-left: 3px solid #06b6d4;
      padding: 12px;
      margin-top: 10px;
      border-radius: 4px;
    }
    
    .recommendation-title {
      font-size: 13px;
      font-weight: 600;
      color: #0891b2;
      margin-bottom: 5px;
    }
    
    .recommendation-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
    }
    
    .summary-section {
      background: linear-gradient(135deg, #ecfeff, #f0f9ff);
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 30px;
    }
    
    .summary-title {
      font-size: 20px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 15px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: center;
    }
    
    .summary-item-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }
    
    .summary-item-value {
      font-size: 28px;
      font-weight: bold;
      color: #111827;
      margin-top: 5px;
    }
    
    footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    .footer-logo {
      font-weight: 600;
      color: #06b6d4;
      margin-bottom: 5px;
    }
    
    @page {
      margin: 0;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">FixFirst SEO</div>
      <div class="company">Powered by Brayne Smart Solutions Corp.</div>
      <h1>SEO Audit Report</h1>
      <div class="url">${audit.url}</div>
      <div class="subtitle">
        Generated on ${new Date(audit.completedAt || audit.startedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </header>
    
    <div class="score-circle">${audit.totalScore}</div>
    
    <div class="summary-section">
      <div class="summary-title">Audit Summary</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-item-label">Overall Score</div>
          <div class="summary-item-value">${audit.totalScore}/100</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Issues Found</div>
          <div class="summary-item-value">${audit.issues.length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Critical</div>
          <div class="summary-item-value" style="color: #ef4444;">
            ${audit.issues.filter((i: any) => i.severity === 'critical').length}
          </div>
        </div>
      </div>
    </div>
    
    <div class="metadata">
      <div class="metadata-item">
        <div class="metadata-label">Project</div>
        <div class="metadata-value">${audit.project.name}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Domain</div>
        <div class="metadata-value">${audit.project.domain}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Pages Audited</div>
        <div class="metadata-value">${audit.pagesAudited || 1}</div>
      </div>
    </div>
    
    ${Object.entries(categoryNames)
      .filter(([key]) => issuesByCategory[key] && issuesByCategory[key].length > 0)
      .map(
        ([key, name]) => `
      <div class="section">
        <h2 class="section-title">${name}</h2>
        ${issuesByCategory[key]
          .map(
            (issue: any) => `
          <div class="issue">
            <div class="issue-header">
              <span class="severity-badge severity-${issue.severity}">${issue.severity}</span>
              <span class="issue-title">${issue.rule.name}</span>
            </div>
            <div class="issue-message">${issue.message}</div>
            ${
              issue.recommendation
                ? `
            <div class="recommendation">
              <div class="recommendation-title">💡 How to Fix</div>
              <div class="recommendation-text">${issue.recommendation}</div>
            </div>
            `
                : ''
            }
          </div>
        `
          )
          .join('')}
      </div>
    `
      )
      .join('')}
    
    ${
      Object.values(issuesByCategory).every((arr: any) => arr.length === 0)
        ? `
    <div class="section">
      <div style="text-align: center; padding: 40px; background: #f0fdf4; border-radius: 12px; border: 2px solid #10b981;">
        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
        <div style="font-size: 20px; font-weight: 600; color: #047857; margin-bottom: 5px;">
          Excellent!
        </div>
        <div style="font-size: 14px; color: #065f46;">
          No issues found. Your website follows SEO best practices.
        </div>
      </div>
    </div>
    `
        : ''
    }
    
    <footer>
      <div class="footer-logo">FixFirst SEO - Comprehensive Website Analysis</div>
      <div>© 2035 SEO Audit Tool. Powered By Brayne Smart Solutions Corp.</div>
      <div style="margin-top: 10px;">
        For questions or support, visit our website or contact support.
      </div>
    </footer>
  </div>
</body>
</html>
    `;
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }
}

