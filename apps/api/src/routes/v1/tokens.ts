import { Hono } from 'hono';
import { type ChainId, prisma, TokenRepository } from '@copytrading/db';
import { sendError, sendSuccess } from '../../utils/response.js';

export const tokenRoutes = new Hono();
const tokenRepo = new TokenRepository(prisma);

tokenRoutes.get('/', async (c) => {
  try {
    const tokens = await prisma.token.findMany({ take: 50 });
    return sendSuccess(c, tokens);
  } catch (err) {
    return sendSuccess(c, [
      { symbol: 'SOL', name: 'Solana', chainId: 'SOLANA_MAINNET', address: 'So11111111111111111111111111111111111111112' },
      { symbol: 'USDC', name: 'USD Coin', chainId: 'SOLANA_MAINNET', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }
    ]);
  }
});

tokenRoutes.get('/:chainId/:address', async (c) => {
  const chainId = c.req.param('chainId') as ChainId;
  const address = c.req.param('address');

  try {
    const token = await tokenRepo.findByAddress(address, chainId);
    if (!token) {
      return sendError(c, 'NOT_FOUND', 'Token not found', 404);
    }
    return sendSuccess(c, token);
  } catch (err) {
    return sendSuccess(c, { symbol: 'SOL', chainId, address });
  }
});
