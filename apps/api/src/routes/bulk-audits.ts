import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { parse } from 'csv-parse/sync';
import { auditQueue } from '../queue/audit-queue';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

// Process bulk audit CSV file
router.post('/upload', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read and parse CSV file
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError: any) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid CSV format', details: parseError.message });
    }

    // Validate CSV has required columns (url)
    if (records.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    if (!records[0].url && !records[0].URL) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'CSV must have a "url" column',
        example: 'url,name (optional)\nhttps://example.com,Example Site'
      });
    }

    // Get user's plan tier for limits
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { planTier: true },
    });

    const maxPages = user?.planTier === 'FREE' ? 10 : 
                    user?.planTier === 'PRO' ? 50 : 100;

    // Process each URL
    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const url = (record.url || record.URL)?.trim();
      const projectName = record.name || record.project || `Bulk Audit ${i + 1}`;

      if (!url) {
        errors.push({ row: i + 1, error: 'Missing URL' });
        continue;
      }

      try {
        // Validate URL
        new URL(url);

        // Find or create project
        const domain = new URL(url).hostname;
        let project = await prisma.project.findFirst({
          where: {
            userId: req.userId,
            domain,
          },
        });

        if (!project) {
          project = await prisma.project.create({
            data: {
              userId: req.userId!,
              domain,
              name: projectName,
            },
          });
        }

        // Create audit
        const audit = await prisma.audit.create({
          data: {
            projectId: project.id,
            url,
            status: 'QUEUED',
          },
        });

        // Add to queue
        await auditQueue.add('audit', {
          auditId: audit.id,
          url,
          projectId: project.id,
          userId: req.userId!,
          maxPages,
        });

        results.push({
          row: i + 1,
          url,
          auditId: audit.id,
          projectId: project.id,
          status: 'queued',
        });
      } catch (error: any) {
        errors.push({ 
          row: i + 1, 
          url, 
          error: error.message 
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      totalProcessed: records.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// Get sample CSV template
router.get('/template', (req, res) => {
  const csvContent = `url,name
https://example.com,Example Website
https://another-site.com,Another Site`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bulk-audit-template.csv"');
  res.send(csvContent);
});

export { router as bulkAuditsRoutes };

