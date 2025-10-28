import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { AuditJobData } from '@seo-audit/shared';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const auditQueue = new Queue<AuditJobData>('audit-jobs', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

export async function addAuditJob(data: AuditJobData): Promise<Job<AuditJobData>> {
  return await auditQueue.add('run-audit', data, {
    jobId: data.auditId,
  });
}

export async function getJobStatus(auditId: string) {
  const job = await auditQueue.getJob(auditId);
  if (!job) return null;
  
  const state = await job.getState();
  const progress = job.progress;
  
  return {
    id: job.id,
    state,
    progress,
    data: job.data,
  };
}

