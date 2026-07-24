import type { ChainId } from '@copytrading/db';
import type { DecodedInstruction, IDexDecoder } from './interfaces.js';

export class RaydiumDecoder implements IDexDecoder {
  readonly dexId = 'RAYDIUM';
  readonly supportedChains: ChainId[] = ['SOLANA_MAINNET'];

  canDecode(programId: string): boolean {
    return programId === '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8' || programId === 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK';
  }

  decode(rawPayload: Record<string, unknown>): DecodedInstruction {
    const tokenIn = (rawPayload['tokenIn'] as string) || (rawPayload['mintIn'] as string);
    const tokenOut = (rawPayload['tokenOut'] as string) || (rawPayload['mintOut'] as string);
    const amountIn = (rawPayload['amountIn'] as string) || (rawPayload['inAmount'] as string);
    const amountOut = (rawPayload['amountOut'] as string) || (rawPayload['outAmount'] as string);
    const pool = rawPayload['pool'] as string | undefined;

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
        ...(pool ? { poolAddress: pool } : {}),
        tokenInAddress: tokenIn,
        tokenOutAddress: tokenOut,
        amountIn,
        amountOut
      },
      rawPayload
    };
  }
}
