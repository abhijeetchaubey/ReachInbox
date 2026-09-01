import { WebClient } from '@slack/web-api';
import { prisma } from './prisma';

export async function sendSlackRateLimitNotification(
  userId: string,
  senderEmail: string,
  hourlyLimit: number,
  rescheduledCount: number
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.warn(`[Slack Notifier] User ${userId} not found.`);
      return;
    }

    if (!user.slackWebhookUrl && !user.slackAccessToken) {
      console.log(`[Slack Notifier] User ${user.email} has not connected Slack. Skipping rate-limit notification.`);
      return;
    }

    const messagePayload = {
      text: `🚨 *ReachInbox Rate Limit Reached!*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Sender Hourly Rate Limit Alert',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender Email:*\n\`${senderEmail}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Configured Limit:*\n\`${hourlyLimit} emails/hour\``,
            },
            {
              type: 'mrkdwn',
              text: `*Rescheduled Jobs:*\n\`${rescheduledCount} email(s)\``,
            },
            {
              type: 'mrkdwn',
              text: `*Timestamp:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⚠️ *Action Taken:* The hourly rate limit for sender \`${senderEmail}\` was reached. Remaining emails have been safely rescheduled into the next available hour window to prevent provider throttling and preserve domain reputation.`,
          },
        },
      ],
    };

    // Send via Webhook if configured
    if (user.slackWebhookUrl) {
      const response = await fetch(user.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload),
      });

      if (response.ok) {
        console.log(`[Slack Notifier] Successfully sent rate-limit notification to Slack Webhook for ${user.email}`);
        return;
      } else {
        const errText = await response.text();
        console.error(`[Slack Notifier] Failed to send Slack Webhook message:`, errText);
      }
    }

    // Send via Slack Bot Access Token if configured
    if (user.slackAccessToken) {
      const slackWebClient = new WebClient(user.slackAccessToken);
      await slackWebClient.chat.postMessage({
        channel: 'general', // Default channel or stored channel ID
        ...messagePayload,
      });
      console.log(`[Slack Notifier] Successfully sent rate-limit notification via Slack Bot API for ${user.email}`);
    }
  } catch (err: any) {
    console.error(`[Slack Notifier] Error sending Slack notification:`, err.message);
  }
}
