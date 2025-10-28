import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { auditQueue } from '../queue/audit-queue';

const prisma = new PrismaClient();

/**
 * Calculate next run time based on frequency
 */
function calculateNextRun(frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Date {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}

/**
 * Check and run due schedules
 */
export async function checkSchedules() {
  try {
    const now = new Date();

    // Find all active schedules that are due
    const dueSchedules = await prisma.schedule.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            planTier: true,
          },
        },
        project: true,
      },
    });

    console.log(`[Scheduler] Found ${dueSchedules.length} due schedules`);

    for (const schedule of dueSchedules) {
      try {
        // Create audit for the scheduled URL
        const audit = await prisma.audit.create({
          data: {
            projectId: schedule.projectId,
            url: schedule.url,
            status: 'QUEUED',
          },
        });

        // Add audit job to queue
        const maxPages = schedule.user.planTier === 'FREE' ? 10 : 
                        schedule.user.planTier === 'PRO' ? 50 : 100;

        await auditQueue.add('audit', {
          auditId: audit.id,
          url: schedule.url,
          projectId: schedule.projectId,
          userId: schedule.userId,
          maxPages,
        });

        // Update schedule with next run time
        const nextRunAt = calculateNextRun(schedule.frequency);
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt,
          },
        });

        console.log(`[Scheduler] ✅ Queued audit for schedule ${schedule.id} (${schedule.url})`);
        console.log(`[Scheduler] Next run: ${nextRunAt.toISOString()}`);
      } catch (error: any) {
        console.error(`[Scheduler] ❌ Failed to process schedule ${schedule.id}:`, error.message);
        
        // Mark schedule as failed (optional: implement retry logic)
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            // Could add a failureCount field here
          },
        });
      }
    }
  } catch (error: any) {
    console.error('[Scheduler] Error checking schedules:', error.message);
  }
}

/**
 * Initialize scheduler
 * Runs every 5 minutes to check for due schedules
 */
export function startScheduler() {
  // Run every 5 minutes: */5 * * * *
  // For testing, you can use '* * * * *' (every minute)
  const task = cron.schedule('*/5 * * * *', async () => {
    await checkSchedules();
  });

  console.log('⏰ Scheduler started - checking every 5 minutes');

  // Run immediately on startup
  checkSchedules();

  return task;
}

/**
 * Stop scheduler (for graceful shutdown)
 */
export function stopScheduler(task: cron.ScheduledTask) {
  task.stop();
  console.log('⏰ Scheduler stopped');
}

