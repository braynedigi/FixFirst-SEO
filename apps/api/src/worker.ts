import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { AuditJobData } from '@seo-audit/shared';
import { WebCrawler, RuleEngine, psiService } from '@seo-audit/audit-engine';
import { calculateTotalScore, calculateCategoryScores } from '@seo-audit/shared';
import { emailService } from './services/email-service';
import { slackService } from './services/slack-service';
import { sendAuditCompletionEmail } from './services/emailService';
import { webhookService } from './services/webhookService';
import { notificationService } from './services/notificationService';
import { io as ioClient } from 'socket.io-client';

dotenv.config();

// Connect to the API server's WebSocket
const socket = ioClient(process.env.SOCKET_URL || 'http://localhost:3001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

socket.on('connect', () => {
  console.log('🔌 Worker connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('⚠️ Worker disconnected from WebSocket server');
});

const prisma = new PrismaClient();
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const crawler = new WebCrawler();
const ruleEngine = new RuleEngine();

async function processAudit(job: Job<AuditJobData>) {
  const { auditId, url, projectId, maxPages = 25 } = job.data;

  console.log(`[Worker] Starting audit ${auditId} for ${url}`);

  try {
    // Update audit status to running
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'RUNNING' },
    });

    // Emit status change via WebSocket
    socket.emit('worker-audit-update', { auditId, data: {
      status: 'RUNNING',
      progress: 0,
      message: 'Starting audit...',
    }});

    // Stage 1: Crawling (0-50%)
    await job.updateProgress({
      stage: 'crawling',
      progress: 10,
      message: `Crawling ${url}...`,
    });

    socket.emit('worker-audit-update', { auditId, data: {
      stage: 'crawling',
      progress: 10,
      message: `Crawling ${url}...`,
    }});

    await crawler.initialize();
    const pages = await crawler.crawlWebsite(url, maxPages);
    
    if (pages.length === 0) {
      throw new Error('No pages could be crawled');
    }

    await job.updateProgress({
      stage: 'crawling',
      progress: 50,
      message: `Crawled ${pages.length} pages`,
    });

    socket.emit('worker-audit-update', { auditId, data: {
      stage: 'crawling',
      progress: 50,
      message: `Crawled ${pages.length} pages`,
    }});

    // Save pages to database
    for (const page of pages) {
      await prisma.page.create({
        data: {
          auditId,
          url: page.url,
          statusCode: page.statusCode,
          loadTime: page.loadTime,
          pageSize: page.pageSize,
          htmlSnapshot: page.html.substring(0, 50000), // Limit to 50KB
        },
      });
    }

    // Stage 2: PageSpeed Insights Analysis (50-60%)
    await job.updateProgress({
      stage: 'psi',
      progress: 50,
      message: 'Analyzing Core Web Vitals with PageSpeed Insights...',
    });

    socket.emit('worker-audit-update', { auditId, data: {
      stage: 'psi',
      progress: 55,
      message: 'Analyzing Core Web Vitals...',
    }});

    let psiData = null;
    try {
      psiData = await psiService.analyzeUrl(url);
      console.log(`[Worker] PSI analysis completed for ${url}`);
    } catch (error) {
      console.warn(`[Worker] PSI analysis failed for ${url}, continuing without it:`, error);
      // Don't fail the audit if PSI fails
    }

    // Stage 3: Analyzing SEO Rules (60-80%)
    await job.updateProgress({
      stage: 'analyzing',
      progress: 65,
      message: 'Running audit rules...',
    });

    socket.emit('worker-audit-update', { auditId, data: {
      stage: 'analyzing',
      progress: 65,
      message: 'Running audit rules...',
    }});

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const results = await ruleEngine.runAudit(pages, project?.domain || '');

    await job.updateProgress({
      stage: 'analyzing',
      progress: 80,
      message: 'Saving results...',
    });

    socket.emit('worker-audit-update', { auditId, data: {
      stage: 'analyzing',
      progress: 80,
      message: 'Saving results...',
    }});

    // Save issues to database
    for (const [ruleId, result] of results.entries()) {
      for (const issue of result.issues) {
        await prisma.issue.create({
          data: {
            auditId,
            pageId: issue.pageId,
            ruleId,
            severity: issue.severity.toUpperCase() as any,
            message: issue.message,
            recommendation: issue.recommendation,
            metadata: issue.metadata,
          },
        });
      }
    }

    // Stage 4: Scoring (80-100%)
    await job.updateProgress({
      stage: 'scoring',
      progress: 90,
      message: 'Calculating scores...',
    });

    socket.emit('worker-audit-update', { auditId, data: {
      stage: 'scoring',
      progress: 90,
      message: 'Calculating scores...',
    }});

    // Calculate scores
    const totalScore = calculateTotalScore(results);
    
    const ruleCategories = new Map();
    ruleEngine.getAllRules().forEach(rule => {
      ruleCategories.set(rule.id, rule.category);
    });

    const categoryWeights = {
      technical: 35,
      onpage: 25,
      'structured-data': 20,
      performance: 15,
      'local-seo': 5,
    };

    const categoryScores = calculateCategoryScores(results, ruleCategories, categoryWeights);

    // Update audit with final scores and PSI data
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalScore,
        technicalScore: categoryScores.technical,
        onPageScore: categoryScores.onpage,
        structuredDataScore: categoryScores['structured-data'],
        performanceScore: categoryScores.performance,
        localSeoScore: categoryScores['local-seo'],
        psiData: psiData || undefined,
      },
    });

    await job.updateProgress({
      stage: 'completed',
      progress: 100,
      message: 'Audit completed!',
    });

    // Emit completion via WebSocket
    socket.emit('worker-audit-update', { auditId, data: {
      status: 'COMPLETED',
      progress: 100,
      message: 'Audit completed!',
      totalScore,
      categoryScores,
    }});

    console.log(`[Worker] Completed audit ${auditId} with score ${totalScore}`);

    // Trigger webhooks for audit completion
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { projectId, enabled: true },
      });
      
      if (webhooks.length > 0) {
        await webhookService.triggerWebhooks(webhooks, 'audit.completed', {
          auditId,
          url,
          projectId,
          totalScore,
          categoryScores,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (webhookError) {
      console.error(`[Worker] Failed to trigger webhooks:`, webhookError);
      // Don't fail the audit if webhooks fail
    }

    // Create notifications for project owner and members
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: true,
        },
      });

      if (project) {
        const userIds = [project.userId, ...project.members.map(m => m.userId)];
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
        
        // Determine priority based on score
        let priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL';
        if (totalScore >= 80) priority = 'LOW';
        else if (totalScore >= 60) priority = 'NORMAL';
        else if (totalScore >= 40) priority = 'HIGH';
        else priority = 'URGENT';

        await notificationService.createBulkNotifications(userIds, {
          type: 'AUDIT_COMPLETED',
          title: `Audit Completed: ${project.name}`,
          message: `SEO audit for ${url} completed with a score of ${totalScore}/100`,
          actionUrl: `${frontendUrl}/audit/${auditId}`,
          priority,
          metadata: {
            auditId,
            projectId,
            projectName: project.name,
            url,
            totalScore,
            categoryScores,
          },
          channels: ['IN_APP', 'EMAIL'],
        });

        // Check notification rules
        await notificationService.checkAndTriggerRules('audit.completed', {
          auditId,
          projectId,
          projectName: project.name,
          url,
          totalScore,
          categoryScores,
          actionUrl: `${frontendUrl}/audit/${auditId}`,
        });
      }
    } catch (notificationError) {
      console.error(`[Worker] Failed to create notifications:`, notificationError);
      // Don't fail the audit if notifications fail
    }

    // Send completion email if enabled
    try {
      // Send email notification using new email service
      await sendAuditCompletionEmail(auditId);

      // Also send Slack notification
      const user = await prisma.user.findFirst({
        where: {
          projects: {
            some: { id: projectId },
          },
        },
        select: {
          id: true,
          email: true,
          slackWebhookUrl: true,
        },
      });

      if (user?.slackWebhookUrl) {
        try {
          const issuesCount = await prisma.issue.count({ where: { auditId } });
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
          
          await slackService.sendAuditCompleteNotification(user.slackWebhookUrl, {
            url,
            score: totalScore,
            issuesCount,
            auditUrl: `${frontendUrl}/audit/${auditId}`,
          });
          console.log(`[Worker] ✅ Sent Slack notification for audit ${auditId}`);
        } catch (slackError) {
          console.error(`[Worker] Failed to send Slack notification:`, slackError);
        }
      }
    } catch (emailError) {
      console.error(`[Worker] Failed to send completion email:`, emailError);
      // Don't fail the audit if email fails
    }
  } catch (error: any) {
    console.error(`[Worker] Error processing audit ${auditId}:`, error);
    
    // Get current audit to check retry count
    const failedAudit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: { retryCount: true, maxRetries: true, url: true, projectId: true },
    });

    const canRetry = failedAudit && failedAudit.retryCount < failedAudit.maxRetries;

    if (canRetry) {
      // Increment retry count and queue for retry with exponential backoff
      const retryCount = failedAudit.retryCount + 1;
      const retryDelayMs = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s delays
      
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: 'QUEUED',
          retryCount,
          errorMessage: `Retry ${retryCount}/${failedAudit.maxRetries}: ${error.message}`,
        },
      });

      console.log(`[Worker] ⚡ Scheduling retry ${retryCount}/${failedAudit.maxRetries} for audit ${auditId} in ${retryDelayMs}ms`);
      
      // Re-queue with delay
      setTimeout(() => {
        redisClient.rPush('audit-queue', auditId);
        console.log(`[Worker] 🔄 Re-queued audit ${auditId} for retry ${retryCount}`);
      }, retryDelayMs);

      // Emit retry status via WebSocket
      socket.emit('worker-audit-update', { auditId, data: {
        status: 'QUEUED',
        progress: 0,
        message: `Retrying audit (${retryCount}/${failedAudit.maxRetries})...`,
        retrying: true,
        retryCount,
      }});
    } else {
      // Max retries reached or no retries available
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
          metadata: { error: error.message, retriesExhausted: failedAudit?.retryCount >= failedAudit?.maxRetries },
        },
      });

      // Emit failure via WebSocket
      socket.emit('worker-audit-update', { auditId, data: {
        status: 'FAILED',
        progress: 100,
        message: `Audit failed after ${failedAudit?.retryCount || 0} retries: ${error.message}`,
        error: error.message,
      }});

      // Trigger webhooks for audit failure
      if (failedAudit?.projectId) {
        try {
          const webhooks = await prisma.webhook.findMany({
            where: { projectId: failedAudit.projectId, enabled: true },
          });
          
          if (webhooks.length > 0) {
            await webhookService.triggerWebhooks(webhooks, 'audit.failed', {
              auditId,
              url: failedAudit.url,
              projectId: failedAudit.projectId,
              error: error.message,
              retryCount: failedAudit.retryCount,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (webhookError) {
          console.error(`[Worker] Failed to trigger failure webhooks:`, webhookError);
        }

        // Create failure notifications
        try {
          const project = await prisma.project.findUnique({
            where: { id: failedAudit.projectId },
            include: { members: true },
          });

          if (project) {
            const userIds = [project.userId, ...project.members.map(m => m.userId)];
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';

            await notificationService.createBulkNotifications(userIds, {
              type: 'AUDIT_FAILED',
              title: `Audit Failed: ${project.name}`,
              message: `SEO audit for ${failedAudit.url} failed after ${failedAudit.retryCount} retries: ${error.message}`,
              actionUrl: `${frontendUrl}/project/${failedAudit.projectId}`,
              priority: 'HIGH',
              metadata: {
                auditId,
                projectId: failedAudit.projectId,
                projectName: project.name,
                url: failedAudit.url,
                error: error.message,
                retryCount: failedAudit.retryCount,
              },
              channels: ['IN_APP', 'EMAIL'],
            });

            // Check notification rules
            await notificationService.checkAndTriggerRules('audit.failed', {
              auditId,
              projectId: failedAudit.projectId,
              projectName: project.name,
              url: failedAudit.url,
              error: error.message,
              retryCount: failedAudit.retryCount,
              actionUrl: `${frontendUrl}/project/${failedAudit.projectId}`,
            });
          }
        } catch (notificationError) {
          console.error(`[Worker] Failed to create failure notifications:`, notificationError);
        }
      }
    }

    // Send failure email if enabled
    try {
      const user = await prisma.user.findFirst({
        where: {
          projects: {
            some: { id: projectId },
          },
        },
      });

      if (user && user.notificationPreferences) {
        const prefs = user.notificationPreferences as any;
        if (prefs.auditFailed !== false) {
          await emailService.sendAuditFailedEmail(user.email, {
            id: auditId,
            url,
            error: error.message,
          });
        }
      }
    } catch (emailError) {
      console.error(`[Worker] Failed to send failure email:`, emailError);
    }

    throw error;
  } finally {
    await crawler.close();
  }
}

// Create worker
const worker = new Worker<AuditJobData>('audit-jobs', processAudit, {
  connection,
  concurrency: 2,
  limiter: {
    max: 5,
    duration: 60000, // 5 jobs per minute
  },
});

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log('🔄 Worker started and listening for audit jobs...');

