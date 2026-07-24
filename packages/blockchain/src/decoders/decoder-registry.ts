import type { DecodedInstruction, IDexDecoder } from './interfaces.js';
import { extractSolanaSwapData } from './solana-swap-extractor.js';

export class DecoderRegistry {
  private decoders: IDexDecoder[] = [];

  register(decoder: IDexDecoder): void {
    this.decoders.push(decoder);
  }

  decodeTransaction(programIdOrContract: string, rawPayload: Record<string, unknown>, walletAddress?: string): DecodedInstruction {
    for (const decoder of this.decoders) {
      if (decoder.canDecode(programIdOrContract, rawPayload)) {
        const decoded = decoder.decode(rawPayload, walletAddress);
        if (decoded.actionType !== 'UNKNOWN') {
          return decoded;
        }
      }
    }

    // Fallback: extract swap data directly from standard Solana RPC pre/post token balance changes
    const fallbackSwap = extractSolanaSwapData(rawPayload, walletAddress);
    if (fallbackSwap) {
      return {
        actionType: 'SWAP',
        dexId: 'SOLANA_DEX',
        swapData: {
          dexId: 'SOLANA_DEX',
          tokenInAddress: fallbackSwap.tokenInAddress,
          tokenOutAddress: fallbackSwap.tokenOutAddress,
          amountIn: fallbackSwap.amountIn,
          amountOut: fallbackSwap.amountOut,
        },
        rawPayload,
      };
    }

    return {
      actionType: 'UNKNOWN',
      rawPayload,
    };
  }
}
