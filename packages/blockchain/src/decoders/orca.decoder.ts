import type { ChainId } from '@copytrading/db';
import type { DecodedInstruction, IDexDecoder } from './interfaces.js';

export class OrcaDecoder implements IDexDecoder {
  readonly dexId = 'ORCA';
  readonly supportedChains: ChainId[] = ['SOLANA_MAINNET'];

  canDecode(programId: string): boolean {
    return programId === 'whirLMiicVdio4qvUfM5KAgZaXPufwPv4Y5AoKq7w3D';
  }

  decode(rawPayload: Record<string, unknown>): DecodedInstruction {
    const tokenIn = (rawPayload['tokenIn'] as string) || (rawPayload['mintIn'] as string);
    const tokenOut = (rawPayload['tokenOut'] as string) || (rawPayload['mintOut'] as string);
    const amountIn = (rawPayload['amountIn'] as string) || (rawPayload['inAmount'] as string);
    const amountOut = (rawPayload['amountOut'] as string) || (rawPayload['outAmount'] as string);

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
