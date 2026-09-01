import { Queue } from 'bullmq';
import { redisClient } from '../services/redis';
import { prisma } from '../services/prisma';
import { indexEmailDoc } from '../services/elasticsearch';

export const EMAIL_QUEUE_NAME = 'email-queue';

let queueInstance: Queue | null = null;

export function getEmailQueue(): Queue {
  if (!queueInstance) {
    if (!redisClient) {
      throw new Error('[BullMQ Queue] Redis client not initialized yet. Call initRedis() before accessing emailQueue.');
    }
    queueInstance = new Queue(EMAIL_QUEUE_NAME, {
      connection: redisClient as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
  }
  return queueInstance;
}

// Proxy getter for backward compatibility
export const emailQueue = new Proxy({} as Queue, {
  get(target, prop, receiver) {
    const queue = getEmailQueue();
    const value = Reflect.get(queue, prop, receiver);
    return typeof value === 'function' ? value.bind(queue) : value;
  },
});

export interface ScheduleEmailPayload {
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  delayBetweenSec?: number;
  hourlyLimit?: number;
}

export async function scheduleEmailJob(payload: ScheduleEmailPayload) {
  const delayMs = Math.max(0, payload.scheduledAt.getTime() - Date.now());
  const delayBetweenSec = payload.delayBetweenSec ?? 2;
  const hourlyLimit = payload.hourlyLimit ?? 200;

  // 1. Create record in DB first
  const emailJob = await prisma.emailJob.create({
    data: {
      userId: payload.userId,
      bullJobId: '', // placeholder, updated below
      senderEmail: payload.senderEmail,
      recipientEmail: payload.recipientEmail,
      subject: payload.subject,
      body: payload.body,
      status: 'SCHEDULED',
      scheduledAt: payload.scheduledAt,
      delayBetweenSec,
      hourlyLimit,
    },
  });

  // 2. Use emailJob.id as BullMQ jobId for idempotency
  const bullJobId = emailJob.id;

  await prisma.emailJob.update({
    where: { id: emailJob.id },
    data: { bullJobId },
  });

  // 3. Add delayed job to BullMQ
  const queue = getEmailQueue();
  await queue.add(
    'send-email',
    {
      emailJobId: emailJob.id,
      userId: payload.userId,
      senderEmail: payload.senderEmail,
      recipientEmail: payload.recipientEmail,
      subject: payload.subject,
      body: payload.body,
      scheduledAt: payload.scheduledAt.toISOString(),
      delayBetweenSec,
      hourlyLimit,
    },
    {
      jobId: bullJobId, // Idempotent key
      delay: delayMs,
    }
  );

  // 4. Index in Elasticsearch
  await indexEmailDoc({
    id: emailJob.id,
    userId: payload.userId,
    senderEmail: payload.senderEmail,
    recipientEmail: payload.recipientEmail,
    subject: payload.subject,
    body: payload.body,
    status: 'SCHEDULED',
    scheduledAt: payload.scheduledAt,
    createdAt: emailJob.createdAt,
  });

  console.log(`[BullMQ] Enqueued email job ${emailJob.id} for ${payload.recipientEmail} with delay ${delayMs}ms`);

  return emailJob;
}
