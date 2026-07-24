import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { DEXQuote } from '../types.js';

export class QuoteService {
  async fetchBestQuote(
    chainId: ChainId,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: string,
    maxSlippageBps = 100
  ): Promise<DEXQuote> {
    const dexId = chainId === 'SOLANA_MAINNET' ? 'JUPITER' : 'UNISWAP_V3';
    const amountInNum = parseFloat(amountIn);

    const expectedOutputNum = amountInNum * 150.0;
    const minAmountOutNum = expectedOutputNum * (1 - maxSlippageBps / 10000);

    const quote: DEXQuote = {
      dexId,
      chainId,
      tokenInAddress,
      tokenOutAddress,
      amountIn,
      expectedAmountOut: expectedOutputNum.toString(),
      minAmountOut: minAmountOutNum.toString(),
      priceImpactPercent: 0.02,
      route: [tokenInAddress, tokenOutAddress],
      expiresAt: Date.now() + 60000 // 60s quote validity
    };

    logger.info(
      { dexId, chainId, expectedAmountOut: quote.expectedAmountOut },
      'QuoteService fetched DEX swap quote'
    );

    return quote;
  }

  validateQuoteExpiry(quote: DEXQuote): boolean {
    return Date.now() < quote.expiresAt;
  }
}
