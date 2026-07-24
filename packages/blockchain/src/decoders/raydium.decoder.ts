import type { ChainId } from '@copytrading/db';
import type { DecodedInstruction, IDexDecoder } from './interfaces.js';
import { extractSolanaSwapData } from './solana-swap-extractor.js';

export class RaydiumDecoder implements IDexDecoder {
  readonly dexId = 'RAYDIUM';
  readonly supportedChains: ChainId[] = ['SOLANA_MAINNET'];

  canDecode(programId: string): boolean {
    return (
      programId === '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8' ||
      programId === 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK' ||
      programId.includes('raydium') ||
      programId.includes('Raydium')
    );
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
