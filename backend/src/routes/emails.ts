import { Router, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { scheduleEmailJob } from '../queue/emailQueue';
import { prisma } from '../services/prisma';
import { searchEmails } from '../services/elasticsearch';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// CSV file parse helper
function extractEmailAddresses(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return Array.from(new Set(matches.map((e) => e.trim().toLowerCase())));
}

// 1. Schedule New Emails Campaign
router.post('/schedule', authenticateToken, upload.single('csvFile'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject, body, recipients, startTime, delayBetweenSec, hourlyLimit, senderEmail } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and Body are required fields' });
    }

    let recipientList: string[] = [];

    // Check if CSV file uploaded
    if (req.file) {
      const csvContent = req.file.buffer.toString('utf-8');
      recipientList = extractEmailAddresses(csvContent);
    } else if (recipients) {
      if (Array.isArray(recipients)) {
        recipientList = recipients;
      } else if (typeof recipients === 'string') {
        recipientList = extractEmailAddresses(recipients);
      }
    }

    if (recipientList.length === 0) {
      return res.status(400).json({ error: 'No valid recipient email addresses found' });
    }

    const userId = req.user!.id;
    const userSenderEmail = senderEmail || req.user!.email;
    const delayBetweenSeconds = parseInt(delayBetweenSec || '2', 10);
    const limit = parseInt(hourlyLimit || '200', 10);

    const startDateTime = startTime ? new Date(startTime) : new Date();

    console.log(`[Schedule API] Scheduling ${recipientList.length} email(s) for user ${userId} starting at ${startDateTime.toISOString()}`);

    const scheduledJobs = [];

    for (let i = 0; i < recipientList.length; i++) {
      const recipient = recipientList[i];
      // Target send timeOffset for each recipient: startDateTime + i * delayBetweenSeconds
      const jobScheduledAt = new Date(startDateTime.getTime() + i * delayBetweenSeconds * 1000);

      const job = await scheduleEmailJob({
        userId,
        senderEmail: userSenderEmail,
        recipientEmail: recipient,
        subject,
        body,
        scheduledAt: jobScheduledAt,
        delayBetweenSec: delayBetweenSeconds,
        hourlyLimit: limit,
      });

      scheduledJobs.push(job);
    }

    return res.status(201).json({
      message: `Successfully scheduled ${scheduledJobs.length} email(s)`,
      count: scheduledJobs.length,
      scheduledJobs,
    });
  } catch (err: any) {
    console.error('[Schedule API Error]:', err);
    return res.status(500).json({ error: 'Failed to schedule emails', details: err.message });
  }
});

// 2. Get Scheduled Emails
router.get('/scheduled', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scheduled = await prisma.emailJob.findMany({
      where: {
        userId: req.user!.id,
        status: { in: ['SCHEDULED', 'SENDING', 'RATE_LIMITED'] },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return res.json(scheduled);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Get Sent & Failed Emails
router.get('/sent', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sent = await prisma.emailJob.findMany({
      where: {
        userId: req.user!.id,
        status: { in: ['SENT', 'FAILED'] },
      },
      orderBy: { sentAt: 'desc' },
    });

    return res.json(sent);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Search Emails via Elasticsearch
router.get('/search', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, status } = req.query;
    const queryText = (q as string) || '';
    const statusFilter = (status as string) || undefined;

    const results = await searchEmails(req.user!.id, queryText, statusFilter);
    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Cancel Scheduled Email
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const emailJob = await prisma.emailJob.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!emailJob) {
      return res.status(404).json({ error: 'Email job not found' });
    }

    if (emailJob.status === 'SENT') {
      return res.status(400).json({ error: 'Cannot cancel an email that has already been sent' });
    }

    await prisma.emailJob.delete({
      where: { id: emailJob.id },
    });

    return res.json({ message: 'Email job cancelled successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
