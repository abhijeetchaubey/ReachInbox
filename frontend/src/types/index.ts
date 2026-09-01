export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  slackConnected?: boolean;
}

export type JobStatus = 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'RATE_LIMITED';

export interface EmailJob {
  id: string;
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: JobStatus;
  scheduledAt: string;
  sentAt?: string | null;
  delayBetweenSec: number;
  hourlyLimit: number;
  errorMessage?: string | null;
  etherealPreviewUrl?: string | null;
  createdAt: string;
}

export interface ScheduleCampaignPayload {
  subject: string;
  body: string;
  recipients?: string[];
  csvFile?: File;
  startTime?: string;
  delayBetweenSec?: number;
  hourlyLimit?: number;
  senderEmail?: string;
}
