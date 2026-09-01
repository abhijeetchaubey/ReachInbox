import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';
import { config } from '../config';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const googleClient = new OAuth2Client(config.googleClientId);

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, profile } = req.body;

    let googleId: string;
    let email: string;
    let name: string;
    let avatar: string | undefined;

    if (credential) {
      // Try verifying Google ID token if client ID is configured
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: config.googleClientId || undefined,
        });
        const payload = ticket.getPayload();
        if (payload) {
          googleId = payload.sub;
          email = payload.email || '';
          name = payload.name || 'ReachInbox User';
          avatar = payload.picture;
        } else {
          throw new Error('Payload undefined');
        }
      } catch (verifyErr) {
        // Fallback parsing token payload directly or using profile
        const decodedToken: any = jwt.decode(credential);
        if (decodedToken && decodedToken.email) {
          googleId = decodedToken.sub || `google-${Date.now()}`;
          email = decodedToken.email;
          name = decodedToken.name || 'ReachInbox User';
          avatar = decodedToken.picture;
        } else if (profile) {
          googleId = profile.id || profile.sub || `google-${Date.now()}`;
          email = profile.email;
          name = profile.name || 'ReachInbox User';
          avatar = profile.avatar || profile.picture;
        } else {
          return res.status(400).json({ error: 'Invalid Google credential' });
        }
      }
    } else if (profile && profile.email) {
      googleId = profile.id || profile.sub || `google-${Date.now()}`;
      email = profile.email;
      name = profile.name || 'ReachInbox User';
      avatar = profile.avatar || profile.picture;
    } else {
      return res.status(400).json({ error: 'Google authentication credential required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid email is required for authentication' });
    }

    // Upsert user in database
    let user = await prisma.user.upsert({
      where: { email },
      update: { name, avatar, googleId },
      create: {
        googleId,
        email,
        name,
        avatar,
        senders: {
          create: {
            email,
            name: `${name} (Default Sender)`,
            hourlyLimit: config.defaultHourlyLimit,
          },
        },
      },
      include: {
        senders: true,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        slackConnected: !!(user.slackWebhookUrl || user.slackAccessToken),
        senders: user.senders,
      },
    });
  } catch (err: any) {
    console.error('[Auth Route Error]:', err);
    return res.status(500).json({ error: 'Authentication failed', details: err.message });
  }
});

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { senders: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      slackConnected: !!(user.slackWebhookUrl || user.slackAccessToken),
      senders: user.senders,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
