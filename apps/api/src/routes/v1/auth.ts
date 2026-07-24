import { Hono } from 'hono';
import { prisma } from '@copytrading/db';
import { authMiddleware } from '../../middleware/auth.js';
import type { HonoEnv } from '../../types/hono.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const authRoutes = new Hono<HonoEnv>();

// Public Privy Login & Sync Endpoint
authRoutes.post('/privy', async (c) => {
  try {
    const authHeader = c.req.header('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    let body: any = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }

    const token = body.token || headerToken || `privy_session_${Date.now()}`;
    const privyId = body.privyId || body.userId || `did:privy:${Date.now()}`;
    const email = body.email || null;
    const wallets = Array.isArray(body.wallets) ? body.wallets : [];

    console.log('[PRIVY AUTH ROUTE] Processing Privy login:', { privyId, email, walletCount: wallets.length });

    // Upsert User in DB — collision-safe
    // Use privyId as the primary unique key. If the provided email is already
    // claimed by a DIFFERENT user, generate a unique fallback so we never crash.
    const safeEmail = email || `privy_${privyId.replace(/[^a-z0-9]/gi, '_')}@privy.user`;

    let user;
    try {
      user = await prisma.user.upsert({
        where: { privyId },
        update: {
          ...(email ? { email } : {}),
        },
        create: {
          privyId,
          email: safeEmail,
          role: 'FOLLOWER',
        },
      });
    } catch (upsertErr: any) {
      // Handle email unique constraint collision (email already used by another privyId)
      if (upsertErr?.code === 'P2002' && upsertErr?.meta?.target?.includes('email')) {
        const fallbackEmail = `privy_${privyId.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}@privy.user`;
        user = await prisma.user.upsert({
          where: { privyId },
          update: {},
          create: {
            privyId,
            email: fallbackEmail,
            role: 'FOLLOWER',
          },
        });
      } else {
        throw upsertErr;
      }
    }

    // Sync Embedded Wallets into DB
    for (const w of wallets) {
      if (w && w.address) {
        const chainId =
          w.chainType === 'solana' || w.chainId === 'SOLANA_MAINNET'
            ? 'SOLANA_MAINNET'
            : 'ROBINHOOD_MAINNET';

        await prisma.wallet.upsert({
          where: {
            userId_address_chainId: {
              userId: user.id,
              address: w.address,
              chainId,
            },
          },
          update: {},
          create: {
            userId: user.id,
            address: w.address,
            chainId,
            isPrimary: true,
          },
        }).catch((e) => {
          console.warn('[PRIVY WALLET SYNC WARN]', e.message);
        });
      }
    }

    return sendSuccess(c, {
      token,
      user: {
        id: user.id,
        email: user.email,
        privyId: user.privyId,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('[PRIVY AUTH ROUTE ERROR]', err);
    return sendError(c, 'AUTH_ERROR', 'Failed to process Privy authentication', 500, err.message);
  }
});

// Protected Auth Routes
authRoutes.use('*', authMiddleware);

authRoutes.get('/me', (c) => {
  const user = c.get('user');
  return sendSuccess(c, user);
});

authRoutes.post('/sync', (c) => {
  const user = c.get('user');
  return sendSuccess(c, { synced: true, user });
});
