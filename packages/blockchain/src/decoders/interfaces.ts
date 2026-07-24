import type { ChainId } from '@copytrading/db';

export type ActionType = 'SWAP' | 'TRANSFER' | 'LIQUIDITY_ADD' | 'LIQUIDITY_REMOVE' | 'UNKNOWN';

export interface SwapData {
  dexId: string;
  poolAddress?: string;
  tokenInAddress: string;
  tokenOutAddress: string;
  amountIn: string;
  amountOut: string;
  amountUsd?: string;
}

export interface DecodedInstruction {
  actionType: ActionType;
  dexId?: string;
  swapData?: SwapData;
  rawPayload: Record<string, unknown>;
}

export interface IDexDecoder {
  readonly dexId: string;
  readonly supportedChains: ChainId[];
  canDecode(programIdOrContract: string, rawPayload: Record<string, unknown>): boolean;
  decode(rawPayload: Record<string, unknown>): DecodedInstruction;
}
