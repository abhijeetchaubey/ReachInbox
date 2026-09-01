import express from 'express';
import cors from 'cors';
import { config } from './config';
import { prisma } from './services/prisma';
import { initRedis } from './services/redis';
import { initElasticsearch } from './services/elasticsearch';
import { getEmailQueue } from './queue/emailQueue';
import { initEmailWorker } from './queue/emailWorker';
import { adminQueueRouter, initBullBoard } from './routes/admin';

import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import slackRoutes from './routes/slack';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// BullMQ Live Dashboard Route
app.use('/admin/queues', adminQueueRouter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ReachInbox Email Job Scheduler',
  });
});

// Server Restart Sync Recovery
async function syncJobsOnServerRestart() {
  console.log('[Server Sync] Checking DB for pending jobs to sync with Redis BullMQ queue...');
  try {
    const pendingJobs = await prisma.emailJob.findMany({
      where: {
        status: { in: ['SCHEDULED', 'RATE_LIMITED'] },
      },
    });

    console.log(`[Server Sync] Found ${pendingJobs.length} pending email job(s) in DB.`);

    const queue = getEmailQueue();
    for (const job of pendingJobs) {
      const bullJob = await queue.getJob(job.bullJobId || job.id);
      if (!bullJob) {
        const delayMs = Math.max(0, job.scheduledAt.getTime() - Date.now());
        console.log(`[Server Sync] Job ${job.id} was missing from Redis queue. Re-enqueuing with ${delayMs}ms delay...`);

        await queue.add(
          'send-email',
          {
            emailJobId: job.id,
            userId: job.userId,
            senderEmail: job.senderEmail,
            recipientEmail: job.recipientEmail,
            subject: job.subject,
            body: job.body,
            scheduledAt: job.scheduledAt.toISOString(),
            delayBetweenSec: job.delayBetweenSec,
            hourlyLimit: job.hourlyLimit,
          },
          {
            jobId: job.bullJobId || job.id,
            delay: delayMs,
          }
        );
      } else {
        console.log(`[Server Sync] Job ${job.id} is actively queued in BullMQ. Status: ${await bullJob.getState()}`);
      }
    }
  } catch (err: any) {
    console.error('[Server Sync Error]:', err.message);
  }
}

async function startServer() {
  try {
    await prisma.$connect();
    console.log('[Database] Connected to Database successfully.');

    // 1. Initialize Redis first
    await initRedis();

    // 2. Initialize Worker & BullMQ Board
    initEmailWorker();
    initBullBoard();

    // 3. Initialize Elasticsearch & Sync Jobs
    await initElasticsearch();
    await syncJobsOnServerRestart();

    app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 ReachInbox Email Scheduler Backend running on port ${config.port}`);
      console.log(`📊 BullMQ Live Queue Dashboard: http://localhost:${config.port}/admin/queues`);
      console.log(`=======================================================`);
    });
  } catch (err: any) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
