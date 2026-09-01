import { Router, Response } from 'express';
import { prisma } from '../services/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { sendSlackRateLimitNotification } from '../services/slack';

const router = Router();

// Connect Slack Webhook URL directly
router.post('/connect-webhook', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return res.status(400).json({ error: 'Valid Slack incoming webhook URL required (https://hooks.slack.com/...)' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { slackWebhookUrl: webhookUrl },
    });

    // Send test notification to confirm connection
    await sendSlackRateLimitNotification(req.user!.id, req.user!.email, 200, 0);

    return res.json({
      message: 'Slack Webhook connected successfully',
      slackConnected: true,
      webhookUrl: updatedUser.slackWebhookUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// OAuth Callback handling
router.post('/oauth-callback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;

    if (clientId && clientSecret) {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri || '',
        }),
      });

      const data: any = await response.json();
      if (data.ok && data.access_token) {
        const webhookUrl = data.incoming_webhook?.url;

        await prisma.user.update({
          where: { id: req.user!.id },
          data: {
            slackAccessToken: data.access_token,
            slackWebhookUrl: webhookUrl || undefined,
          },
        });

        return res.json({ message: 'Slack connected via OAuth', slackConnected: true });
      } else {
        return res.status(400).json({ error: data.error || 'Failed to exchange Slack token' });
      }
    } else {
      return res.status(400).json({ error: 'Slack OAuth credentials not configured on backend env' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Disconnect Slack
router.post('/disconnect', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        slackWebhookUrl: null,
        slackAccessToken: null,
      },
    });

    return res.json({ message: 'Slack disconnected', slackConnected: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Test Notification Endpoint
router.post('/test-notification', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await sendSlackRateLimitNotification(req.user!.id, req.user!.email, 200, 5);
    return res.json({ message: 'Test notification triggered to Slack' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
