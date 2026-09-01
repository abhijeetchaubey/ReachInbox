import { Worker, Job } from 'bullmq';
import { redisClient } from '../services/redis';
import { EMAIL_QUEUE_NAME, getEmailQueue } from './emailQueue';
import { prisma } from '../services/prisma';
import { sendEtherealEmail } from '../services/ethereal';
import { sendSlackRateLimitNotification } from '../services/slack';
import { indexEmailDoc } from '../services/elasticsearch';
import { config } from '../config';

function getHourWindowKey(senderEmail: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  return `rate_limit:${senderEmail}:${year}-${month}-${day}-${hour}`;
}

function getMsUntilNextHourWindow(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
  return nextHour.getTime() - now.getTime();
}

let workerInstance: Worker | null = null;

export function initEmailWorker(): Worker {
  if (workerInstance) return workerInstance;

  if (!redisClient) {
    throw new Error('[BullMQ Worker] Redis client not initialized yet. Call initRedis() before initEmailWorker().');
  }

  workerInstance = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job) => {
      const emailJobId = job.data?.emailJobId || job.data?.id;
      const { userId, senderEmail, recipientEmail, subject, body, delayBetweenSec, hourlyLimit } = job.data || {};

      console.log(`[Worker] Processing email job ${emailJobId} -> ${recipientEmail}`);

      if (!emailJobId) {
        console.warn(`[Worker] Job ${job.id} has no valid emailJobId in job.data. Skipping.`);
        return;
      }

      // 1. Check DB email job record
      const emailRecord = await prisma.emailJob.findUnique({
        where: { id: emailJobId },
      });

      if (!emailRecord) {
        console.warn(`[Worker] Job ${emailJobId} not found in DB. Skipping.`);
        return;
      }

      if (emailRecord.status === 'SENT') {
        console.log(`[Worker] Job ${emailJobId} already sent. Idempotent skip.`);
        return;
      }

      // Update status to SENDING
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'SENDING' },
      });

      // 2. Check Rate Limit via Redis counter
      const rateLimitKey = getHourWindowKey(senderEmail);
      const currentCount = await redisClient.incr(rateLimitKey);

      // Set TTL on key for 2 hours if new key
      if (currentCount === 1) {
        await redisClient.expire(rateLimitKey, 7200);
      }

      const limit = hourlyLimit || config.defaultHourlyLimit;

      if (currentCount > limit) {
        console.warn(
          `[Worker] SENDER RATE LIMIT EXCEEDED for ${senderEmail}! Count: ${currentCount}, Limit: ${limit}. Rescheduling job ${emailJobId}.`
        );

        // Decrement count since job was blocked
        await redisClient.decr(rateLimitKey);

        // Trigger Slack Notification live alert
        await sendSlackRateLimitNotification(userId, senderEmail, limit, currentCount - limit);

        // Calculate delay to next hour window
        const delayMs = getMsUntilNextHourWindow();
        const nextScheduledAt = new Date(Date.now() + delayMs);

        // Update DB record
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'RATE_LIMITED',
            scheduledAt: nextScheduledAt,
            errorMessage: `Rate limit hit (${limit}/hr). Rescheduled to next hour window.`,
          },
        });

        // Update ES
        await indexEmailDoc({
          id: emailJobId,
          userId,
          senderEmail,
          recipientEmail,
          subject,
          body,
          status: 'RATE_LIMITED',
          scheduledAt: nextScheduledAt,
          createdAt: emailRecord.createdAt,
        });

        // Reschedule in BullMQ with delay
        const queue = getEmailQueue();
        await queue.add(
          'send-email',
          {
            ...job.data,
            scheduledAt: nextScheduledAt.toISOString(),
          },
          {
            jobId: `rescheduled-${emailJobId}-${Date.now()}`,
            delay: delayMs,
          }
        );

        return;
      }

      // 3. Minimum Delay between individual emails (mimic throttling)
      const minDelayMs = (delayBetweenSec || config.defaultMinDelaySec) * 1000;
      if (minDelayMs > 0) {
        console.log(`[Worker] Applying minimum delay throttling of ${minDelayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, minDelayMs));
      }

      // 4. Send Email via Ethereal SMTP
      try {
        const sendResult = await sendEtherealEmail({
          from: senderEmail,
          to: recipientEmail,
          subject,
          text: body,
        });

        const sentAt = new Date();

        // Update DB
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'SENT',
            sentAt,
            etherealPreviewUrl: sendResult.previewUrl,
            errorMessage: null,
          },
        });

        // Update Elasticsearch
        await indexEmailDoc({
          id: emailJobId,
          userId,
          senderEmail,
          recipientEmail,
          subject,
          body,
          status: 'SENT',
          scheduledAt: emailRecord.scheduledAt,
          sentAt,
          etherealPreviewUrl: sendResult.previewUrl,
          createdAt: emailRecord.createdAt,
        });

        console.log(`[Worker] Successfully sent email job ${emailJobId} to ${recipientEmail}`);
      } catch (err: any) {
        console.error(`[Worker] Error sending email job ${emailJobId}:`, err.message);

        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'FAILED',
            errorMessage: err.message,
          },
        });

        await indexEmailDoc({
          id: emailJobId,
          userId,
          senderEmail,
          recipientEmail,
          subject,
          body,
          status: 'FAILED',
          scheduledAt: emailRecord.scheduledAt,
          createdAt: emailRecord.createdAt,
        });

        throw err;
      }
    },
    {
      connection: redisClient as any,
      concurrency: config.workerConcurrency,
    }
  );

  workerInstance.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed.`);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
  });

  return workerInstance;
}
