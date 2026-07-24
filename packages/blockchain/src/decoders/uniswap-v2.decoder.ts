import type { ChainId } from '@copytrading/db';
import type { DecodedInstruction, IDexDecoder } from './interfaces.js';

export class UniswapV2Decoder implements IDexDecoder {
  readonly dexId = 'UNISWAP_V2';
  readonly supportedChains: ChainId[] = ['ROBINHOOD_MAINNET'];

  canDecode(contractAddress: string): boolean {
    return contractAddress.toLowerCase() === '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
  }

  decode(rawPayload: Record<string, unknown>): DecodedInstruction {
    const tokenIn = (rawPayload['tokenIn'] as string) || (rawPayload['token0'] as string);
    const tokenOut = (rawPayload['tokenOut'] as string) || (rawPayload['token1'] as string);
    const amountIn = (rawPayload['amountIn'] as string) || (rawPayload['amount0In'] as string);
    const amountOut = (rawPayload['amountOut'] as string) || (rawPayload['amount1Out'] as string);

    if (!tokenIn || !tokenOut || !amountIn || !amountOut) {
      return {
        actionType: 'UNKNOWN',
        dexId: this.dexId,
        rawPayload
      };
    }

    return {
      actionType: 'SWAP',
      dexId: this.dexId,
      swapData: {
        dexId: this.dexId,
        tokenInAddress: tokenIn,
        tokenOutAddress: tokenOut,
        amountIn,
        amountOut
      },
      rawPayload
    };
  }
}
