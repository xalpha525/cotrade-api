import type { ChainId } from '@copytrading/db';
import type { DecodedInstruction, IDexDecoder } from './interfaces.js';
import { extractSolanaSwapData } from './solana-swap-extractor.js';

export class JupiterDecoder implements IDexDecoder {
  readonly dexId = 'JUPITER';
  readonly supportedChains: ChainId[] = ['SOLANA_MAINNET'];

  canDecode(programId: string): boolean {
    return programId === 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' || programId.includes('JUP');
  }

  decode(rawPayload: Record<string, unknown>, walletAddress?: string): DecodedInstruction {
    const swap = extractSolanaSwapData(rawPayload, walletAddress);

    if (!swap) {
      return {
        actionType: 'UNKNOWN',
        dexId: this.dexId,
        rawPayload,
      };
    }

    return {
      actionType: 'SWAP',
      dexId: this.dexId,
      swapData: {
        dexId: this.dexId,
        tokenInAddress: swap.tokenInAddress,
        tokenOutAddress: swap.tokenOutAddress,
        amountIn: swap.amountIn,
        amountOut: swap.amountOut,
      },
      rawPayload,
    };
  }
}
