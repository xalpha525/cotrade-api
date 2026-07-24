import type { ChainId } from '@copytrading/db';

export interface IWalletSigner {
  readonly address: string;
  readonly chainId: ChainId;
  signTransaction(rawTx: UnsignedTransaction): Promise<SignedTransaction>;
}

export interface DEXQuote {
  dexId: string;
  chainId: ChainId;
  tokenInAddress: string;
  tokenOutAddress: string;
  amountIn: string;
  expectedAmountOut: string;
  minAmountOut: string;
  priceImpactPercent: number;
  route: string[];
  expiresAt: number;
}

export interface UnsignedTransaction {
  chainId: ChainId;
  fromAddress: string;
  toAddress: string;
  data: string;
  value: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  recentBlockhash?: string;
}

export interface SignedTransaction {
  txHash: string;
  rawPayload: string;
}

export interface TransactionReceipt {
  txHash: string;
  blockNumber: bigint;
  status: 'SUCCESS' | 'FAILED';
  gasUsed: string;
  effectiveGasPrice?: string;
  logs: string[];
  confirmedAt: Date;
}

export type ConfirmationStatus =
  | 'SUBMITTED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FINALIZED'
  | 'FAILED'
  | 'DROPPED'
  | 'EXPIRED';
