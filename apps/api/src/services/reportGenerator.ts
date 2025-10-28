import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ReportData {
  audit: any;
  project: any;
  issues: any[];
  recommendations?: any[];
}

/**
 * Generate a professional PDF report for an audit
 */
export async function generatePDFReport(auditId: string): Promise<Buffer> {
  // Fetch audit data with all related information
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: {
      project: true,
      issues: {
        include: {
          rule: true,
        },
      },
    },
  });

  if (!audit) {
    throw new Error('Audit not found');
  }

  // Fetch recommendations if available
  const recommendations = await prisma.recommendation.findMany({
    where: { auditId },
    orderBy: [{ priority: 'asc' }, { estimatedValue: 'desc' }],
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Generate the report content
    generateReportContent(doc, { audit, project: audit.project, issues: audit.issues, recommendations });

    doc.end();
  });
}

/**
 * Generate report content in PDF
 */
function generateReportContent(doc: PDFKit.PDFDocument, data: ReportData) {
  const { audit, project, issues, recommendations = [] } = data;

  // Header
  doc.fontSize(24).fillColor('#1e40af').text('SEO Audit Report', { align: 'center' });
  doc.moveDown(0.5);

  // Project info
  doc.fontSize(10).fillColor('#6b7280').text(new Date(audit.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), { align: 'center' });
  
  doc.moveDown(1.5);

  // Project details box
  doc.rect(50, doc.y, 495, 80).fillAndStroke('#f3f4f6', '#e5e7eb');
  doc.fillColor('#111827').fontSize(14).text(project.name, 60, doc.y + 20);
  doc.fillColor('#6b7280').fontSize(10).text(project.domain, 60, doc.y + 5);
  doc.fillColor('#111827').fontSize(10).text(`Status: ${audit.status}`, 60, doc.y + 10);
  doc.text(`Duration: ${audit.duration ? `${(audit.duration / 1000).toFixed(2)}s` : 'N/A'}`, 60, doc.y + 5);

  doc.moveDown(3);

  // Score Summary
  doc.fontSize(16).fillColor('#1e40af').text('Performance Summary', { underline: true });
  doc.moveDown(0.5);

  const scores = [
    { label: 'Overall Score', value: audit.overallScore, color: getScoreColor(audit.overallScore) },
    { label: 'Performance', value: audit.performanceScore, color: getScoreColor(audit.performanceScore) },
    { label: 'SEO', value: audit.seoScore, color: getScoreColor(audit.seoScore) },
    { label: 'Accessibility', value: audit.accessibilityScore, color: getScoreColor(audit.accessibilityScore) },
    { label: 'Best Practices', value: audit.bestPracticesScore, color: getScoreColor(audit.bestPracticesScore) },
  ];

  scores.forEach((score) => {
    const startY = doc.y;
    doc.fillColor('#374151').fontSize(11).text(score.label, 60, startY);
    doc.fillColor(score.color).fontSize(11).text(`${score.value}/100`, 400, startY, { width: 100, align: 'right' });
    
    // Progress bar
    const barY = startY + 15;
    doc.rect(60, barY, 440, 8).fillAndStroke('#e5e7eb', '#d1d5db');
    doc.rect(60, barY, (440 * score.value) / 100, 8).fill(score.color);
    
    doc.moveDown(1.5);
  });

  doc.moveDown(1);

  // Issues Summary
  const errorCount = issues.filter((i: any) => i.severity === 'ERROR').length;
  const warningCount = issues.filter((i: any) => i.severity === 'WARNING').length;
  const infoCount = issues.filter((i: any) => i.severity === 'INFO').length;

  doc.fontSize(16).fillColor('#1e40af').text('Issues Detected', { underline: true });
  doc.moveDown(0.5);

  doc.fillColor('#dc2626').fontSize(12).text(`🔴 ${errorCount} Critical Issues`);
  doc.moveDown(0.3);
  doc.fillColor('#f59e0b').fontSize(12).text(`⚠️  ${warningCount} Warnings`);
  doc.moveDown(0.3);
  doc.fillColor('#3b82f6').fontSize(12).text(`ℹ️  ${infoCount} Informational`);
  doc.moveDown(1.5);

  // Add new page for detailed issues
  if (issues.length > 0) {
    doc.addPage();
    doc.fontSize(16).fillColor('#1e40af').text('Detailed Issues', { underline: true });
    doc.moveDown(1);

    // Group issues by severity
    const groupedIssues = {
      ERROR: issues.filter((i: any) => i.severity === 'ERROR'),
      WARNING: issues.filter((i: any) => i.severity === 'WARNING'),
      INFO: issues.filter((i: any) => i.severity === 'INFO'),
    };

    Object.entries(groupedIssues).forEach(([severity, severityIssues]) => {
      if (severityIssues.length === 0) return;

      const severityConfig = {
        ERROR: { label: 'Critical Issues', color: '#dc2626', icon: '🔴' },
        WARNING: { label: 'Warnings', color: '#f59e0b', icon: '⚠️' },
        INFO: { label: 'Info', color: '#3b82f6', icon: 'ℹ️' },
      };

      const config = severityConfig[severity as keyof typeof severityConfig];

      doc.fontSize(14).fillColor(config.color).text(`${config.icon} ${config.label}`, { underline: false });
      doc.moveDown(0.5);

      severityIssues.slice(0, 10).forEach((issue: any, index: number) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(10).fillColor('#111827').text(`${index + 1}. ${issue.rule?.title || 'Unknown Rule'}`, { continued: false });
        doc.fontSize(9).fillColor('#6b7280').text(issue.description || 'No description available', { width: 500 });
        
        if (issue.context) {
          doc.fontSize(8).fillColor('#9ca3af').text(`Context: ${issue.context.substring(0, 100)}...`, { width: 500 });
        }
        
        doc.moveDown(0.8);
      });

      if (severityIssues.length > 10) {
        doc.fontSize(9).fillColor('#6b7280').text(`... and ${severityIssues.length - 10} more issues`);
      }

      doc.moveDown(1);
    });
  }

  // Recommendations page
  if (recommendations.length > 0) {
    doc.addPage();
    doc.fontSize(16).fillColor('#1e40af').text('AI-Powered Recommendations', { underline: true });
    doc.moveDown(1);

    recommendations.slice(0, 8).forEach((rec: any, index: number) => {
      if (doc.y > 680) {
        doc.addPage();
      }

      const priorityConfig = {
        CRITICAL: { color: '#dc2626', label: '🚨 Critical' },
        HIGH: { color: '#f59e0b', label: '⚠️ High' },
        MEDIUM: { color: '#3b82f6', label: '📊 Medium' },
        LOW: { color: '#6b7280', label: '📝 Low' },
      };

      const config = priorityConfig[rec.priority as keyof typeof priorityConfig] || priorityConfig.LOW;

      doc.fontSize(11).fillColor(config.color).text(`${config.label} - ${rec.title}`, { underline: false });
      doc.fontSize(9).fillColor('#374151').text(rec.description, { width: 500 });
      doc.fontSize(8).fillColor('#6b7280').text(`Impact: ${rec.impact}`, { width: 500 });
      doc.fontSize(8).fillColor('#059669').text(`Estimated Value: ${rec.estimatedValue}/100 | Effort: ${rec.effort}`, { width: 500 });
      doc.moveDown(1);
    });

    if (recommendations.length > 8) {
      doc.fontSize(9).fillColor('#6b7280').text(`... and ${recommendations.length - 8} more recommendations`);
    }
  }

  // Footer
  doc.fontSize(8).fillColor('#9ca3af').text(
    `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | FixFirst SEO Audit Tool`,
    50,
    750,
    { align: 'center', width: 495 }
  );
}

/**
 * Get color based on score value
 */
function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // green
  if (score >= 75) return '#f59e0b'; // orange
  return '#dc2626'; // red
}

/**
 * Generate CSV export for audit issues
 */
export async function generateIssuesCSV(auditId: string): Promise<string> {
  const issues = await prisma.issue.findMany({
    where: { auditId },
    include: {
      rule: true,
    },
  });

  const data = issues.map((issue) => ({
    Severity: issue.severity,
    Rule: issue.rule?.title || 'Unknown',
    Description: issue.description,
    Impact: issue.impact || 'N/A',
    Context: issue.context || 'N/A',
    'Created At': new Date(issue.createdAt).toISOString(),
  }));

  return stringify(data, { header: true });
}

/**
 * Generate CSV export for recommendations
 */
export async function generateRecommendationsCSV(auditId: string): Promise<string> {
  const recommendations = await prisma.recommendation.findMany({
    where: { auditId },
    orderBy: [{ priority: 'asc' }, { estimatedValue: 'desc' }],
  });

  const data = recommendations.map((rec) => ({
    Priority: rec.priority,
    Category: rec.category,
    Title: rec.title,
    Description: rec.description,
    Impact: rec.impact,
    Effort: rec.effort,
    'Estimated Value': rec.estimatedValue,
    Implemented: rec.isImplemented ? 'Yes' : 'No',
    'Created At': new Date(rec.createdAt).toISOString(),
  }));

  return stringify(data, { header: true });
}

/**
 * Generate combined analytics CSV
 */
export async function generateAnalyticsCSV(projectId: string): Promise<string> {
  const audits = await prisma.audit.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      _count: {
        select: {
          issues: true,
          recommendations: true,
        },
      },
    },
  });

  const data = audits.map((audit) => ({
    Date: new Date(audit.createdAt).toISOString(),
    Status: audit.status,
    'Overall Score': audit.overallScore,
    'Performance Score': audit.performanceScore,
    'SEO Score': audit.seoScore,
    'Accessibility Score': audit.accessibilityScore,
    'Best Practices Score': audit.bestPracticesScore,
    'Issues Count': audit._count.issues,
    'Recommendations Count': audit._count.recommendations,
    'Duration (s)': audit.duration ? (audit.duration / 1000).toFixed(2) : 'N/A',
  }));

  return stringify(data, { header: true });
}

